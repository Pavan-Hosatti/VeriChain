#!/usr/bin/env bash
export GEMINI_API_KEY="AIzaSyCy60jwTv5doTh6_xOX9H-EU--X85EXhII"
export LD_LIBRARY_PATH=$(nix-build --no-out-link '<nixpkgs>' -A stdenv.cc.cc.lib)/lib:$LD_LIBRARY_PATH
export TESSDATA_PREFIX=$(nix-build --no-out-link '<nixpkgs>' -A tesseract)/share/tessdata
export PATH=$(nix-build --no-out-link '<nixpkgs>' -A tesseract)/bin:$PATH
source venv/bin/activate
uvicorn main:app --port 8000 --host 0.0.0.0
