from fastapi import FastAPI, UploadFile, File
import numpy as np
import cv2
from detector import Detector

app = FastAPI()

# use default model (auto download)
detector = Detector("yolov8n.pt")

@app.get("/")
def home():
    return {"message": "Backend running"}

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()

    np_img = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    detections = detector.detect(img)

    return {"detections": detections}