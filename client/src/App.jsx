
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
});

export default function App() {
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setStatus("Connected to backend");
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
      <h1>ProxiSpeak</h1>
      <p>Geospatial Proximity Audio Ecosystem</p>
      <section className="status-card">
        <h2>Backend Status</h2>
        <p>{status}</p>
      </section>
      <section className="office-placeholder">
        <h2>Virtual Office</h2>
        <p>Your virtual office will be built here.</p>
      </section>
    </main>
  );
}
