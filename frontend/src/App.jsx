import { useRef, useState } from "react";
import axios from "axios";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [fire, setFire] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState([]);
  const [cameraOn, setCameraOn] = useState(false);

  const audioRef = useRef(new Audio("https://www.soundjay.com/button/beep-07.wav"));

  // 🎥 Start camera
  const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoRef.current.srcObject = stream;
  setCameraOn(true); // ✅ important
};

  // 🛑 Stop camera + detection
  const stopAll = () => {
    setCameraOn(false);
    setIsDetecting(false);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Stop camera stream
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // 🔥 Clear video (IMPORTANT)
    video.srcObject = null;

    // 🔥 Clear canvas (IMPORTANT)
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Optional: clear detections
    setDetections([]);
  };

  // 🔁 Start auto detection
  const startDetection = () => {
    if (intervalRef.current)
      return; // prevent duplicate
    setIsDetecting(true);
    intervalRef.current = setInterval(() => {
      captureFrame();
    }, 500);
  };

  // 📸 Capture frame
  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.readyState !== 4)
      return;

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

        const dets = res.data.detections;
        setDetections(dets);

        drawBoxes(dets, ctx);
        checkFire(dets);
      } catch (err) {
        console.error(err);
      }
    }, "image/jpeg");
  };

  // 🔲 Draw boxes
  const drawBoxes = (detections, ctx) => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

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

  // 🚨 Fire alert
  const checkFire = (detections) => {
    const fireDetected = detections.some((d) =>
      d.label.toLowerCase().includes("fire")
    );

    if (fireDetected && !fire) {
      setFire(true);
      audioRef.current.currentTime = 0; // reset
      audioRef.current.play();
    } else if (!fireDetected) {
      setFire(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>🔥 Fire Detection</h1>

      {fire && (
        <div
          style={{
            color: "white",
            background: "red",
            padding: "10px",
            marginBottom: "10px",
            fontWeight: "bold",
          }}
        >
          🔥 FIRE DETECTED!
        </div>
      )}

      <div style={{ position: "relative", display: "inline-block" }}>
        <video ref={videoRef} autoPlay width="600" />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>

      <br /><br />

      <button onClick={startCamera}>Start Camera</button>
      <button
        onClick={startDetection}
        disabled={isDetecting || !cameraOn}
      >
        Start Detection
      </button>
      <button onClick={stopAll}>Stop</button>

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