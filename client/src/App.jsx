import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import OfficeCanvas from "./OfficeCanvas.jsx";

const socket = io("http://localhost:5000", {
  autoConnect: false,
});

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function App() {
  const [status, setStatus] = useState("Connecting...");
  const [avatarPosition, setAvatarPosition] = useState({
    x: 500,
    y: 590,
  });
  const [otherAvatars, setOtherAvatars] = useState({});
  const [micEnabled, setMicEnabled] = useState(false);
  const [audioStatus, setAudioStatus] = useState("Microphone off");
  const [remoteStreams, setRemoteStreams] = useState({});

  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const avatarPositionRef = useRef(avatarPosition);
  const pendingCandidatesRef = useRef(new Map());
  const remoteAudioRefs = useRef({});
  const AUDIO_RANGE = 100;

  const closePeer = useCallback((peerId) => {
    const peer = peersRef.current.get(peerId);
    if (peer) {
      peer.close();
      peersRef.current.delete(peerId);
    }
    pendingCandidatesRef.current.delete(peerId);
    setRemoteStreams((previous) => {
      const updated = { ...previous };
      delete updated[peerId];
      return updated;
    });
  }, []);

  const createPeer = useCallback((peerId) => {
    let peer = peersRef.current.get(peerId);
    if (peer) return peer;

    peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(peerId, peer);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    peer.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        setRemoteStreams((previous) => ({
          ...previous,
          [peerId]: stream,
        }));
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && socket.connected) {
        socket.emit("webrtc-ice-candidate", {
          targetSocketId: peerId,
          candidate: event.candidate,
        });
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed") {
        setAudioStatus("Audio connection failed. Move closer and retry.");
      }
    };

    return peer;
  }, []);

  const refreshNearbyUsers = useCallback(() => {
    if (!socket.connected) return;

    socket.emit("get-nearby-users", (result) => {
      if (!result?.success || !Array.isArray(result.users)) return;

      const nearbyIds = new Set(result.users.map((user) => user.id));

      for (const peerId of peersRef.current.keys()) {
        if (!nearbyIds.has(peerId)) closePeer(peerId);
      }

      if (!localStreamRef.current) return;

      result.users.forEach(async (user) => {
        if (socket.id.localeCompare(user.id) > 0) return;
        if (peersRef.current.has(user.id)) return;

        const peer = createPeer(user.id);

        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);

          socket.emit("webrtc-offer", {
            targetSocketId: user.id,
            offer: peer.localDescription,
          });
        } catch (error) {
          console.error("Could not create audio offer:", error);
          closePeer(user.id);
        }
      });
    });
  }, [closePeer, createPeer]);

  const toggleMicrophone = useCallback(async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;

      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();
      pendingCandidatesRef.current.clear();
      setRemoteStreams({});
      setMicEnabled(false);
      setAudioStatus("Microphone off");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      localStreamRef.current = stream;
      setMicEnabled(true);
      setAudioStatus("Microphone enabled");
      refreshNearbyUsers();
    } catch (error) {
      console.error("Microphone access failed:", error);
      setAudioStatus("Microphone permission denied or unavailable");
    }
  }, [refreshNearbyUsers]);

  const handlePositionChange = useCallback((position) => {
    avatarPositionRef.current = position;
    setAvatarPosition(position);

    if (socket.connected) {
      socket.emit("avatar-move", position);
    }
  }, []);

  useEffect(() => {
    const onConnect = () => {
      setStatus("Connected");

      socket.emit("avatar-move", avatarPositionRef.current);

      socket.emit("get-connected-users", (result) => {
        if (!result?.success || !Array.isArray(result.users)) return;

        const updated = {};

        result.users.forEach((user) => {
          if (
            user.id &&
            user.id !== socket.id &&
            Number.isFinite(user.x) &&
            Number.isFinite(user.y)
          ) {
            updated[user.id] = { x: user.x, y: user.y };
          }
        });

        setOtherAvatars((previous) => ({ ...previous, ...updated }));
      });

      refreshNearbyUsers();
    };

    const onConnectError = () => setStatus("Connection failed");
    const onDisconnect = () => setStatus("Disconnected");

    const onAvatarMoved = (position) => {
      if (
        !position?.id ||
        !Number.isFinite(position.x) ||
        !Number.isFinite(position.y)
      ) return;

      setOtherAvatars((previous) => ({
        ...previous,
        [position.id]: { x: position.x, y: position.y },
      }));
    };

    const onUserLeft = (id) => {
      setOtherAvatars((previous) => {
        const updated = { ...previous };
        delete updated[id];
        return updated;
      });
      closePeer(id);
    };

    const onOffer = async ({ from, payload } = {}) => {
      if (!from || !payload) return;

      try {
        const peer = createPeer(from);
        await peer.setRemoteDescription(payload);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          targetSocketId: from,
          answer: peer.localDescription,
        });

        const queued = pendingCandidatesRef.current.get(from) || [];
        for (const candidate of queued) {
          await peer.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current.delete(from);
      } catch (error) {
        console.error("Could not answer audio offer:", error);
        setAudioStatus("Could not connect audio");
      }
    };

    const onAnswer = async ({ from, payload } = {}) => {
      const peer = peersRef.current.get(from);
      if (!peer || !payload) return;

      try {
        await peer.setRemoteDescription(payload);
        const queued = pendingCandidatesRef.current.get(from) || [];
        for (const candidate of queued) {
          await peer.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current.delete(from);
      } catch (error) {
        console.error("Could not process audio answer:", error);
      }
    };

    const onCandidate = async ({ from, payload } = {}) => {
      if (!from || !payload) return;
      const peer = peersRef.current.get(from);

      if (!peer || !peer.remoteDescription) {
        const queued = pendingCandidatesRef.current.get(from) || [];
        queued.push(payload);
        pendingCandidatesRef.current.set(from, queued);
        return;
      }

      try {
        await peer.addIceCandidate(payload);
      } catch (error) {
        console.error("Could not add ICE candidate:", error);
      }
    };

    const onWebRTCError = ({ message } = {}) => {
      setAudioStatus(message || "Audio signaling error");
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.on("avatar-moved", onAvatarMoved);
    socket.on("user-left", onUserLeft);
    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("webrtc-ice-candidate", onCandidate);
    socket.on("webrtc-error", onWebRTCError);

    socket.connect();

    const nearbyTimer = window.setInterval(refreshNearbyUsers, 2000);

    return () => {
      window.clearInterval(nearbyTimer);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.off("avatar-moved", onAvatarMoved);
      socket.off("user-left", onUserLeft);
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("webrtc-ice-candidate", onCandidate);
      socket.off("webrtc-error", onWebRTCError);
      socket.disconnect();

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();
    };
  }, [closePeer, createPeer, refreshNearbyUsers]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([id, stream]) => {
      const audio = remoteAudioRefs.current[id];
      if (audio && audio.srcObject !== stream) {
        audio.srcObject = stream;
        audio.play().catch(() => {
          setAudioStatus("Click the page to allow remote audio playback");
        });
      }
    });
  }, [remoteStreams]);

