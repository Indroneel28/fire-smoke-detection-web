import { useRef, useState } from "react";
import axios from "axios";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detections, setDetections] = useState([]);

  // 🎥 Start camera
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  // 📸 Capture frame + send to backend
  const detectFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob);

      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/detect",
          formData
        );

        setDetections(res.data.detections);
        drawBoxes(res.data.detections, canvas, ctx);
      } catch (err) {
        console.error(err);
      }
    }, "image/jpeg");
  };

  // 🔲 Draw bounding boxes
  const drawBoxes = (detections, canvas, ctx) => {
    ctx.lineWidth = 3;
    ctx.font = "16px Arial";

    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.box;

      ctx.strokeStyle = "red";
      ctx.fillStyle = "red";

      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillText(det.label, x1, y1 - 5);
    });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>🔥 Fire Detection</h1>

      <video ref={videoRef} autoPlay width="600" />

      <br /><br />

      <button onClick={startCamera}>Start Camera</button>
      <button onClick={detectFrame}>Detect</button>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <h3>Detections:</h3>
      {detections.map((d, i) => (
        <p key={i}>
          {d.label} ({(d.confidence * 100).toFixed(2)}%)
        </p>
      ))}
    </div>
  );
}

export default App;