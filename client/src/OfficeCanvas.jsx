import { useEffect, useRef, useState } from "react";

export default function OfficeCanvas({
  onPositionChange,
  otherAvatars = {},
}) {
  const canvasRef = useRef(null);

  const [avatarX, setAvatarX] = useState(500);
  const [avatarY, setAvatarY] = useState(590);

  // Send the latest avatar position to App.jsx.
  useEffect(() => {
    onPositionChange?.({ x: avatarX, y: avatarY });
  }, [avatarX, avatarY, onPositionChange]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const W = 1000;
    const H = 880;

    canvas.width = W;
    canvas.height = H;

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
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    }

    function rounded(x, y, w, h, r, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    }

    function line(x1, y1, x2, y2, color = C.wall, width = 5) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    function wall(x, y, w, h) {
      fill(x, y, w, h, C.wall);
    }

    function windowPane(x, y, w, h) {
      fill(x, y, w, h, "#f6f5ef");

      const glassGradient = ctx.createLinearGradient(x, y, x + w, y + h);
      glassGradient.addColorStop(0, "#c5e6e9");
      glassGradient.addColorStop(0.5, "#a8d3dc");
      glassGradient.addColorStop(1, "#8ebbc7");

      ctx.fillStyle = glassGradient;
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + h - 4);
      ctx.lineTo(x + w - 5, y + 4);
      ctx.stroke();

      ctx.strokeStyle = "#f9ffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    }

    function chair(x, y, angle = 0, color = C.chair) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.fillStyle = "rgba(30, 35, 38, 0.15)";
      ctx.beginPath();
      ctx.ellipse(2, 4, 17, 19, 0, 0, Math.PI * 2);
      ctx.fill();

      rounded(-17, -9, 5, 21, 2, "#343f45");
      rounded(12, -9, 5, 21, 2, "#343f45");
      rounded(-13, -17, 26, 16, 5, "#3e4c53");
      rounded(-12, -7, 24, 21, 5, color);

      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-8, -3, 16, 12);

      ctx.strokeStyle = "#56636a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(0, 18);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-9, 19);
      ctx.lineTo(9, 19);
      ctx.moveTo(-6, 16);
      ctx.lineTo(-11, 22);
      ctx.moveTo(6, 16);
      ctx.lineTo(11, 22);
      ctx.stroke();

      ctx.restore();
    }

    function desk(x, y, w, h, monitor = true) {
      ctx.save();
      ctx.shadowColor = "rgba(40, 35, 25, 0.22)";
      ctx.shadowBlur = 7;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = "#a58a68";
      ctx.fillRect(x + 2, y + 2, w, h);

      ctx.restore();

      ctx.fillStyle = "#bc9465";
      ctx.fillRect(x, y, w, h);

      const woodGradient = ctx.createLinearGradient(x, y, x, y + h);
      woodGradient.addColorStop(0, "#e2c49a");
      woodGradient.addColorStop(0.45, "#d5b184");
      woodGradient.addColorStop(1, "#c59b6b");

      ctx.fillStyle = woodGradient;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 3, y + 3, w - 6, h - 6);
      ctx.clip();

      ctx.strokeStyle = "rgba(115, 78, 42, 0.13)";
      ctx.lineWidth = 1;

      for (let i = 0; i < 4; i++) {
        const gy = y + 9 + i * 9;
        ctx.beginPath();
        ctx.moveTo(x + 5, gy);
        ctx.bezierCurveTo(
          x + w * 0.3, gy - 2,
          x + w * 0.65, gy + 2,
          x + w - 5, gy
        );
        ctx.stroke();
      }

      ctx.restore();

      if (monitor) {
        rounded(x + w / 2 - 16, y + 4, 32, 19, 3, "#27343a");
        rounded(x + w / 2 - 12, y + 7, 24, 13, 2, "#8daeb7");

        fill(x + w / 2 - 3, y + 23, 6, 4, "#526168");
        fill(x + w / 2 - 12, y + 26, 24, 3, "#526168");

        rounded(x + w / 2 - 18, y + h - 12, 36, 6, 2, "#777f80");

        rounded(x + w / 2 + 25, y + h - 14, 7, 11, 3, "#657176");
        fill(x + w / 2 + 28, y + h - 12, 1, 4, "#c5d0ce");
      }

      ctx.strokeStyle = "#a68157";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
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
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      fill(-11, 1, 22, 18, "#b9a78f");
      fill(-8, 3, 16, 13, "#8f9c85");

      for (let i = 0; i < 9; i++) {
        const angle = (Math.PI * 2 * i) / 9;

        ctx.beginPath();
        ctx.ellipse(
          Math.cos(angle) * 9,
          Math.sin(angle) * 9 - 5,
          7,
          14,
          angle,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = i % 2 ? C.leaf : C.green;
        ctx.fill();
      }

      ctx.restore();
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

      ctx.beginPath();

      if (direction === "right") {
        ctx.arc(x, y, size, 0, Math.PI / 2);
      } else if (direction === "left") {
        ctx.arc(x, y, size, Math.PI / 2, Math.PI);
      } else if (direction === "down") {
        ctx.arc(x, y, size, 0, Math.PI / 2);
      } else {
        ctx.arc(x, y, size, Math.PI, Math.PI * 1.5);
      }

      ctx.strokeStyle = "#9da8a5";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    fill(0, 0, W, H, "#f7f5ef");

    const floorGradient = ctx.createLinearGradient(35, 175, 965, 845);
    floorGradient.addColorStop(0, "#d9d9d2");
    floorGradient.addColorStop(0.5, "#c9c9c2");
    floorGradient.addColorStop(1, "#bcbdb6");

    fill(35, 175, 930, 670, "#c9c9c2");
    ctx.fillStyle = floorGradient;
    ctx.fillRect(35, 175, 930, 670);

    ctx.save();
    ctx.beginPath();
    ctx.rect(35, 175, 930, 670);
    ctx.clip();

    for (let x = 35; x < 965; x += 48) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 175);
      ctx.lineTo(x, 845);
      ctx.stroke();
    }

    for (let y = 175; y < 845; y += 48) {
      ctx.strokeStyle = "rgba(70,70,65,0.09)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(965, y);
      ctx.stroke();
    }

    for (let i = 0; i < 180; i++) {
      const x = 45 + ((i * 137) % 910);
      const y = 185 + ((i * 83) % 650);

      ctx.fillStyle = i % 2
        ? "rgba(255,255,255,0.12)"
        : "rgba(60,65,60,0.06)";

      ctx.fillRect(x, y, 2, 2);
    }

    ctx.restore();

    ctx.strokeStyle = "#c2c2ba";
    ctx.lineWidth = 1;

    for (let x = 40; x < W; x += 34) {
      for (let y = 190; y < H - 20; y += 34) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 12, y);
        ctx.stroke();
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

    ctx.fillStyle = "#b18a5c";
    ctx.beginPath();
    ctx.arc(175, 650, 47, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dfc29a";
    ctx.beginPath();
    ctx.arc(175, 650, 42, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.fillStyle = "#b7b7ae";
    ctx.beginPath();
    ctx.arc(805, 290, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#c79a65";
    ctx.beginPath();
    ctx.arc(805, 290, 33, 0, Math.PI * 2);
    ctx.fill();

    chair(805, 245, Math.PI);
    chair(805, 335);
    chair(765, 290, -Math.PI / 2);
    chair(845, 290, Math.PI / 2);

    ctx.fillStyle = "#c79a65";
    ctx.beginPath();
    ctx.arc(870, 420, 30, 0, Math.PI * 2);
    ctx.fill();

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
function drawAvatar(x, y, shirtColor, name) {
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.beginPath();
  ctx.ellipse(0, 20, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = "#34495e";
  ctx.fillRect(-6, 8, 5, 12);
  ctx.fillRect(1, 8, 5, 12);

  // Shoes
  ctx.fillStyle = "#292929";
  ctx.fillRect(-8, 18, 7, 4);
  ctx.fillRect(1, 18, 7, 4);

  // Arms
  ctx.strokeStyle = "#e8b58f";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-7, -3);
  ctx.lineTo(-11, 7);
  ctx.moveTo(7, -3);
  ctx.lineTo(11, 7);
  ctx.stroke();

  // Body / shirt
  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.roundRect(-8, -6, 16, 17, 4);
  ctx.fill();

  // Neck
  ctx.fillStyle = "#e8b58f";
  ctx.fillRect(-3, -12, 6, 7);

  // Face
ctx.fillStyle = "#e8b58f";
ctx.beginPath();
ctx.ellipse(0, -17, 9, 10, 0, 0, Math.PI * 2);
ctx.fill();

  // Hair
  ctx.fillStyle = "#49352b";
  ctx.beginPath();
  ctx.arc(0, -19, 9, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-9, -20, 4, 8);

  // Eyes
  ctx.fillStyle = "#292929";
  ctx.beginPath();
  ctx.arc(-3, -17, 1, 0, Math.PI * 2);
  ctx.arc(3, -17, 1, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = "#7b493c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -14, 3, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();

  // Username
  ctx.fillStyle = "#263747";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(name, x, y + 32);
}

// Your avatar
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
  }, [avatarX, avatarY, otherAvatars]);

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
    <canvas
      ref={canvasRef}
      className="office-canvas"
      aria-label="ProxiSpeak architectural 2D office floor plan"
    />
  );
}