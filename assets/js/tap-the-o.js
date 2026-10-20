// FOB Tap the O Toy (PRD Section 10: ANI-03, 23.5)

export function initTapTheOToy() {
  const heroO = document.querySelector(".hero-o");
  const tapHint = document.querySelector(".fob-tap-hint");
  if (!heroO) return;

  // Check if reduced motion is requested
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  heroO.addEventListener("click", (e) => {
    // Hide hint bubble permanently after first interaction
    if (tapHint) {
      tapHint.style.display = "none";
    }

    // Soft spring pop on the O itself
    heroO.style.transform = "scale(1.3) rotate(20deg)";
    setTimeout(() => {
      heroO.style.transform = "";
    }, 250);

    if (prefersReduced) return;

    const rect = heroO.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    launchToyParticles(originX, originY);
  });
}

function launchToyParticles(originX, originY) {
  let canvas = document.getElementById("fob-toy-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "fob-toy-canvas";
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#D7FF1F", "#FF6B1A", "#1ED760", "#FF3DA5", "#00D1FF", "#8B5CF6", "#FFFFFF"];
  const particleTypes = ["ball-football", "ball-basketball", "ball-snooker", "ball-tennis", "spark", "spark"];

  const particles = [];
  const COUNT = 22; // PRD: at most 24 sprites

  for (let i = 0; i < COUNT; i++) {
    const angle = (Math.PI * 2 * (i / COUNT)) + (Math.random() - 0.5) * 0.4;
    const speed = 7 + Math.random() * 9;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6, // extra upward pop
      radius: 8 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
      bounces: 0,
      maxBounces: 2,
      gravity: 0.38,
      friction: 0.985
    });
  }

  let animationFrameId;
  const startTime = Date.now();

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeCount = 0;

    for (const p of particles) {
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;

      // Bounce on floor
      if (p.y + p.radius > canvas.height) {
        p.y = canvas.height - p.radius;
        p.vy = -p.vy * 0.55;
        p.bounces++;
      }

      // Check if off-screen or finished
      if (p.y < canvas.height + 50 && p.bounces <= p.maxBounces) {
        activeCount++;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === "spark") {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.radius / 2, -p.radius / 2, p.radius, p.radius);
      } else {
        // Sport ball drawing
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#0E0E2C";
        ctx.stroke();

        // Inner ball detail
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "#0E0E2C";
        ctx.fill();
      }

      ctx.restore();
    }

    // Terminate after 2 seconds or when all particles settled (PRD Section 10, 23.5)
    if (activeCount > 0 && (Date.now() - startTime) < 2200) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrameId);
    }
  }

  render();
}
