"""SealIt AI Certificate Analyzer.
Three-layer forensic pipeline: ELA + Metadata / OCR + Structure / Gemini Vision.

This is a standalone FastAPI microservice used to inspect uploaded certificates.
It exposes:
- GET /health
- POST /analyze

The service is intentionally isolated so it can be tested before wiring it into the
main RapidAuth frontend/backend flow.
"""

from __future__ import annotations

import io
import json
import logging
import os
import time
import textwrap
import shutil
from typing import Optional

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

os.environ.setdefault("PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION", "python")

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageChops, ImageDraw, ImageFont
import fitz  # PyMuPDF
import uvicorn
try:
    import google.generativeai as genai
except Exception:
    genai = None

try:
    import pytesseract
except Exception:
    pytesseract = None

TESSERACT_CANDIDATES = [
    shutil.which("tesseract"),
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]
TESSERACT_CMD = next((path for path in TESSERACT_CANDIDATES if path and os.path.exists(path)), None)
if pytesseract is not None and TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("sealit-ai")

app = FastAPI(title="SealIt AI Certificate Analyzer", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY and genai is not None:
    genai.configure(api_key=GEMINI_API_KEY)
    log.info("[OK] Gemini API configured successfully")
else:
    log.warning("[WARNING] Gemini Vision layer will be skipped in this environment")

if TESSERACT_CMD:
    log.info("[OK] Tesseract OCR configured: %s", TESSERACT_CMD)
else:
    log.warning("[WARNING] Tesseract OCR binary not found")

log.info("[START] SealIt AI Microservice starting up...")
log.info("[PIPELINE] ELA + Metadata  |  OCR + Structure  |  Gemini Vision")
log.info("[NETWORK] Listening on http://0.0.0.0:8000")


def pdf_to_image(file_bytes: bytes) -> Image.Image:
    """Render first page of PDF to RGB image using PyMuPDF (fitz)."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if not doc:
            raise ValueError("Empty or invalid PDF")
        page = doc[0]
        pix = page.get_pixmap(dpi=200)
        mode = "RGBA" if pix.alpha else "RGB"
        img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)
        if mode == "RGBA":
            # Convert to RGB with white background
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
        return img
    except Exception as exc:
        raise RuntimeError(f"PyMuPDF rasterization failed: {exc}")


def extract_pdf_text(file_bytes: bytes) -> str:
    """Extract text from the first few pages of a PDF using PyMuPDF."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        chunks = []
        for page in doc[:3]:
            page_text = page.get_text() or ""
            if page_text.strip():
                chunks.append(page_text.strip())
        return "\n".join(chunks).strip()
    except Exception as exc:
        log.warning("[TEXT] PDF extraction failed: %s", exc)
        return ""


def text_to_image(text: str) -> Image.Image:
    """Build a simple image from extracted PDF text so downstream heuristics still work."""
    wrapped_lines = []
    for line in text.splitlines()[:80]:
        wrapped_lines.extend(textwrap.wrap(line[:160], width=90) or [""])

    width = 1600
    height = max(900, 40 + len(wrapped_lines) * 28)
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    y = 20
    for line in wrapped_lines:
        draw.text((20, y), line, fill="black", font=font)
        y += 24
    return image


def get_pdf_metadata(file_bytes: bytes) -> dict:
    """Extract metadata using PyMuPDF."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        meta = doc.metadata or {}
        return {
            "producer": str(meta.get("producer", "")),
            "creator": str(meta.get("creator", "")),
            "creation_date": str(meta.get("creationDate", "")),
            "mod_date": str(meta.get("modDate", "")),
            "font_count": 0,
        }
    except Exception as exc:
        log.warning("[METADATA] Extraction failed: %s", exc)
        return {}


def run_ela(img: Image.Image) -> tuple[float, list[str]]:
    """Error Level Analysis."""
    flags: list[str] = []
    img_rgb = img.convert("RGB")
    buffer = io.BytesIO()
    img_rgb.save(buffer, format="JPEG", quality=95)
    buffer.seek(0)
    recompressed = Image.open(buffer).convert("RGB")
    diff = ImageChops.difference(img_rgb, recompressed)
    pixels = list(diff.getdata())
    avg_dev = sum(sum(p) / 3 for p in pixels) / max(1, len(pixels))

    if avg_dev > 10:
        flags.append(
            f"High ELA deviation ({avg_dev:.1f}) — significant image manipulation detected"
        )
    elif avg_dev > 5:
        flags.append(
            f"Moderate ELA anomaly ({avg_dev:.1f}) — compression inconsistency detected"
        )
    score = max(0.0, 1.0 - (avg_dev / 15.0))
    return round(score, 3), flags


def run_metadata_check(meta: Optional[dict]) -> tuple[float, list[str]]:
    """Metadata forensics."""
    if not meta:
        return 0.75, []

    flags: list[str] = []
    deductions = 0.0
    editing_tools = [
        "photoshop",
        "illustrator",
        "gimp",
        "inkscape",
        "foxit",
        "libreoffice draw",
        "canva",
        "affinity",
    ]
    combined = meta.get("producer", "").lower() + " " + meta.get("creator", "").lower()

    for tool in editing_tools:
        if tool in combined:
            display = meta.get("producer") or meta.get("creator", "unknown")
            flags.append(
                f"Document producer is '{display}' — image/design editors are unexpected for university-issued certificates"
            )
            deductions += 0.35
            break

    mod = meta.get("mod_date", "")
    created = meta.get("creation_date", "")
    if mod and created and mod > created and mod != created:
        flags.append(
            "Modification timestamp is later than creation date — document was edited after initial creation"
        )
        deductions += 0.25

    score = round(max(0.0, 1.0 - deductions), 3)
    return score, flags


def run_ocr_analysis(img: Image.Image) -> tuple[float, list[str]]:
    """OCR confidence + font clustering."""
    if pytesseract is None:
        return 0.6, ["OCR layer unavailable in this Python environment"]

    flags: list[str] = []
    deductions = 0.0
    try:
        tsv = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        confidences = [
            int(c)
            for c in tsv["conf"]
            if str(c).lstrip("-").isdigit() and int(c) > 0
        ]
        if not confidences:
            return 0.65, [
                "OCR could not extract text — document may be purely image-based or very low resolution"
            ]

        avg_conf = sum(confidences) / len(confidences)
        if avg_conf < 55:
            flags.append(
                f"Low average OCR confidence ({avg_conf:.0f}%) — possible overlaid or substituted text"
            )
            deductions += 0.25
        elif avg_conf < 70:
            flags.append(
                f"Below-average OCR confidence ({avg_conf:.0f}%) — some text regions appear irregular"
            )
            deductions += 0.10

        if len(confidences) > 15:
            variance = sum((c - avg_conf) ** 2 for c in confidences) / len(confidences)
            std_dev = variance**0.5
            if std_dev > 32:
                flags.append(
                    f"High OCR confidence variance (sigma={std_dev:.0f}) — possible text region replacement"
                )
                deductions += 0.20

        heights = [h for h in tsv["height"] if isinstance(h, int) and h > 8]
        if len(heights) > 10:
            avg_h = sum(heights) / len(heights)
            outlier_count = sum(1 for h in heights if abs(h - avg_h) > avg_h * 0.9)
            if outlier_count > len(heights) * 0.18:
                flags.append(
                    "Significant font size outliers detected — text block sizing inconsistent with uniformly typeset document"
                )
                deductions += 0.15

        score = round(max(0.0, 1.0 - deductions), 3)
        return score, flags
    except Exception as exc:
        log.error("[LAYER-B] OCR failed: %s", exc)
        return 0.65, [f"OCR analysis partially failed: {str(exc)[:80]}"]


async def run_gemini_analysis(
    img: Image.Image,
    raw_pdf_bytes: Optional[bytes] = None,
) -> tuple[Optional[float], list[str], str]:
    """Gemini Vision forensic analysis with native PDF support and image fallback.

    When ``raw_pdf_bytes`` is provided the PDF is sent directly to Gemini using
    the ``application/pdf`` MIME type (supported by gemini-2.0-flash and later).
    This completely bypasses the Poppler/pdf2image dependency and gives the model
    access to the full document layout, fonts, and embedded text.  If no PDF bytes
    are available we fall back to sending the rasterised JPEG as before.
    """
    if not GEMINI_API_KEY or genai is None:
        return None, [], "unavailable"

    prompt = (
        "You are a forensic document analyst specializing in academic certificate and "
        "official document authentication. "
        "Analyze the provided document for signs of forgery or tampering.\n\n"
        "Respond ONLY with a valid JSON object — no markdown, no explanation, no code fences:\n"
        "{\n"
        '  "layout_consistency": <integer 0-10, 10 = perfectly uniform layout>,\n'
        '  "seal_authenticity": <integer 0-10, 10 = seal/signature looks authentic and unaltered>,\n'
        '  "text_alignment": <integer 0-10, 10 = text is perfectly and uniformly aligned>,\n'
        '  "overall_suspicion": <integer 0-10, 0 = not suspicious at all, 10 = clear forgery>,\n'
        '  "flags": [<up to 2 short specific observations about anomalies, empty array if none>]\n'
        "}"
    )

    try:
        response = None
        used_model = None

        # --- Path A: send raw PDF bytes directly (no Poppler needed) ---
        if raw_pdf_bytes is not None:
            for model_name in ["gemini-2.0-flash", "gemini-2.0-flash-lite"]:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content([
                        prompt,
                        {"mime_type": "application/pdf", "data": raw_pdf_bytes},
                    ])
                    used_model = f"{model_name}:pdf"
                    log.info("[LAYER-C] Gemini analysed PDF directly via %s", model_name)
                    break
                except Exception as me:
                    err = str(me).lower()
                    if any(x in err for x in ["quota", "429", "exhausted", "resource"]):
                        continue
                    # Model may not support PDF mime — fall through to image path
                    log.warning("[LAYER-C] PDF path failed for %s: %s", model_name, me)
                    break

        # --- Path B: fall back to JPEG image ---
        if response is None:
            buf = io.BytesIO()
            img.convert("RGB").save(buf, format="JPEG", quality=88)
            img_bytes = buf.getvalue()
            for model_name in ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content([
                        prompt,
                        {"mime_type": "image/jpeg", "data": img_bytes},
                    ])
                    used_model = f"{model_name}:img"
                    break
                except Exception as me:
                    if any(x in str(me).lower() for x in ["quota", "429", "exhausted", "resource"]):
                        continue
                    raise

        if response is None:
            return None, [], "quota_exhausted"

        raw = response.text.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)
        layout = max(0, min(10, int(data.get("layout_consistency", 5)))) / 10.0
        seal = max(0, min(10, int(data.get("seal_authenticity", 5)))) / 10.0
        align = max(0, min(10, int(data.get("text_alignment", 5)))) / 10.0
        suspicion = max(0, min(10, int(data.get("overall_suspicion", 5)))) / 10.0
        ai_score = layout * 0.30 + seal * 0.30 + align * 0.20 + (1.0 - suspicion) * 0.20

        gemini_flags: list[str] = []
        for item in (data.get("flags") or [])[:2]:
            if item and isinstance(item, str):
                gemini_flags.append(f"AI Vision: {item.strip()}")

        return round(ai_score, 3), gemini_flags, f"ok:{used_model}"
    except json.JSONDecodeError:
        return None, [], "parse_error"
    except Exception as exc:
        log.error("[LAYER-C] Gemini layer error: %s", exc)
        return None, [], f"error:{str(exc)[:50]}"


def compute_trust(visual: float, structural: float, ai: Optional[float]) -> float:
    if ai is not None:
        return round(visual * 0.40 + structural * 0.35 + ai * 0.25, 3)
    return round(visual * 0.534 + structural * 0.466, 3)


def badge_from_score(score: float) -> str:
    if score >= 0.75:
        return "green"
    if score >= 0.45:
        return "amber"
    return "red"


@app.get("/")
def read_root():
    return {
        "service": "SealIt AI Certificate Analyzer",
        "status": "online",
        "message": "Welcome! The AI microservice is running. Send POST requests to /analyze for document forensics."
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY),
        "tesseract": TESSERACT_CMD or "unavailable",
    }


@app.post("/analyze")
async def analyze_certificate(file: UploadFile = File(...)):
    start_time = time.time()
    content_type = file.content_type or ""
    is_pdf = "pdf" in content_type
    is_image = any(t in content_type for t in ["jpeg", "jpg", "png", "image"])

    if not (is_pdf or is_image):
        raise HTTPException(status_code=400, detail="Unsupported file type. Send PDF, JPEG, or PNG.")

    file_bytes = await file.read()
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

    pdf_meta = None
    pdf_text = ""
    raw_pdf_for_gemini: Optional[bytes] = None
    used_placeholder = False
    try:
        if is_pdf:
            raw_pdf_for_gemini = file_bytes  # keep original bytes for Gemini PDF path
            pdf_meta = get_pdf_metadata(file_bytes)
            pdf_text = extract_pdf_text(file_bytes)
            if pdf_text:
                log.info("[PDF] Text extracted via pypdf (%d chars)", len(pdf_text))
                img = text_to_image(pdf_text)
            else:
                # Try PyMuPDF rasterization; fall back to placeholder if it fails
                rasterized = False
                try:
                    log.info("[PDF] Attempting rasterisation via PyMuPDF")
                    img = pdf_to_image(file_bytes)
                    rasterized = True
                except Exception as raster_err:
                    log.warning("[PDF] PyMuPDF rasterisation failed: %s", raster_err)
                
                if not rasterized:
                    # No text, no working PyMuPDF — create a placeholder for ELA/OCR.
                    # Gemini will still receive the raw PDF bytes directly (Path A).
                    log.warning("[PDF] Using placeholder image — Gemini will analyse raw PDF directly")
                    img = Image.new("RGB", (1600, 1000), "white")
                    used_placeholder = True
        else:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read file: {str(exc)}")

    all_flags = []
    ela_score, ela_flags = run_ela(img)
    meta_score, meta_flags = run_metadata_check(pdf_meta)
    layer_a = round(ela_score * 0.60 + meta_score * 0.40, 3)
    all_flags += [{"layer": "visual", "message": f} for f in ela_flags]
    all_flags += [{"layer": "structural", "message": f} for f in meta_flags]

    # OCR layer — skip if image is the blank placeholder (no meaningful data to extract)
    if used_placeholder:
        ocr_score = 0.65
        ocr_flags = ["OCR skipped — PDF could not be rasterized (Poppler unavailable); AI Vision used instead"]
    else:
        ocr_score, ocr_flags = run_ocr_analysis(img)
    all_flags += [{"layer": "structural", "message": f} for f in ocr_flags]

    if is_pdf and pdf_text:
        text_flags = []
        text_score = 1.0
        normalized_text = pdf_text.lower()
        if len(pdf_text.split()) < 25:
            text_flags.append("PDF text extraction returned very little text — document may be scanned or image-only")
            text_score -= 0.2
        if any(marker in normalized_text for marker in ["photoshop", "illustrator", "canva", "edited"]):
            text_flags.append("PDF text contains editing-related keywords")
            text_score -= 0.15
        all_flags += [{"layer": "structural", "message": f} for f in text_flags]
        layer_a = round((layer_a + max(0.0, text_score)) / 2.0, 3)

    # Pass raw PDF bytes so Gemini can analyse the document natively (no Poppler needed)
    ai_score, ai_flags, ai_status = await run_gemini_analysis(img, raw_pdf_bytes=raw_pdf_for_gemini)
    all_flags += [{"layer": "vision_ai", "message": f} for f in ai_flags]

    trust = compute_trust(layer_a, ocr_score, ai_score)
    badge = badge_from_score(trust)
    elapsed = time.time() - start_time

    return {
        "badge": badge,
        "trust_score": trust,
        "flags": all_flags,
        "layer_status": {
            "visual": "ok",
            "structural": "ok",
            "vision_api": ai_status,
        },
        "analysis_time": round(elapsed, 2),
        "filename": file.filename,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
