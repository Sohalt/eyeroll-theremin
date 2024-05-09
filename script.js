function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

var osc;
async function initAudio() {
  await Tone.start();
  osc = new Tone.Oscillator().toDestination();
  console.log("audio is ready");
}

function moveNote([x, y]) {
  let note = document.querySelector("#note");
  note.style.left = `${x}px`;
  note.style.top = `${y}px`;
}

var useMouse = false;
function useGaze() {
  return !useMouse;
}

function lookAt(x, y) {
  const width =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
  const height =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  let x2 = clamp(x - width / 2, -width / 2, width / 2);
  let y2 = clamp(y - height / 2, -height / 2, height / 2);
  let angle = Math.atan2(y2, x2);
  let svg = document.querySelector("#face svg");
  let pupils = svg.querySelector("#pupils");
  let eyeRadius = 11;
  let pupilOffsetX = Math.cos(angle) * eyeRadius;
  let pupilOffsetY = Math.sin(angle) * eyeRadius;
  let transform = `translate(${pupilOffsetX},${pupilOffsetY})`;
  console.log(transform);
  pupils.setAttributeNS(null, "transform", transform);
}

function callback(x, y) {
  console.log("callback", x, y);
  moveNote([x, y]);
  lookAt(x, y);
  if (osc !== undefined) {
    osc.frequency.rampTo(clamp(x, 20, 22000), 1);
  }
}

async function startTheremin() {
  await initAudio();
  osc.start();
  document.addEventListener("mousemove", (e) => {
    if (useMouse) {
      callback(e.x, e.y);
    }
  });
  webgazer
    .setGazeListener(function (data, elapsedTime) {
      if (data == null) {
        return;
      }
      if (useGaze()) {
        callback(data.x, data.y);
      }
    })
    .begin();
}

var playing = false;
document.querySelector("#playpause")?.addEventListener("click", async (e) => {
  if (playing) {
    e.target.innerHTML = "play";
    osc.stop();
  } else {
    e.target.innerHTML = "pause";
    osc.start();
  }
});

document.querySelector("#mousegaze")?.addEventListener("click", (e) => {
  if (useMouse) {
    useMouse = false;
    e.target.innerHTML = "Use mouse";
  } else {
    useMouse = true;
    e.target.innerHTML = "Use gaze";
  }
});

function startEyetracking() {
  webgazer.showPredictionPoints(false);
  webgazer.showVideo(false);
  webgazer.begin();
}

function updateProgress(progress) {
  let container = document.querySelector("#progress");
  let bar = container.querySelector("div");
  bar.style.width = `${progress * container.offsetWidth}px`;
}

function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

const speed = 0.05;
var lastTime;
var animating = false;
function animateNote(timestamp) {
  let delta = timestamp - lastTime;
  lastTime = timestamp;
  let note = document.querySelector("#note");
  const width =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
  const height =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  moveNote([
    clamp(
      note.offsetLeft + (Math.random() - 0.5) * 2 * speed * delta,
      0,
      width - note.offsetWidth,
    ),
    clamp(
      note.offsetTop + (Math.random() - 0.5) * 2 * speed * delta,
      0,
      height - note.offsetHeight,
    ),
  ]);
  if (animating) {
    requestAnimationFrame(animateNote);
  }
}
function startAnimateNote() {
  animating = true;
  lastTime = 0;
  animateNote(0);
}
function stopAnimateNote() {
  animating = false;
}

function calibrateEyetracking(calibrationPoints, onFinished) {
  let container = document.querySelector("#calibration");
  const width =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;
  const height =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  var calibrationPoints = [];
  const grid = 3;
  const padding = 50;
  for (
    x = padding;
    x <= width - padding;
    x += (width - 2 * padding) / (grid - 1)
  ) {
    for (
      y = padding;
      y <= height - padding;
      y += (height - 2 * padding) / (grid - 1)
    ) {
      calibrationPoints.push([x, y]);
    }
  }
  calibrationPoints = calibrationPoints.map(([x, y]) => {
    const scatter = 100;
    return [
      clamp(x + (Math.random() - 0.5) * scatter * 2, padding, width - padding),
      clamp(y + (Math.random() - 0.5) * scatter * 2, padding, height - padding),
    ];
  });
  shuffle(calibrationPoints);
  const requiredClicks = calibrationPoints.length;
  var clicks = 0;
  moveNote(calibrationPoints[clicks]);
  startAnimateNote();
  let note = document.querySelector("#note");
  note.addEventListener("click", (e) => {
    if (clicks == 0) {
      document.querySelector("#welcome").style.display = "none";
      container.style.display = "flex";
    }
    clicks++;
    updateProgress(clicks / requiredClicks);
    if (clicks >= requiredClicks) {
      //note.style.display = "none";
      container.style.display = "none";
      document.querySelector("#play").style.display = "flex";
      stopAnimateNote();
      onFinished();
    } else {
      moveNote(calibrationPoints[clicks]);
    }
  });
}

startEyetracking();
calibrateEyetracking(10, startTheremin);
