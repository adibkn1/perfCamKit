import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

async function initCameraKit() {
  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });


    let mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 4096, height: 2160, facingMode: 'environment' }
    });

    const session = await cameraKit.createSession();
    const canvas = document.getElementById('canvas');
    const videoElement = session.output.live;

    // Ensure the live output replaces the canvas for the video feed
    if (canvas) {
      canvas.parentElement.replaceChild(videoElement, canvas);
    }

    const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']);
    session.applyLens(lenses[0]);

    const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
    await session.setSource(source);
    session.source.setRenderSize(window.innerWidth, window.innerHeight);
    session.play();

    document.getElementById('captureButton').addEventListener('click', () => {
      captureScreenshot(videoElement);
    });

  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}

function captureScreenshot(videoElement) {
  const tempCanvas = document.createElement('canvas');
  const context = tempCanvas.getContext('2d');
  tempCanvas.width = videoElement.videoWidth;
  tempCanvas.height = videoElement.videoHeight;
  context.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

  tempCanvas.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'screenshot.png';
    link.click();
  }, 'image/png');
}

document.addEventListener('DOMContentLoaded', initCameraKit);