useEffect(() => {
  Object.keys(remoteStreams).forEach((id) => {
    const audio = remoteAudioRefs.current[id];
    const otherPosition = otherAvatars[id];

    // Keep the current volume if the other avatar's position is unknown.
    if (!audio || !otherPosition) return;

    const dx = avatarPosition.x - otherPosition.x;
    const dy = avatarPosition.y - otherPosition.y;
    const distance = Math.hypot(dx, dy);

    // Full volume within 20 pixels, decreasing to silence at 100 pixels.
    const fullVolumeRange = 20;
    const volume = Math.max(
      0,
      Math.min(1, (AUDIO_RANGE - distance) / (AUDIO_RANGE - fullVolumeRange))
    );

    audio.volume = volume;
  });
}, [avatarPosition, otherAvatars, remoteStreams]);


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

        <div className="audio-controls">
          <button type="button" onClick={toggleMicrophone}>
            {micEnabled ? "Turn microphone off" : "Enable microphone"}
          </button>
          <p>Audio: {audioStatus}</p>
        </div>

        {Object.entries(remoteStreams).map(([id]) => (
          <audio
            key={id}
            ref={(element) => {
              remoteAudioRefs.current[id] = element;
            }}
            autoPlay
            playsInline
          />
        ))}
      </section>
    </main>
  );
}