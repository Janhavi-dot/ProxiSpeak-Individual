import { useEffect, useRef, useState } from "react";

export default function OfficeCanvas({
  onPositionChange,
  otherAvatars = {},
}) {
  const canvasRef = useRef(null);
  const backgroundCanvasRef = useRef(null);
  const backgroundReadyRef = useRef(false);
  const cachedRoomLayoutRef = useRef(null);

  const [avatarX, setAvatarX] = useState(500);
  const [avatarY, setAvatarY] = useState(590);

  const [roomLayout, setRoomLayout] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

useEffect(() => {
  let cancelled = false;

  async function loadRoomLayout() {
    try {
      const response = await fetch("http://localhost:5000/api/room");

      if (!response.ok) {
        throw new Error("Failed to load office layout");
      }

      const room = await response.json();

      if (!cancelled) {
        setRoomLayout(room);
        console.log("Office layout loaded:", room);
      }
    } catch (error) {
      console.error("Error loading office layout:", error);
    }
  }

  loadRoomLayout();

  return () => {
    cancelled = true;
  };
}, []);

// Save office layout to MongoDB
async function saveRoomLayout() {
  if (!roomLayout || isSaving) return;

  try {
    setIsSaving(true);

    const response = await fetch("http://localhost:5000/api/room", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        width: roomLayout.width,
        height: roomLayout.height,
        furniture: roomLayout.furniture || [],
        obstacles: roomLayout.obstacles || [],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save office layout");
    }

    const result = await response.json();

    setRoomLayout(result.room);
    console.log("Office layout saved successfully:", result.room);
  } catch (error) {
    console.error("Error saving office layout:", error);
  } finally {
    setIsSaving(false);
  }
}

  // Send the latest avatar position to App.jsx.
  useEffect(() => {
    onPositionChange?.({ x: avatarX, y: avatarY });
  }, [avatarX, avatarY, onPositionChange]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
if (!canvas) return;

const W = 1000;
const H = 880;

if (canvas.width !== W || canvas.height !== H) {
  canvas.width = W;
  canvas.height = H;
}

if (!backgroundCanvasRef.current) {
  const background = document.createElement("canvas");
  background.width = W;
  background.height = H;
  backgroundCanvasRef.current = background;
}

const backgroundCanvas = backgroundCanvasRef.current;
const displayCtx = backgroundCanvas.getContext("2d");
const avatarCtx = canvas.getContext("2d");

const redrawBackground =
  !backgroundReadyRef.current ||
  cachedRoomLayoutRef.current !== roomLayout;

    const C = {
      wall: "#34434a",
      floor: "#c9c9c2",
      roomFloor: "#e8e1d4",
      wood: "#c99d68",
      woodLight: "#e0bd8b",
      darkWood: "#79573c",
      chair: "#596168",
      chairLight: "#7c8587",
      glass: "#a9d5dc",
      green: "#628453",
      leaf: "#85a16e",
      sofa: "#a9683f",
      screen: "#293941",
    };

    function fill(x, y, w, h, color) {
      displayCtx.fillStyle = color;
      displayCtx.fillRect(x, y, w, h);
    }

    function rounded(x, y, w, h, r, color) {
      displayCtx.fillStyle = color;
      displayCtx.beginPath();
      displayCtx.roundRect(x, y, w, h, r);
      displayCtx.fill();
    }

    function line(x1, y1, x2, y2, color = C.wall, width = 5) {
      displayCtx.beginPath();
      displayCtx.moveTo(x1, y1);
      displayCtx.lineTo(x2, y2);
      displayCtx.strokeStyle = color;
      displayCtx.lineWidth = width;
      displayCtx.stroke();
    }

    function wall(x, y, w, h) {
      fill(x, y, w, h, C.wall);
    }

    function windowPane(x, y, w, h) {
      fill(x, y, w, h, "#f6f5ef");

      const glassGradient = displayCtx.createLinearGradient(x, y, x + w, y + h);
      glassGradient.addColorStop(0, "#c5e6e9");
      glassGradient.addColorStop(0.5, "#a8d3dc");
      glassGradient.addColorStop(1, "#8ebbc7");

      displayCtx.fillStyle = glassGradient;
      displayCtx.fillRect(x + 3, y + 3, w - 6, h - 6);

      displayCtx.strokeStyle = "rgba(255,255,255,0.8)";
      displayCtx.lineWidth = 2;
      displayCtx.beginPath();
      displayCtx.moveTo(x + 5, y + h - 4);
      displayCtx.lineTo(x + w - 5, y + 4);
      displayCtx.stroke();

      displayCtx.strokeStyle = "#f9ffff";
      displayCtx.lineWidth = 2;
      displayCtx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    }

    function chair(x, y, angle = 0, color = C.chair) {
      displayCtx.save();
      displayCtx.translate(x, y);
      displayCtx.rotate(angle);

      displayCtx.fillStyle = "rgba(30, 35, 38, 0.15)";
      displayCtx.beginPath();
      displayCtx.ellipse(2, 4, 17, 19, 0, 0, Math.PI * 2);
      displayCtx.fill();

      rounded(-17, -9, 5, 21, 2, "#343f45");
      rounded(12, -9, 5, 21, 2, "#343f45");
      rounded(-13, -17, 26, 16, 5, "#3e4c53");
      rounded(-12, -7, 24, 21, 5, color);

      displayCtx.strokeStyle = "rgba(255,255,255,0.2)";
      displayCtx.lineWidth = 1;
      displayCtx.strokeRect(-8, -3, 16, 12);

      displayCtx.strokeStyle = "#56636a";
      displayCtx.lineWidth = 2;
      displayCtx.beginPath();
      displayCtx.moveTo(0, 14);
      displayCtx.lineTo(0, 18);
      displayCtx.stroke();

      displayCtx.beginPath();
      displayCtx.moveTo(-9, 19);
      displayCtx.lineTo(9, 19);
      displayCtx.moveTo(-6, 16);
      displayCtx.lineTo(-11, 22);
      displayCtx.moveTo(6, 16);
      displayCtx.lineTo(11, 22);
      displayCtx.stroke();

      displayCtx.restore();
    }

    function desk(x, y, w, h, monitor = true) {
      displayCtx.save();
      displayCtx.shadowColor = "rgba(40, 35, 25, 0.22)";
      displayCtx.shadowBlur = 7;
      displayCtx.shadowOffsetX = 3;
      displayCtx.shadowOffsetY = 4;

      displayCtx.fillStyle = "#a58a68";
      displayCtx.fillRect(x + 2, y + 2, w, h);

      displayCtx.restore();

      displayCtx.fillStyle = "#bc9465";
      displayCtx.fillRect(x, y, w, h);

      const woodGradient = displayCtx.createLinearGradient(x, y, x, y + h);
      woodGradient.addColorStop(0, "#e2c49a");
      woodGradient.addColorStop(0.45, "#d5b184");
      woodGradient.addColorStop(1, "#c59b6b");

      displayCtx.fillStyle = woodGradient;
      displayCtx.fillRect(x + 2, y + 2, w - 4, h - 4);

      displayCtx.save();
      displayCtx.beginPath();
      displayCtx.rect(x + 3, y + 3, w - 6, h - 6);
      displayCtx.clip();

      displayCtx.strokeStyle = "rgba(115, 78, 42, 0.13)";
      displayCtx.lineWidth = 1;

      for (let i = 0; i < 4; i++) {
        const gy = y + 9 + i * 9;
        displayCtx.beginPath();
        displayCtx.moveTo(x + 5, gy);
        displayCtx.bezierCurveTo(
          x + w * 0.3, gy - 2,
          x + w * 0.65, gy + 2,
          x + w - 5, gy
        );
        displayCtx.stroke();
      }

      displayCtx.restore();

      if (monitor) {
        rounded(x + w / 2 - 16, y + 4, 32, 19, 3, "#27343a");
        rounded(x + w / 2 - 12, y + 7, 24, 13, 2, "#8daeb7");

        fill(x + w / 2 - 3, y + 23, 6, 4, "#526168");
        fill(x + w / 2 - 12, y + 26, 24, 3, "#526168");

        rounded(x + w / 2 - 18, y + h - 12, 36, 6, 2, "#777f80");

        rounded(x + w / 2 + 25, y + h - 14, 7, 11, 3, "#657176");
        fill(x + w / 2 + 28, y + h - 12, 1, 4, "#c5d0ce");
      }

      displayCtx.strokeStyle = "#a68157";
      displayCtx.lineWidth = 1;
      displayCtx.strokeRect(x, y, w, h);
    }

    function meetingTable(x, y, w, h, seats = 6) {
      desk(x, y, w, h, false);

      const horizontalSeats = Math.max(2, Math.ceil(seats / 2));

      for (let i = 0; i < horizontalSeats; i++) {
        const sx = x + ((i + 0.5) * w) / horizontalSeats;
        chair(sx, y - 20);
        chair(sx, y + h + 20, Math.PI);
      }

      chair(x - 21, y + h / 2, -Math.PI / 2);
      chair(x + w + 21, y + h / 2, Math.PI / 2);

      fill(x + w / 2 - 18, y + h / 2 - 9, 36, 18, "#ece7dd");
      fill(x + w / 2 - 13, y + h / 2 - 5, 26, 10, "#697579");
    }

    function plant(x, y, scale = 1) {
      displayCtx.save();
      displayCtx.translate(x, y);
      displayCtx.scale(scale, scale);

      fill(-11, 1, 22, 18, "#b9a78f");
      fill(-8, 3, 16, 13, "#8f9c85");

      for (let i = 0; i < 9; i++) {
        const angle = (Math.PI * 2 * i) / 9;

        displayCtx.beginPath();
        displayCtx.ellipse(
          Math.cos(angle) * 9,
          Math.sin(angle) * 9 - 5,
          7,
          14,
          angle,
          0,
          Math.PI * 2
        );

        displayCtx.fillStyle = i % 2 ? C.leaf : C.green;
        displayCtx.fill();
      }

      displayCtx.restore();
    }

    function sofa(x, y, w, h, color = C.sofa) {
      rounded(x, y, w, h, 9, "#704a36");

      const horizontal = w > h;

      if (horizontal) {
        rounded(x + 5, y + 5, w - 10, h - 10, 6, color);
        line(x + w / 3, y + 7, x + w / 3, y + h - 7, "#d5a27d", 2);
        line(x + (w * 2) / 3, y + 7, x + (w * 2) / 3, y + h - 7, "#d5a27d", 2);
      } else {
        rounded(x + 5, y + 5, w - 10, h - 10, 6, color);
        line(x + 7, y + h / 2, x + w - 7, y + h / 2, "#d5a27d", 2);
      }
    }

    function door(x, y, size, direction = "right") {
      const dx = direction === "right" ? size : -size;
      const dy = direction === "down" ? size : direction === "up" ? -size : 0;

      line(x, y, x + dx, y + dy, "#bdc3be", 3);

      displayCtx.beginPath();

      if (direction === "right") {
        displayCtx.arc(x, y, size, 0, Math.PI / 2);
      } else if (direction === "left") {
        displayCtx.arc(x, y, size, Math.PI / 2, Math.PI);
      } else if (direction === "down") {
        displayCtx.arc(x, y, size, 0, Math.PI / 2);
      } else {
        displayCtx.arc(x, y, size, Math.PI, Math.PI * 1.5);
      }

      displayCtx.strokeStyle = "#9da8a5";
      displayCtx.lineWidth = 2;
      displayCtx.stroke();
    }

    if (redrawBackground) {

    
    fill(0, 0, W, H, "#f7f5ef");

    const floorGradient = displayCtx.createLinearGradient(35, 175, 965, 845);
    floorGradient.addColorStop(0, "#d9d9d2");
    floorGradient.addColorStop(0.5, "#c9c9c2");
    floorGradient.addColorStop(1, "#bcbdb6");

    fill(35, 175, 930, 670, "#c9c9c2");
    displayCtx.fillStyle = floorGradient;
    displayCtx.fillRect(35, 175, 930, 670);

    displayCtx.save();
    displayCtx.beginPath();
    displayCtx.rect(35, 175, 930, 670);
    displayCtx.clip();

    for (let x = 35; x < 965; x += 48) {
      displayCtx.strokeStyle = "rgba(255,255,255,0.18)";
      displayCtx.lineWidth = 1;
      displayCtx.beginPath();
      displayCtx.moveTo(x, 175);
      displayCtx.lineTo(x, 845);
      displayCtx.stroke();
    }

    for (let y = 175; y < 845; y += 48) {
      displayCtx.strokeStyle = "rgba(70,70,65,0.09)";
      displayCtx.lineWidth = 1;
      displayCtx.beginPath();
      displayCtx.moveTo(35, y);
      displayCtx.lineTo(965, y);
      displayCtx.stroke();
    }

    for (let i = 0; i < 180; i++) {
      const x = 45 + ((i * 137) % 910);
      const y = 185 + ((i * 83) % 650);

      displayCtx.fillStyle = i % 2
        ? "rgba(255,255,255,0.12)"
        : "rgba(60,65,60,0.06)";

      displayCtx.fillRect(x, y, 2, 2);
    }

    displayCtx.restore();

    displayCtx.strokeStyle = "#c2c2ba";
    displayCtx.lineWidth = 1;

    for (let x = 40; x < W; x += 34) {
      for (let y = 190; y < H - 20; y += 34) {
        displayCtx.beginPath();
        displayCtx.moveTo(x, y);
        displayCtx.lineTo(x + 12, y);
        displayCtx.stroke();
      }
    }

    wall(25, 25, 950, 10);
    wall(25, 25, 10, 820);
    wall(965, 25, 10, 820);
    wall(25, 835, 220, 10);
    wall(350, 835, 625, 10);

    windowPane(65, 35, 110, 12);
    windowPane(215, 35, 110, 12);
    windowPane(385, 35, 110, 12);
    windowPane(535, 35, 110, 12);
    windowPane(705, 35, 110, 12);
    windowPane(845, 35, 90, 12);

    windowPane(35, 55, 12, 85);
    windowPane(35, 205, 12, 100);
    windowPane(35, 570, 12, 95);

    windowPane(953, 65, 12, 95);
    windowPane(953, 200, 12, 90);
    windowPane(953, 400, 12, 100);
    windowPane(953, 600, 12, 100);

    const rooms = [
      { x: 45, w: 150 },
      { x: 200, w: 155 },
      { x: 360, w: 155 },
      { x: 520, w: 145 },
      { x: 670, w: 135 },
      { x: 810, w: 145 },
    ];

    rooms.forEach((room, i) => {
      fill(room.x, 45, room.w, 125, i % 2 ? "#dcd9d0" : "#e9e1d4");

      wall(room.x, 45, 5, 125);
      wall(room.x + room.w - 5, 45, 5, 125);
      wall(room.x, 45, room.w, 5);

      if (i === 0) {
        desk(room.x + 18, 78, 45, 35, false);
        chair(room.x + 100, 95, 0, "#7c5940");
        plant(room.x + 120, 60, 0.7);
        fill(room.x + 15, 120, 60, 30, "#b6a28a");
      } else if (i === 1) {
        fill(room.x + 18, 65, 90, 65, "#bca487");
        rounded(room.x + 23, 70, 80, 55, 5, "#5b6465");
        fill(room.x + 23, 70, 80, 18, "#727c7c");
        plant(room.x + 125, 60, 0.8);
      } else if (i === 2) {
        desk(room.x + 20, 80, 75, 40);
        chair(room.x + 112, 100);
        plant(room.x + 125, 60, 0.8);
      } else if (i === 3) {
        sofa(room.x + 20, 72, 95, 45, "#9a9d97");
        plant(room.x + 115, 58, 0.7);
      } else if (i === 4) {
        fill(room.x + 10, 57, 100, 20, "#584b3e");
        for (let j = 0; j < 4; j++) {
          fill(room.x + 15 + j * 22, 62, 12, 10, "#c89a61");
        }
        desk(room.x + 22, 94, 75, 38, false);
        plant(room.x + 115, 58, 0.8);
      } else {
        desk(room.x + 30, 78, 75, 40, false);
        chair(room.x + 50, 65);
        chair(room.x + 85, 132);
        plant(room.x + 120, 60, 0.8);
      }

      fill(room.x + 10, 164, room.w - 20, 5, C.glass);
    });

    fill(45, 177, 900, 38, "#d3d2ca");

    wall(45, 214, 160, 5);
    wall(245, 214, 210, 5);
    wall(495, 214, 195, 5);
    wall(730, 214, 215, 5);

    door(205, 214, 35, "right");
    door(455, 214, 35, "right");
    door(690, 214, 35, "right");

    meetingTable(100, 275, 190, 45, 6);
    meetingTable(100, 390, 190, 45, 6);

    desk(65, 495, 120, 55);
    chair(125, 575);

    displayCtx.fillStyle = "#b18a5c";
    displayCtx.beginPath();
    displayCtx.arc(175, 650, 47, 0, Math.PI * 2);
    displayCtx.fill();

    displayCtx.fillStyle = "#dfc29a";
    displayCtx.beginPath();
    displayCtx.arc(175, 650, 42, 0, Math.PI * 2);
    displayCtx.fill();

    chair(175, 590);
    chair(120, 650);
    chair(230, 650);

    plant(65, 330, 1.5);
    plant(300, 365, 0.9);

    meetingTable(415, 330, 175, 85, 6);

    desk(435, 485, 120, 55);
    chair(495, 565);

    desk(590, 470, 105, 40, false);
    chair(640, 455);

    plant(380, 270, 0.9);
    plant(605, 275, 0.9);
    plant(375, 445, 1);
    plant(710, 330, 0.8);

    displayCtx.fillStyle = "#b7b7ae";
    displayCtx.beginPath();
    displayCtx.arc(805, 290, 65, 0, Math.PI * 2);
    displayCtx.fill();

    displayCtx.fillStyle = "#c79a65";
    displayCtx.beginPath();
    displayCtx.arc(805, 290, 33, 0, Math.PI * 2);
    displayCtx.fill();

    chair(805, 245, Math.PI);
    chair(805, 335);
    chair(765, 290, -Math.PI / 2);
    chair(845, 290, Math.PI / 2);

    displayCtx.fillStyle = "#c79a65";
    displayCtx.beginPath();
    displayCtx.arc(870, 420, 30, 0, Math.PI * 2);
    displayCtx.fill();

    chair(870, 380);
    chair(870, 460);
    chair(830, 420, -Math.PI / 2);
    chair(910, 420, Math.PI / 2);

    fill(825, 490, 115, 24, "#a17c57");
    fill(830, 495, 105, 14, "#e2d4bb");

    for (let i = 0; i < 4; i++) {
      fill(835 + i * 25, 498, 12, 8, "#3d484c");
    }

    desk(815, 550, 120, 65, false);

    plant(930, 250, 1);
    plant(925, 475, 0.9);
    plant(780, 520, 0.8);

    fill(45, 700, 360, 125, "#b7b1a5");
    sofa(75, 730, 250, 65);
    desk(155, 685, 90, 32, false);

    plant(55, 715, 1.6);
    plant(345, 790, 0.8);

    fill(45, 655, 28, 140, "#7c6047");
    fill(49, 665, 20, 4, "#d4b38b");
    fill(49, 695, 20, 4, "#d4b38b");
    fill(49, 725, 20, 4, "#d4b38b");
    fill(49, 755, 20, 4, "#d4b38b");

    wall(405, 680, 5, 155);
    wall(405, 680, 120, 5);
    door(525, 680, 45, "right");

    fill(540, 650, 400, 175, "#b8b8af");

    wall(535, 645, 410, 6);
    wall(535, 645, 6, 190);
    wall(940, 645, 5, 190);
    wall(535, 830, 410, 5);

    door(535, 735, 45, "right");

    desk(620, 690, 130, 55);
    chair(685, 765);

    desk(805, 700, 95, 45);
    chair(850, 765);

    fill(910, 665, 22, 140, "#6e533b");

    for (let y = 675; y < 795; y += 25) {
      fill(913, y, 16, 15, "#c69a68");
    }

    plant(570, 790, 0.9);
    plant(920, 650, 0.7);

// Avatar overlay - Simple 2D cartoon character


// Your avatar

// Render furniture saved in MongoDB
(roomLayout?.furniture || []).forEach((item) => {
  if (
    !Number.isFinite(item.x) ||
    !Number.isFinite(item.y) ||
    !Number.isFinite(item.width) ||
    !Number.isFinite(item.height)
  ) {
    return;
  }

  switch (item.type) {
    case "desk":
      desk(item.x, item.y, item.width, item.height);
      break;

    case "sofa":
      sofa(item.x, item.y, item.width, item.height);
      break;

    case "meetingTable":
      meetingTable(item.x, item.y, item.width, item.height);
      break;

    default:
      fill(
        item.x,
        item.y,
        item.width,
        item.height,
        "#a0a0a0"
      );
  }
});

// Render obstacles saved in MongoDB
(roomLayout?.obstacles || []).forEach((item) => {
  if (
    !Number.isFinite(item.x) ||
    !Number.isFinite(item.y) ||
    !Number.isFinite(item.width) ||
    !Number.isFinite(item.height)
  ) {
    return;
  }

  fill(
    item.x,
    item.y,
    item.width,
    item.height,
    "rgba(220, 60, 60, 0.45)"
  );
});

}

  function drawAvatar(x, y, shirtColor, name) {
  avatarCtx.save();
avatarCtx.translate(x, y);

  // Shadow
  avatarCtx.fillStyle = "rgba(0, 0, 0, 0.15)";
  avatarCtx.beginPath();
  avatarCtx.ellipse(0, 20, 11, 4, 0, 0, Math.PI * 2);
  avatarCtx.fill();

  // Legs
  avatarCtx.fillStyle = "#34495e";
  avatarCtx.fillRect(-6, 8, 5, 12);
  avatarCtx.fillRect(1, 8, 5, 12);

  // Shoes
  avatarCtx.fillStyle = "#292929";
  avatarCtx.fillRect(-8, 18, 7, 4);
  avatarCtx.fillRect(1, 18, 7, 4);

  // Arms
  avatarCtx.strokeStyle = "#e8b58f";
  avatarCtx.lineWidth = 5;
  avatarCtx.lineCap = "round";
  avatarCtx.beginPath();
  avatarCtx.moveTo(-7, -3);
  avatarCtx.lineTo(-11, 7);
  avatarCtx.moveTo(7, -3);
  avatarCtx.lineTo(11, 7);
  avatarCtx.stroke();

  // Body / shirt
  avatarCtx.fillStyle = shirtColor;
  avatarCtx.beginPath();
  avatarCtx.roundRect(-8, -6, 16, 17, 4);
  avatarCtx.fill();

  // Neck
  avatarCtx.fillStyle = "#e8b58f";
  avatarCtx.fillRect(-3, -12, 6, 7);

  // Face
avatarCtx.fillStyle = "#e8b58f";
avatarCtx.beginPath();
avatarCtx.ellipse(0, -17, 9, 10, 0, 0, Math.PI * 2);
avatarCtx.fill();

  // Hair
  avatarCtx.fillStyle = "#49352b";
  avatarCtx.beginPath();
  avatarCtx.arc(0, -19, 9, Math.PI, Math.PI * 2);
  avatarCtx.fill();
  avatarCtx.fillRect(-9, -20, 4, 8);

  // Eyes
  avatarCtx.fillStyle = "#292929";
  avatarCtx.beginPath();
  avatarCtx.arc(-3, -17, 1, 0, Math.PI * 2);
  avatarCtx.arc(3, -17, 1, 0, Math.PI * 2);
  avatarCtx.fill();

  // Smile
  avatarCtx.strokeStyle = "#7b493c";
  avatarCtx.lineWidth = 1;
  avatarCtx.beginPath();
  avatarCtx.arc(0, -14, 3, 0.2, Math.PI - 0.2);
  avatarCtx.stroke();

  avatarCtx.restore();

  // Username
  avatarCtx.fillStyle = "#263747";
  avatarCtx.font = "bold 13px Arial";
  avatarCtx.textAlign = "center";
  avatarCtx.fillText(name, x, y + 32);
}

if (redrawBackground) {
  backgroundReadyRef.current = true;
  cachedRoomLayoutRef.current = roomLayout;
}

avatarCtx.clearRect(0, 0, W, H);
avatarCtx.drawImage(backgroundCanvas, 0, 0);


drawAvatar(avatarX, avatarY, "#4169e1", "You");

    // Draw avatars belonging to other connected users
Object.entries(otherAvatars).forEach(([id, position], index) => {
  if (
    !position ||
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y)
  ) {
    return;
  }

  drawAvatar(
    position.x,
    position.y,
    "#2eaa72",
    `User ${index + 1}`
  );
});
  }, [avatarX, avatarY, otherAvatars, roomLayout]);

  // Keyboard Movements effect
  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key.toLowerCase();

      const movements = {
        arrowup: [0, -10],
        w: [0, -10],
        arrowdown: [0, 10],
        s: [0, 10],
        arrowleft: [-10, 0],
        a: [-10, 0],
        arrowright: [10, 0],
        d: [10, 0],
      };

      const movement = movements[key];
      if (!movement) return;

      if (key.startsWith("arrow")) {
        event.preventDefault();
      }

      const [dx, dy] = movement;

      setAvatarX((x) => Math.max(65, Math.min(935, x + dx)));
      setAvatarY((y) => Math.max(65, Math.min(805, y + dy)));
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
  <>
    <button
      onClick={saveRoomLayout}
      disabled={!roomLayout || isSaving}
    >
      {isSaving ? "Saving..." : "Save Layout"}
    </button>

    <canvas
      ref={canvasRef}
      className="office-canvas"
      aria-label="ProxiSpeak architectural 2D office floor plan"
    />
  </>
);
}