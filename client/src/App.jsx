
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import OfficeCanvas from "./OfficeCanvas.jsx";

const socket = io("http://localhost:5000", {
  autoConnect: false,
});

export default function App() {
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setStatus("Connected");
    });

    socket.on("connect_error", () => {
      setStatus("Connection failed");
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, []);

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>ProxiSpeak</h1>
          <p>Geospatial Proximity Audio Ecosystem</p>
        </div>

        <div className="connection-status">
          <span className={status === "Connected" ? "status-dot online" : "status-dot"} />
          Backend: {status}
        </div>
      </header>

      <section className="office-section">
        <div className="section-heading">
          <div>
            <h2>Virtual Office</h2>
            <p>Explore the shared workspace</p>
          </div>
          <span className="avatar-badge">1 avatar</span>
        </div>

        <div className="canvas-container">
          <OfficeCanvas />
        </div>

        <p className="canvas-note">
          Avatar position: X 500, Y 300 · Movement controls coming next
        </p>
      </section>
    </main>
  );
}
