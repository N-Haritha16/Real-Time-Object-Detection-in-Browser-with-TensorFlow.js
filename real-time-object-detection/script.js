const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const imageUpload = document.getElementById('imageUpload');
const imageCanvas = document.getElementById('imageCanvas');
const imageCtx = imageCanvas.getContext('2d');

let model;

console.log('Loading model...');
cocoSsd.load()
  .then((loadedModel) => {
    console.log('Model loaded');
    model = loadedModel;
    startWebcam();
  })
  .catch((error) => {
    console.error('Model loading failed:', error);
  });

// Start webcam stream and detection loop
function startWebcam() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.addEventListener('loadeddata', detectFrame);
    })
    .catch((err) => {
      console.error('Error accessing webcam:', err);
    });
}

// Detect objects on webcam video frames
function detectFrame() {
  model.detect(video).then((predictions) => {
    drawPredictions(predictions, ctx, video, canvas);
    requestAnimationFrame(detectFrame);
  }).catch((err) => {
    console.error('Detection error:', err);
  });
}

// Draw bounding boxes and labels on canvas for given predictions
function drawPredictions(predictions, context, source, targetCanvas) {
  context.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  context.drawImage(source, 0, 0, targetCanvas.width, targetCanvas.height);

  predictions.forEach((pred) => {
    const [x, y, width, height] = pred.bbox;
    context.strokeStyle = '#00FF00';
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);

    context.fillStyle = '#00FF00';
    context.font = '16px Arial';
    context.fillText(`${pred.class} (${Math.round(pred.score * 100)}%)`, x, y > 10 ? y - 5 : 10);
  });
}

// Helper function to group classes into categories
function getCategory(objectClass) {
  const animals = ['cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'];
  const persons = ['person'];
  if (animals.includes(objectClass)) return 'Animal';
  if (persons.includes(objectClass)) return 'Person';
  return 'Object';
}

// Image upload detection event
imageUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = async function() {
      // Resize canvas to image size
      imageCanvas.width = img.width;
      imageCanvas.height = img.height;

      // Draw image on canvas
      imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
      imageCtx.drawImage(img, 0, 0);

      // Run detection on image
      const predictions = await model.detect(img);

      // Draw bounding boxes with categories
      predictions.forEach(pred => {
        const [x, y, width, height] = pred.bbox;
        const category = getCategory(pred.class);

        imageCtx.strokeStyle = '#FF0000';
        imageCtx.lineWidth = 2;
        imageCtx.strokeRect(x, y, width, height);

        imageCtx.fillStyle = '#FF0000';
        imageCtx.font = '18px Arial';
        imageCtx.fillText(`${category}: ${pred.class} (${Math.round(pred.score * 100)}%)`, x, y > 20 ? y - 5 : 20);
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});
