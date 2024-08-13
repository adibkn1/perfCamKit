import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

async function initCameraKit() {
  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    // Configure media stream with high resolution
    let mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'environment' } // Reduced resolution for better performance
    });

    // Create a new session
    const session = await cameraKit.createSession();
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const videoElement = session.output.live; // Get the video feed element

    const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']);
    session.applyLens(lenses[0]);

    const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
    await session.setSource(source);
    session.source.setRenderSize(window.innerWidth, window.innerHeight);
    session.play();

    // Set canvas dimensions to match the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Function to draw the video and overlay text onto the canvas
    function drawFrame() {
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Add overlay text to the canvas
      context.font = '30px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText('Overlay Text Example', canvas.width / 2, 20);

      requestAnimationFrame(drawFrame);
    }

    // Start drawing the video frames onto the canvas
    drawFrame();

    // Capture button functionality
    document.getElementById('captureButton').addEventListener('click', () => {
      captureScreenshot(canvas);
    });

  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}

async function captureScreenshot(canvas) {
  // Convert canvas content to a Blob
  canvas.toBlob(async (blob) => {
    if (!blob) return;

    // Check if the Web Share API is supported
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'screenshot.png', { type: 'image/png' })] })) {
      try {
        await navigator.share({
          files: [new File([blob], 'screenshot.png', { type: 'image/png' })],
          title: 'Screenshot',
          text: 'Check out this screenshot!',
        });
        console.log('Image shared successfully');
      } catch (error) {
        console.error('Error sharing image:', error);
        downloadImage(blob); // Fallback to download if sharing fails
      }
    } else {
      // Fallback to download if sharing is not supported
      downloadImage(blob);
    }
  }, 'image/png');
}

function downloadImage(blob) {
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'screenshot.png';

  // Append the link to the document
  document.body.appendChild(link);

  // Simulate a click to download the image
  link.click();

  // Remove the link after triggering download
  link.parentNode.removeChild(link);
}

// Initialize the camera kit on page load
document.addEventListener('DOMContentLoaded', initCameraKit);