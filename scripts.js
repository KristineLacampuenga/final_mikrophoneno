const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const muteButton = document.getElementById('muteButton');
const echoButton = document.getElementById('echoButton');
const volumeControl = document.getElementById('volumeControl');
const volumePercentage = document.getElementById('volumePercentage');
const status = document.getElementById('status');
const visualizer = document.getElementById('visualizer');
const canvasContext = visualizer.getContext('2d');

let audioContext, analyser, gainNode, microphone, audioOutput;
let dataArray, bufferLength;
let isMuted = false;
let echoEnabled = false;
let echoGainNode, echoDelayNode;

const initializeVisualizer = async () => {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        gainNode = audioContext.createGain();
        echoGainNode = audioContext.createGain();
        echoDelayNode = audioContext.createDelay();

        echoDelayNode.delayTime.value = 0.2;

        audioOutput = audioContext.createMediaStreamDestination();
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(gainNode).connect(analyser).connect(audioOutput);

        if (echoEnabled) {
            enableEcho();
        }

        const audioElement = new Audio();
        audioElement.srcObject = audioOutput.stream;
        audioElement.play();

        await setAudioOutputToBluetooth(audioElement);
        visualize();
    } catch (error) {
        console.error('Error accessing microphone:', error);
        status.innerText = `Error accessing microphone: ${error.message}`;
    }
};

const setAudioOutputToBluetooth = async (audioElement) => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const bluetoothDevice = devices.find(device =>
            device.kind === 'audiooutput' && device.label.toLowerCase().includes('bluetooth')
        );

        if (bluetoothDevice && typeof audioElement.setSinkId === 'function') {
            await audioElement.setSinkId(bluetoothDevice.deviceId);
            console.log('Audio output set to Bluetooth:', bluetoothDevice.label);
        } else {
            console.warn('No compatible Bluetooth device found or setSinkId not supported.');
        }
    } catch (error) {
        console.error('Error setting audio output to Bluetooth:', error);
    }
};

const visualize = () => {
    requestAnimationFrame(visualize);
    analyser.getByteTimeDomainData(dataArray);

    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(0, 0, visualizer.width, visualizer.height);

    canvasContext.lineWidth = 3;
    canvasContext.strokeStyle = 'rgb(255, 0, 255)';
    canvasContext.beginPath();

    const sliceWidth = visualizer.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * visualizer.height / 2;

        if (i === 0) {
            canvasContext.moveTo(x, y);
        } else {
            canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasContext.lineTo(visualizer.width, visualizer.height / 2);
    canvasContext.stroke();
};

const enableEcho = () => {
    echoGainNode.gain.value = 0.5;
    gainNode.connect(echoDelayNode);
    echoDelayNode.connect(echoGainNode);
    echoGainNode.connect(audioContext.destination);
    status.innerText = 'Echo Enabled';
};

const disableEcho = () => {
    gainNode.disconnect(echoDelayNode);
    echoGainNode.disconnect(audioContext.destination);
    status.innerText = 'Echo Disabled';
};

startButton.addEventListener('click', async () => {
    await initializeVisualizer();
    status.innerText = 'Microphone is live...';
    startButton.disabled = true;
    stopButton.disabled = false;
    muteButton.disabled = false;
    echoButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    audioContext.close();
    status.innerText = 'Microphone stopped.';
    startButton.disabled = false;
    stopButton.disabled = true;
    muteButton.disabled = true;
    echoButton.disabled = true;
});

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;

    if (isMuted) {
        gainNode.gain.value = 0;
        muteButton.style.backgroundColor = '#888';
    } else {
        gainNode.gain.value = 1;
        muteButton.style.backgroundColor = '#FF6347';
    }
});

echoButton.addEventListener('click', () => {
    echoEnabled = !echoEnabled;

    if (echoEnabled) {
        enableEcho();
        echoButton.style.backgroundColor = '#32CD32';
    } else {
        disableEcho();
        echoButton.style.backgroundColor = '#FF6347';
    }
});

volumeControl.addEventListener('input', () => {
    const volume = 1 - volumeControl.value / volumeControl.max;
    gainNode.gain.value = volume;
    volumePercentage.innerText = Math.round(volume * 100) + '%';
});
;

pitchControl.addEventListener('input', () => {
    const pitch = 1 - pitchControl.value / pitchControl.max;  // Invert the pitch
    pitchShifter.setPitchOffset(pitch);  // Apply the inverted pitch offset
    pitchPercentage.innerText = Math.round(pitch * 100) + '%';  // Display pitch as a percentage
});

// Equalizer control updates - Amplify the effect by increasing the gain values
bassControl.addEventListener('input', () => {
    const bassValue = 1 - bassControl.value / bassControl.max;  // Invert the bass slider value
    bassFilter.gain.value = bassValue * 2;  // Amplify the bass effect (increase gain)
    bassPercentage.innerText = Math.round(bassValue * 100) + '%';  // Update the display percentage
});

midControl.addEventListener('input', () => {
    const midValue = 1 - midControl.value / midControl.max;  // Invert the mid slider value
    midFilter.gain.value = midValue * 2;  // Amplify the mid effect (increase gain)
    midPercentage.innerText = Math.round(midValue * 100) + '%';  // Update the display percentage
});

trebleControl.addEventListener('input', () => {
    const trebleValue = 1 - trebleControl.value / trebleControl.max;  // Invert the treble slider value
    trebleFilter.gain.value = trebleValue * 2;  // Amplify the treble effect (increase gain)
    treblePercentage.innerText = Math.round(trebleValue * 100) + '%';  // Update the display percentage
});
alert("How to make best, safe and without echo use of this microphone? \n1. Set volume to 50% \n2. Connect your device audio to external speaker. \n3. Tap the mic icon. \n4. Adjust volume levels as per your need.");


