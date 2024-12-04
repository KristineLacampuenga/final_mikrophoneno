const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const muteButton = document.getElementById('muteButton');
const echoButton = document.getElementById('echoButton');
const bluetoothButton = document.getElementById('bluetoothButton'); // Bluetooth connect button
const volumeControl = document.getElementById('volumeControl');
const pitchControl = document.getElementById('pitchControl');
const volumePercentage = document.getElementById('volumePercentage');
const pitchPercentage = document.getElementById('pitchPercentage');
const status = document.getElementById('status');
const visualizer = document.getElementById('visualizer');
const canvasContext = visualizer.getContext('2d');

let audioContext, analyser, gainNode, microphone, audioOutput;
let dataArray, bufferLength;
let isMuted = false;
let pitchShifter;
let echoEnabled = false;
let echoGainNode, echoDelayNode;
let bassFilter, midFilter, trebleFilter;

const initializeVisualizer = async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    gainNode = audioContext.createGain();
    pitchShifter = new Jungle(audioContext);

    echoGainNode = audioContext.createGain();
    echoDelayNode = audioContext.createDelay();
    echoDelayNode.delayTime.value = 0.2;

    bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 200;

    midFilter = audioContext.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;

    trebleFilter = audioContext.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 3000;

    audioOutput = audioContext.createMediaStreamDestination();

    analyser.fftSize = 2048;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);
        microphone
            .connect(gainNode)
            .connect(pitchShifter.input)
            .connect(pitchShifter.output)
            .connect(bassFilter)
            .connect(midFilter)
            .connect(trebleFilter)
            .connect(analyser)
            .connect(audioOutput);

        const audioElement = new Audio();
        audioElement.srcObject = audioOutput.stream;
        audioElement.play();

        visualize();
    } catch (error) {
        console.error('Error accessing microphone:', error);
        status.innerText = `Error accessing microphone: ${error.message}`;
    }
};

// Function to set audio output to Bluetooth
const setAudioOutputToBluetooth = async (audioElement) => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const bluetoothDevice = devices.find(device => device.kind === 'audiooutput' && device.deviceId.includes('bluetooth'));

        if (bluetoothDevice) {
            await audioElement.setSinkId(bluetoothDevice.deviceId);
            console.log('Audio output set to Bluetooth:', bluetoothDevice);
            status.innerText = 'Audio output set to Bluetooth.';
        } else {
            console.log('No Bluetooth audio output found.');
            status.innerText = 'No Bluetooth audio output found.';
        }
    } catch (error) {
        console.error('Error setting audio output to Bluetooth:', error);
        status.innerText = `Error setting audio output: ${error.message}`;
    }
};

// Bluetooth connection button functionality
bluetoothButton.addEventListener('click', async () => {
    const audioElement = new Audio();
    audioElement.srcObject = audioOutput.stream;
    audioElement.play();

    await setAudioOutputToBluetooth(audioElement); // Set Bluetooth output
});

// Visualizer function (remains the same)
const visualize = () => {
    requestAnimationFrame(visualize);
    analyser.getByteTimeDomainData(dataArray);

    // Clear canvas with gradient background
    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(0, 0, visualizer.width, visualizer.height);

    // Gradient for waveform
    const gradient = canvasContext.createLinearGradient(0, 0, visualizer.width, 0);
    gradient.addColorStop(0, 'rgb(255, 0, 255)'); // Purple
    gradient.addColorStop(0.5, 'rgb(0, 255, 255)'); // Cyan
    gradient.addColorStop(1, 'rgb(255, 0, 255)'); // Purple

    canvasContext.lineWidth = 3;
    canvasContext.strokeStyle = gradient;
    canvasContext.beginPath();

    const sliceWidth = visualizer.width * 1.0 / bufferLength;
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

    // Glow effect around the waveform
    canvasContext.lineWidth = 6;
    canvasContext.strokeStyle = 'rgba(255, 0, 255, 0.3)';
    canvasContext.shadowColor = 'rgba(255, 0, 255, 0.7)';
    canvasContext.shadowBlur = 10;
    canvasContext.stroke();

    // Main waveform stroke
    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = gradient;
    canvasContext.stroke();
};

// Start, stop, mute, echo, and volume functionality remain the same as before...
