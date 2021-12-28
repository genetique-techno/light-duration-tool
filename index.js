
const captureOffBtn = document.getElementById("captureOffBtn")
const captureOnBtn = document.getElementById("captureOnBtn")
const startBtn = document.getElementById("startBtn")
const offImg = document.getElementById("offImg")
const onImg = document.getElementById("onImg")
const video = document.getElementById("video")
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// config
const width = 320
const interval = 2000 // ms between captures
startBtn.setAttribute("disabled", "disabled")
captureOffBtn.setAttribute("disabled", "disabled")
captureOnBtn.setAttribute("disabled", "disabled")

// state
let isStreaming = false
let height = null
let onMeasured = false
let offMeasured = false
let offValue = null
let onValue = null

video.addEventListener("canplay", event => {
  if (!isStreaming) {
    height = video.videoHeight / (video.videoWidth/width)
    video.setAttribute('width', width)
    video.setAttribute('height', height)
    canvas.setAttribute('width', width)
    canvas.setAttribute('height', height)
    isStreaming = true
  }
}, false)

captureOffBtn.addEventListener("click", event => {
  offValue = captureAndMeasure()
  toImg(offImg)
  console.log("captured OFF state at: ", offValue)
  maybeEnableStartBtn()
}, false)

captureOnBtn.addEventListener("click", event => {
  onValue = captureAndMeasure()
  toImg(onImg)
  console.log("captured ON state at: ", onValue)
  maybeEnableStartBtn()
}, false)

startBtn.addEventListener("click", () => {
  if (onValue <= offValue || Math.abs(onValue - offValue) < 20) {
    console.log(`Invalid State Captured. off: ${offValue}, on: ${onValue}`)
    return 0
  }
  startBtn.setAttribute("disabled", "disabled")
  captureOffBtn.setAttribute("disabled", "disabled")
  captureOnBtn.setAttribute("disabled", "disabled")
  executeTestLoop()
})

function maybeEnableStartBtn() {
  if (onValue && offValue) {
    startBtn.removeAttribute("disabled")
  }
}

function getBrightness() {
  let colorSum = 0;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let r, g, b, avg;

  for(let x=0, len=data.length; x<len; x+=4) {
    r = data[x];
    g = data[x+1];
    b = data[x+2];
    avg = Math.floor((r+g+b) / 3);
    colorSum += avg;
  }

  return Math.floor(colorSum / (canvas.width * canvas.height));
};

function startup() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      video.srcObject = stream
      video.play()
      captureOnBtn.removeAttribute("disabled")
      captureOffBtn.removeAttribute("disabled")
    })
    .catch(console.log)
}

function toImg(imgElement) {
  const data = canvas.toDataURL("image/png")
  imgElement.setAttribute("src", data)
}

function captureAndMeasure() {
  ctx.drawImage(video, 0, 0, width, height)
  return getBrightness()
}

function executeTestLoop() {
  let startTime = new Date()
  let endTime
  // calculate the threshold
  const limit = (onValue - offValue) / 2 + offValue
  // check if light is on
  if (captureAndMeasure() <= limit) {
    console.log("cannot start with light off")
    return 0
  }

  console.log(`Starting test: ${startTime}`)

  function loop() {
    setTimeout(() => {
      let t = captureAndMeasure()
      console.log(`capture, brightness: ${t}`)
      if (t < limit) {
        endTime = new Date()
        console.log(`TEST ENDED. Start: ${startTime}, End: ${endTime}, Duration: ${endTime - startTime}`)
      } else loop()
    }, interval)
  }

  loop()
}


startup()