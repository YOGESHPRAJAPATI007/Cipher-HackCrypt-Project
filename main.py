from io import BytesIO
from typing import List, Tuple
import random

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class AnalysisResponse(BaseModel):
  result: str
  confidence: int
  indicators: List[str]


app = FastAPI(title="Deepfake Detection API", version="1.0.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=False,
  allow_methods=["*"],
  allow_headers=["*"],
)


def score_to_label_and_confidence(risk_score: float) -> Tuple[str, int]:
  clamped = max(0.0, min(100.0, risk_score))
  if clamped >= 70.0:
    label = "Suspicious"
    confidence = int(round(clamped))
  elif clamped <= 40.0:
    label = "Likely Authentic"
    confidence = int(round(100.0 - clamped))
  else:
    label = "Needs Review"
    confidence = 60
  confidence = max(1, min(99, confidence))
  return label, confidence


def analyze_image(data: bytes, filename: str) -> AnalysisResponse:
  indicators: List[str] = []
  file_kb = len(data) / 1024.0

  risk_score = 50.0

  try:
    from PIL import Image  # type: ignore
    image = Image.open(BytesIO(data))
    width, height = image.size
    pixels = width * height
    megapixels = pixels / 1_000_000.0

    if width < 400 or height < 400:
      risk_score += 8.0
      indicators.append("Unusually low resolution imagery that can hide blending artifacts.")
    elif megapixels > 4.0 and file_kb < 300.0:
      risk_score += 14.0
      indicators.append("High resolution with aggressive compression, which can mask generation patterns.")

    aspect_ratio = width / float(height)
    if aspect_ratio > 2.0 or aspect_ratio < 0.5:
      risk_score += 6.0
      indicators.append("Non-standard aspect ratio that may indicate recomposed or stitched content.")

    has_exif = False
    try:
      exif = getattr(image, "_getexif", lambda: None)()
      has_exif = bool(exif)
    except Exception:
      has_exif = False

    if not has_exif:
      risk_score += 6.0
      indicators.append("Missing camera metadata, often seen when content is exported or heavily edited.")
    else:
      risk_score -= 5.0
      indicators.append("Camera metadata present, which is more common for organic captures.")

    mode = image.mode or ""
    if "P" in mode or "LA" in mode or "RGBA" in mode:
      risk_score += 4.0
      indicators.append("Complex channel structure that can result from layered editing or compositing.")
  except Exception:
    indicators.append("Basic analysis fallback used; detailed image inspection unavailable.")

  _, ext = filename.rsplit(".", 1) if "." in filename else ("", "")
  ext = ext.lower()
  if ext in {"png"} and file_kb > 4096:
    risk_score += 6.0
    indicators.append("Very large PNG file, suggesting export from creative tools rather than direct capture.")

  risk_score += random.uniform(-5.0, 5.0)

  label, confidence = score_to_label_and_confidence(risk_score)
  if not indicators:
    indicators.append("No strong anomalies detected by the current heuristic checks.")
  return AnalysisResponse(result=label, confidence=confidence, indicators=indicators)


def analyze_video(data: bytes, filename: str) -> AnalysisResponse:
  indicators: List[str] = []
  size_mb = len(data) / (1024.0 * 1024.0)

  risk_score = 55.0

  if size_mb < 1.0:
    risk_score += 12.0
    indicators.append("Very small video file size, which can suggest heavy compression or synthetic content.")
  elif size_mb > 200.0:
    risk_score += 8.0
    indicators.append("Very large video file that may contain multiple processing or export passes.")

  if size_mb >= 5.0 and size_mb <= 60.0:
    risk_score -= 5.0
    indicators.append("File size falls within a typical range for short-form captures from consumer devices.")

  lower_name = filename.lower()
  if "screen" in lower_name or "capture" in lower_name:
    risk_score += 4.0
    indicators.append("Filename hints at screen recording, which can be used to relay synthetic content.")

  risk_score += random.uniform(-6.0, 6.0)

  label, confidence = score_to_label_and_confidence(risk_score)
  if not indicators:
    indicators.append("No strong anomalies detected by the current heuristic checks.")
  return AnalysisResponse(result=label, confidence=confidence, indicators=indicators)


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)) -> AnalysisResponse:
  if not file.filename:
    raise HTTPException(status_code=400, detail="No file was provided.")

  data = await file.read()
  if not data:
    raise HTTPException(status_code=400, detail="Uploaded file is empty.")

  filename = file.filename.lower()
  content_type = (file.content_type or "").lower()

  if "image" in content_type or filename.endswith((".jpg", ".jpeg", ".png")):
    return analyze_image(data, filename)

  if "video" in content_type or filename.endswith(".mp4"):
    return analyze_video(data, filename)

  raise HTTPException(status_code=400, detail="Unsupported file type. Use JPG, PNG, or MP4.")
