import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';
import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAv5H0-jgze_z1dvT8mHFRwusYXAiTSJgw",
    authDomain: "digitalrakhi-f8060.firebaseapp.com",
    databaseURL: "https://digitalrakhi-f8060-default-rtdb.firebaseio.com",
    projectId: "digitalrakhi-f8060",
    storageBucket: "digitalrakhi-f8060.appspot.com",
    messagingSenderId: "360526523502",
    appId: "1:360526523502:web:3e1af0fd17e9bb1ca5ca7f",
    measurementId: "G-FPJ5LHJEVS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    showReceiverContainer(token);
  } else {
    showFormContainer();
  }

  const sendButton = document.getElementById('sendButton');
  if (sendButton) {
    sendButton.addEventListener('click', submitRakhi);
  }

  const experienceButton = document.getElementById('experienceButton');
  if (experienceButton) {
    experienceButton.addEventListener('click', showCamera);
  }
});

function showFormContainer() {
    document.getElementById('form-container').style.display = 'flex';
    document.getElementById('receiver-container').style.display = 'none';
    document.getElementById('camera-container').style.display = 'none';
}

function showReceiverContainer(token) {
  const rakhiRef = ref(database, 'rakhis/' + token);
  onValue(rakhiRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const receiverMessageElement = document.getElementById('receiverMessage');

      if (receiverMessageElement) {
        receiverMessageElement.textContent = `Hey, ${data.brotherName}, your sister ${data.sisterName} sent you a Rakhi!`;
      } else {
        console.error('Receiver message element not found');
      }

      document.getElementById('form-container').style.display = 'none';
      document.getElementById('camera-container').style.display = 'none';
      document.getElementById('receiver-container').style.display = 'flex';
    } else {
      alert('No valid token found.');
      showFormContainer();
    }
  }, { onlyOnce: true });
}

function submitRakhi() {
    const sisterName = document.getElementById('sisterName').value;
    const brotherName = document.getElementById('brotherName').value;
    const terms = document.getElementById('terms').checked;

    if (!sisterName || !brotherName || !terms) {
        alert('Please fill all fields and agree to the terms.');
        return;
    }

    // Store data in Firebase
    const newEntryRef = ref(database, 'rakhis');
    const newPostRef = push(newEntryRef);
    set(newPostRef, {
        sisterName: sisterName,
        brotherName: brotherName
    }).then(() => {
        alert('Rakhi sent successfully!');
        const token = newPostRef.key;
        const link = `${window.location.origin}${window.location.pathname}?token=${token}`;
        shareRakhiLink(link);
    }).catch((error) => {
        console.error('Failed to send Rakhi:', error);
        alert('Failed to send Rakhi.');
    });
}

function shareRakhiLink(link) {
    if (navigator.share) {
        navigator.share({
            title: 'Digital Rakhi',
            text: 'Open this digital rakhi from your sister',
            url: link
        }).then(() => console.log('Link shared successfully'))
          .catch(error => {
              console.error('Error sharing:', error);
              navigator.clipboard.writeText(link).then(() => {
                  alert('Link copied to clipboard');
              }).catch(err => console.error('Copy failed:', err));
          });
    } else {
        navigator.clipboard.writeText(link).then(() => {
            alert('Link copied to clipboard');
        }).catch(error => console.error('Copy failed:', error));
    }
}

async function initCameraKit() {
  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    let mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: window.innerWidth, height: window.innerHeight, facingMode: 'environment' }
    });

    const session = await cameraKit.createSession();
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const videoElement = session.output.live;

    const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']);
    session.applyLens(lenses[0]);

    const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
    await session.setSource(source);
    session.source.setRenderSize(window.innerWidth, window.innerHeight);
    session.play();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function drawFrame() {
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawFrame);
    }

    drawFrame();
    
    const captureButton = document.getElementById('captureButton');
    if (captureButton) {
      captureButton.addEventListener('click', () => {
        captureScreenshot(canvas);
      });
    }

  } catch (error) {
    console.error('Error initializing camera kit:', error);
  }
}

async function captureScreenshot(canvas) {
  canvas.toBlob(async (blob) => {
    if (!blob) return;
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
        downloadImage(blob);
      }
    } else {
      downloadImage(blob);
    }
  }, 'image/png');
}

function downloadImage(blob) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'screenshot.png';
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
}

function showCamera() {
    document.getElementById('receiver-container').style.display = 'none';
    document.getElementById('camera-container').style.display = 'flex';
    initCameraKit();
}
