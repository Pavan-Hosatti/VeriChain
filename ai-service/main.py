"""
AI Certificate Analysis Microservice
Three-layer forensic pipeline: ELA + Metadata / OCR + Structure / Gemini Vision
"""

import os
import io
import json
import logging
import time
from typing import Optional

import pytesseract
from pypdf import PdfReader
from pdf2image import convert_from_bytes
from PIL import Image, ImageChops
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

# ── Logging Setup ─────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("sealit-ai")

# ── App Setup ─────────────────────────────────────────────

app = FastAPI(title="SealIt AI Certificate Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    log.info("[OK] Gemini API configured successfully")
else:
    log.warning("[WARNING] GEMINI_API_KEY not set — Vision AI layer will be skipped")

log.info("[START] SealIt AI Microservice starting up...")
log.info("[PIPELINE] ELA + Metadata  |  OCR + Structure  |  Gemini Vision")
log.info("[NETWORK] Listening on http://0.0.0.0:8000")

# ── File Conversion Helpers ───────────────────────────────

def pdf_to_image(file_bytes: bytes) -> Image.Image:
    """Render first page of PDF to RGB image using poppler."""
    log.info("[CONVERT] Converting PDF to image (poppler, 200 DPI)...")
    images = convert_from_bytes(file_bytes, first_page=1, last_page=1, dpi=200)
    img = images[0].convert("RGB")
    log.info(f"[CONVERT] Image size: {img.size[0]}x{img.size[1]}px")
    return img


def get_pdf_metadata(file_bytes: bytes) -> dict:
    """Extract metadata using pypdf."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        meta = reader.metadata or {}
        result = {
            "producer": str(meta.get("/Producer", "")),
            "creator": str(meta.get("/Creator", "")),
            "creation_date": str(meta.get("/CreationDate", "")),
            "mod_date": str(meta.get("/ModDate", "")),
            "font_count": 0,
        }
        log.info(f"[METADATA] producer='{result['producer']}' creator='{result['creator']}'")
        return result
    except Exception as e:
        log.warning(f"[METADATA] Extraction failed: {e}")
        return {}

# ── Layer A: ELA + Metadata ───────────────────────────────

def run_ela(img: Image.Image) -> tuple[float, list[str]]:
    """Error Level Analysis."""
    log.info("[LAYER-A] Running Error Level Analysis (ELA)...")
    flags = []
    img_rgb = img.convert("RGB")

    buffer = io.BytesIO()
    img_rgb.save(buffer, format="JPEG", quality=95)
    buffer.seek(0)
    recompressed = Image.open(buffer).convert("RGB")

    diff = ImageChops.difference(img_rgb, recompressed)
    pixels = list(diff.getdata())
    avg_dev = sum(sum(p) / 3 for p in pixels) / len(pixels)

    log.info(f"[LAYER-A] ELA avg deviation: {avg_dev:.2f} (threshold: >5 suspicious, >10 tampered)")

    if avg_dev > 10:
        msg = (f"High ELA deviation ({avg_dev:.1f}) — significant image manipulation detected, "
               "likely overlaid text or pasted region")
        flags.append(msg)
        log.warning(f"[ALERT] FLAG: {msg}")
    elif avg_dev > 5:
        msg = (f"Moderate ELA anomaly ({avg_dev:.1f}) — compression inconsistency detected, "
               "manual editing suspected")
        flags.append(msg)
        log.warning(f"[WARNING] FLAG: {msg}")
    else:
        log.info("[LAYER-A] ELA clean — no compression anomalies detected")

    score = max(0.0, 1.0 - (avg_dev / 15.0))
    log.info(f"[LAYER-A] Score: {score:.3f}")
    return round(score, 3), flags


def run_metadata_check(meta: Optional[dict]) -> tuple[float, list[str]]:
    """Metadata forensics."""
    log.info("[LAYER-A] Running metadata forensics...")
    if not meta:
        log.info("[LAYER-A] No PDF metadata available (image or encrypted)")
        return 0.75, []

    flags = []
    deductions = 0.0

    editing_tools = [
        "photoshop", "illustrator", "gimp", "inkscape",
        "foxit", "libreoffice draw", "canva", "affinity"
    ]
    combined = meta.get("producer", "").lower() + " " + meta.get("creator", "").lower()

    for tool in editing_tools:
        if tool in combined:
            display = meta.get("producer") or meta.get("creator", "unknown")
            msg = (f"Document producer is '{display}' — image/design editors are unexpected "
                   "for university-issued certificates")
            flags.append(msg)
            log.warning(f"[ALERT] FLAG: {msg}")
            deductions += 0.35
            break

    mod = meta.get("mod_date", "")
    created = meta.get("creation_date", "")
    if mod and created and mod > created and mod != created:
        msg = ("Modification timestamp is later than creation date — "
               "document was edited after initial creation")
        flags.append(msg)
        log.warning(f"[WARNING] FLAG: {msg}")
        deductions += 0.25

    if not flags:
        log.info("[LAYER-A] Metadata clean — no suspicious producer or timestamp anomalies")

    score = round(max(0.0, 1.0 - deductions), 3)
    log.info(f"[LAYER-A] Metadata score: {score:.3f}")
    return score, flags

# ── Layer B: OCR + Structural Analysis ───────────────────

def run_ocr_analysis(img: Image.Image) -> tuple[float, list[str]]:
    """OCR confidence + font clustering."""
    log.info("[LAYER-B] Running OCR structural analysis...")
    flags = []
    deductions = 0.0

    try:
        tsv = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        confidences = [int(c) for c in tsv["conf"] if str(c).lstrip("-").isdigit() and int(c) > 0]

        if not confidences:
            log.warning("[LAYER-B] OCR returned no text — image-based or low resolution document")
            return 0.65, ["OCR could not extract text — document may be purely image-based or very low resolution"]

        avg_conf = sum(confidences) / len(confidences)
        log.info(f"[LAYER-B] OCR extracted {len(confidences)} text regions | avg confidence: {avg_conf:.1f}%")

        if avg_conf < 55:
            msg = (f"Low average OCR confidence ({avg_conf:.0f}%) — text regions are inconsistent, "
                   "possible overlaid or substituted text")
            flags.append(msg)
            log.warning(f"[ALERT] FLAG: {msg}")
            deductions += 0.25
        elif avg_conf < 70:
            msg = f"Below-average OCR confidence ({avg_conf:.0f}%) — some text regions appear irregular"
            flags.append(msg)
            log.warning(f"[WARNING] FLAG: {msg}")
            deductions += 0.10
        else:
            log.info("[LAYER-B] OCR confidence nominal")

        if len(confidences) > 15:
            variance = sum((c - avg_conf) ** 2 for c in confidences) / len(confidences)
            std_dev = variance ** 0.5
            log.info(f"[LAYER-B] OCR confidence std deviation: sigma={std_dev:.1f}")
            if std_dev > 32:
                msg = (f"High OCR confidence variance (sigma={std_dev:.0f}) — "
                       "text consistency is uneven, possible text region replacement")
                flags.append(msg)
                log.warning(f"[WARNING] FLAG: {msg}")
                deductions += 0.20

        heights = [h for h in tsv["height"] if isinstance(h, int) and h > 8]
        if len(heights) > 10:
            avg_h = sum(heights) / len(heights)
            outlier_count = sum(1 for h in heights if abs(h - avg_h) > avg_h * 0.9)
            log.info(f"[LAYER-B] Font height outliers: {outlier_count}/{len(heights)} blocks")
            if outlier_count > len(heights) * 0.18:
                msg = ("Significant font size outliers detected — "
                       "text block sizing inconsistent with uniformly typeset document")
                flags.append(msg)
                log.warning(f"[WARNING] FLAG: {msg}")
                deductions += 0.15

        if not flags:
            log.info("[LAYER-B] Structural analysis clean")

    except Exception as exc:
        log.error(f"[LAYER-B] OCR failed: {exc}")
        return 0.65, [f"OCR analysis partially failed: {str(exc)[:80]}"]

    score = round(max(0.0, 1.0 - deductions), 3)
    log.info(f"[LAYER-B] OCR score: {score:.3f}")
    return score, flags

# ── Layer C: Gemini Vision ────────────────────────────────

async def run_gemini_analysis(img: Image.Image) -> tuple[Optional[float], list[str], str]:
    """Gemini Vision forensic analysis with model fallback."""
    if not GEMINI_API_KEY:
        log.warning("[LAYER-C] Skipped — no API key configured")
        return None, [], "unavailable"

    log.info("[LAYER-C] Running Gemini Vision forensic analysis...")

    try:
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=88)
        img_bytes = buf.getvalue()
        log.info(f"[LAYER-C] Image prepared: {len(img_bytes) // 1024}KB")

        prompt = (
            "You are a forensic document analyst specializing in academic certificate authentication. "
            "Analyze the provided certificate image for signs of forgery or tampering.\n\n"
            "Respond ONLY with a valid JSON object — no markdown, no explanation, no code fences:\n"
            "{\n"
            '  "layout_consistency": <integer 0-10, 10 = perfectly uniform layout>,\n'
            '  "seal_authenticity": <integer 0-10, 10 = seal looks authentic and unaltered>,\n'
            '  "text_alignment": <integer 0-10, 10 = text is perfectly and uniformly aligned>,\n'
            '  "overall_suspicion": <integer 0-10, 0 = not suspicious at all, 10 = clear forgery>,\n'
            '  "flags": [<up to 2 short specific observations about anomalies, empty array if none>]\n'
            "}"
        )

        response = None
        used_model = None
        for model_name in ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-flash-latest"]:
            try:
                log.info(f"[LAYER-C] Trying model: {model_name}...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([
                    prompt,
                    {"mime_type": "image/jpeg", "data": img_bytes}
                ])
                used_model = model_name
                log.info(f"[LAYER-C] {model_name} responded successfully")
                break
            except Exception as me:
                if any(x in str(me).lower() for x in ["quota", "429", "exhausted", "resource"]):
                    log.warning(f"[WARNING] {model_name} quota exhausted — trying fallback...")
                    continue
                raise

        if response is None:
            log.warning("[LAYER-C] All Gemini models quota exhausted — Vision AI skipped")
            return None, [], "quota_exhausted"

        raw = response.text.strip().replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)

        layout = max(0, min(10, int(data.get("layout_consistency", 5)))) / 10.0
        seal = max(0, min(10, int(data.get("seal_authenticity", 5)))) / 10.0
        align = max(0, min(10, int(data.get("text_alignment", 5)))) / 10.0
        suspicion = max(0, min(10, int(data.get("overall_suspicion", 5)))) / 10.0

        log.info(f"[LAYER-C] Scores: layout={layout:.1f} seal={seal:.1f} align={align:.1f} suspicion={suspicion:.1f}")

        ai_score = (layout * 0.30 + seal * 0.30 + align * 0.20 + (1.0 - suspicion) * 0.20)

        gemini_flags = []
        for f in (data.get("flags") or [])[:2]:
            if f and isinstance(f, str):
                gemini_flags.append(f"AI Vision: {f.strip()}")
                log.info(f"[LAYER-C] Flag: {f.strip()}")

        if not gemini_flags:
            log.info("[LAYER-C] Gemini found no anomalies")

        log.info(f"[LAYER-C] Gemini/{used_model} score: {ai_score:.3f}")
        return round(ai_score, 3), gemini_flags, "ok"

    except json.JSONDecodeError:
        log.error("[ERROR] Gemini response was not valid JSON")
        return None, [], "parse_error"
    except Exception as exc:
        log.error(f"[ERROR] Gemini layer error: {exc}")
        return None, [], f"error:{str(exc)[:50]}"

# ── Trust Score + Badge ───────────────────────────────────

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

# ── Endpoints ─────────────────────────────────────────────

@app.get("/health")
def health():
    log.info("[HEALTH] Health check pinged")
    return {
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY),
        "tesseract": "available"
    }


@app.post("/analyze")
async def analyze_certificate(file: UploadFile = File(...)):
    start_time = time.time()
    log.info("=" * 60)
    log.info(f"[INPUT] New certificate received: '{file.filename}'")
    log.info(f"[INPUT] Content-type: {file.content_type}")

    content_type = file.content_type or ""
    is_pdf = "pdf" in content_type
    is_image = any(t in content_type for t in ["jpeg", "jpg", "png", "image"])

    if not (is_pdf or is_image):
        log.error(f"[ERROR] Unsupported file type: {content_type}")
        raise HTTPException(status_code=400, detail="Unsupported file type. Send PDF, JPEG, or PNG.")

    file_bytes = await file.read()
    log.info(f"[INPUT] File size: {len(file_bytes) // 1024}KB")

    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

    pdf_meta = None
    try:
        if is_pdf:
            img = pdf_to_image(file_bytes)
            pdf_meta = get_pdf_metadata(file_bytes)
        else:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            log.info(f"[INPUT] Image loaded: {img.size[0]}x{img.size[1]}px")
    except Exception as exc:
        log.error(f"[ERROR] Failed to read file: {exc}")
        raise HTTPException(status_code=422, detail=f"Could not read file: {str(exc)}")

    all_flags = []

    # Layer A
    ela_score, ela_flags = run_ela(img)
    meta_score, meta_flags = run_metadata_check(pdf_meta)
    layer_a = round(ela_score * 0.60 + meta_score * 0.40, 3)
    all_flags += [{"layer": "visual", "message": f} for f in ela_flags]
    all_flags += [{"layer": "structural", "message": f} for f in meta_flags]
    log.info(f"[LAYER-A] Combined score: {layer_a:.3f}")

    # Layer B
    ocr_score, ocr_flags = run_ocr_analysis(img)
    all_flags += [{"layer": "structural", "message": f} for f in ocr_flags]

    # Layer C
    ai_score, ai_flags, ai_status = await run_gemini_analysis(img)
    all_flags += [{"layer": "vision_ai", "message": f} for f in ai_flags]

    trust = compute_trust(layer_a, ocr_score, ai_score)
    badge = badge_from_score(trust)
    elapsed = time.time() - start_time

    log.info("=" * 60)
    log.info(f"[RESULT] Final analysis for '{file.filename}'")
    log.info(f"[RESULT] Visual (A):     {layer_a:.3f}")
    log.info(f"[RESULT] Structural (B): {ocr_score:.3f}")
    log.info(f"[RESULT] Vision AI (C):  {ai_score if ai_score is not None else 'N/A (fallback)'}")
    log.info(f"[RESULT] Trust score:    {trust:.3f}")
    log.info(f"[RESULT] Badge:          {badge.upper()}")
    log.info(f"[RESULT] Flags raised:   {len(all_flags)}")
    log.info(f"[RESULT] Analysis time:  {elapsed:.2f}s")
    log.info("=" * 60)

    return {
        "badge": badge,
        "trust_score": trust,
        "flags": all_flags,
        "layer_status": {
            "visual": "ok",
            "structural": "ok",
            "vision_api": ai_status,
        },
    }
