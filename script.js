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

function isMobile() {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a,
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4),
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

function detectWebcam(callback) {
  let md = navigator.mediaDevices;
  if (!md || !md.enumerateDevices) return callback(false);
  md.enumerateDevices().then((devices) => {
    callback(devices.some((device) => "videoinput" === device.kind));
  });
}

if (isMobile()) {
  alert(
    "This site might not work on mobile. For an ideal experience use a larger device.",
  );
} else {
  detectWebcam((hasWebcam) => {
    if (!hasWebcam) {
      alert("This site needs a webcam to function, sorry :(");
    }
  });
}
startEyetracking();
calibrateEyetracking(10, startTheremin);
