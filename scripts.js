// scripts.js

// DOM Elements
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const muteButton = document.getElementById('muteButton');
const echoButton = document.getElementById('echoButton');
const connectBluetoothButton = document.getElementById('connectBluetoothButton');
const disconnectBluetoothButton = document.getElementById('disconnectBluetoothButton');
const volumeControl = document.getElementById('volumeControl');
const pitchControl = document.getElementById('pitchControl');
const volumePercentage = document.getElementById('volumePercentage');
const pitchPercentage = document.getElementById('pitchPercentage');
const status = document.getElementById('status');
const visualizer = document.getElementById('visualizer');
const canvasContext = visualizer.getContext('2d');

// Equalizer Controls
const bassControl = document.getElementById('bassControl');
const midControl = document.getElementById('midControl');
const trebleControl = document.getElementById('trebleControl');
const bassPercentage = document.getElementById('bassPercentage');
const midPercentage = document.getElementById('midPercentage');
const treblePercentage = document.getElementById('treblePercentage');

let audioContext, analyser, gainNode, microphone, audioOutput;
let bufferLength, dataArray;
let isMuted = false;
let echoEnabled = false;

// Audio filters and effects
let pitchShifter, echoGainNode, echoDelayNode;
let bassFilter, midFilter, trebleFilter;

// Bluetooth Variables
let bluetoothDevice = null;
let bluetoothServer = null;
let bluetoothCharacteristic = null;

// Visualizer Setup
const initializeVisualizer = async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    gainNode = audioContext.createGain();

    // Initialize pitch shifter
    pitchShifter = new Jungle(audioContext);

    // Echo Nodes
    echoGainNode = audioContext.createGain();
    echoDelayNode = audioContext.createDelay();
    echoDelayNode.delayTime.value = 0.5;

    // Equalizer Filters
    bassFilter = createFilter('lowshelf', 200);
    midFilter = createFilter('peaking', 1000, 1);
    trebleFilter = createFilter('highshelf', 3000);

    audioOutput = audioContext.createMediaStreamDestination();

    analyser.fftSize = 2048;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);

        // Connect audio nodes
        microphone
            .connect(gainNode)
            .connect(pitchShifter.input)
            .connect(pitchShifter.output)
            .connect(bassFilter)
            .connect(midFilter)
            .connect(trebleFilter)
            .connect(analyser)
            .connect(audioOutput);

        if (echoEnabled) enableEcho();

        const audioElement = new Audio();
        audioElement.srcObject = audioOutput.stream;
        audioElement.play();

        visualize();
        status.innerText = 'Visualizer initialized and microphone is live.';
    } catch (error) {
        console.error('Error accessing microphone:', error);
        status.innerText = `Error: ${error.message}`;
    }
};

connectBluetoothButton.addEventListener('click', async () => {
    try {
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service'], // Replace with relevant services
        });

        bluetoothServer = await bluetoothDevice.gatt.connect();
        status.innerText = `Connected to ${bluetoothDevice.name}`;
        disconnectBluetoothButton.disabled = false;
        connectBluetoothButton.disabled = true;
    } catch (error) {
        if (error.name === 'NotFoundError') {
            status.innerText = 'Bluetooth pairing canceled by user.';
        } else {
            status.innerText = `Bluetooth error: ${error.message}`;
        }
        console.error('Bluetooth connection failed:', error);
    }
});


// Start microphone
startButton.addEventListener('click', async () => {
    await initializeVisualizer();
    startButton.disabled = true;
    stopButton.disabled = false;
    muteButton.disabled = false;
    echoButton.disabled = false;
});

// Stop microphone
stopButton.addEventListener('click', () => {
    audioContext.close();
    status.innerText = 'Microphone stopped.';
    startButton.disabled = false;
    stopButton.disabled = true;
    muteButton.disabled = true;
    echoButton.disabled = true;
});

// Echo button
echoButton.addEventListener('click', () => {
    echoEnabled = !echoEnabled;
    if (echoEnabled) enableEcho();
    else disableEcho();
});

// Enable Echo
const enableEcho = () => {
    gainNode.connect(echoDelayNode);
    echoDelayNode.connect(echoGainNode);
    echoGainNode.connect(audioOutput);
};

// Disable Echo
const disableEcho = () => {
    gainNode.disconnect(echoDelayNode);
    echoDelayNode.disconnect(echoGainNode);
};

// Visualizer
const visualize = () => {
    requestAnimationFrame(visualize);
    analyser.getByteTimeDomainData(dataArray);

    canvasContext.clearRect(0, 0, visualizer.width, visualizer.height);
    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = 'rgb(0, 255, 0)';
    canvasContext.beginPath();

    const sliceWidth = visualizer.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * visualizer.height) / 2;

        if (i === 0) canvasContext.moveTo(x, y);
        else canvasContext.lineTo(x, y);

        x += sliceWidth;
    }
    canvasContext.lineTo(visualizer.width, visualizer.height / 2);
    canvasContext.stroke();
};

// Create Audio Filter
const createFilter = (type, frequency, q = 0) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    return filter;
};
