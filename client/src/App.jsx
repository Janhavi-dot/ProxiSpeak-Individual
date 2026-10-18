
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import OfficeCanvas from "./OfficeCanvas.jsx";

const socket = io("http://localhost:5000", {
  autoConnect: false,
});

export default function App() {
  const [status, setStatus] = useState("Connecting...");
  const [avatarPosition, setAvatarPosition] = useState({
    x: 500,
    y: 590,
  });
  const [otherAvatars, setOtherAvatars] = useState({});

  const handlePositionChange = useCallback((position) => {
    setAvatarPosition(position);

    if (socket.connected) {
      socket.emit("avatar-move", position);
    }
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => setStatus("Connected"));
    socket.on("connect_error", () => setStatus("Connection failed"));
    socket.on("disconnect", () => setStatus("Disconnected"));

    socket.on("avatar-moved", (position) => {
      if (
        !position?.id ||
        !Number.isFinite(position.x) ||
        !Number.isFinite(position.y)
      ) {
        return;
      }

      setOtherAvatars((previous) => ({
        ...previous,
        [position.id]: {
          x: position.x,
          y: position.y,
        },
      }));
    });

    socket.on("user-left", (id) => {
      setOtherAvatars((previous) => {
        const updated = { ...previous };
        delete updated[id];
        return updated;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("avatar-moved");
      socket.off("user-left");
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
          <span
            className={
              status === "Connected"
                ? "status-dot online"
                : "status-dot"
            }
          />
          Backend: {status}
        </div>
      </header>

      <section className="office-section">
        <div className="section-heading">
          <div>
            <h2>Virtual Office</h2>
            <p>Explore the shared workspace</p>
          </div>
          <span className="avatar-badge">
            {1 + Object.keys(otherAvatars).length} avatar(s)
          </span>
        </div>

        <div className="canvas-container">
          <OfficeCanvas
            onPositionChange={handlePositionChange}
            otherAvatars={otherAvatars}
          />
        </div>

        <p className="canvas-note">
          Your position: X {avatarPosition.x}, Y {avatarPosition.y}
          {" · Use WASD or arrow keys to move"}
        </p>
      </section>
    </main>
  );
}
