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

let audioContext, analyser, gainNode, microphone, audioOutput;
let dataArray, bufferLength;
let isMuted = false;
let pitchShifter;
let echoEnabled = false;
let echoGainNode, echoDelayNode;
let bassFilter, midFilter, trebleFilter;
let bluetoothDevice = null;
let bluetoothServer = null;

// Jungle Class for Pitch Shifting (as provided in the initial code)
class Jungle {
    constructor(context) {
        this.context = context;
        this.input = context.createGain();
        this.output = context.createGain();
        this.modulationNode = context.createGain();
        this.delayNode = context.createDelay();

        this.delayNode.delayTime.value = 0.05;

        this.modulationOscillator = context.createOscillator();
        this.modulationOscillator.type = 'sine';
        this.modulationOscillator.frequency.value = 0.1;
        this.modulationOscillator.connect(this.modulationNode.gain);

        this.input.connect(this.delayNode);
        this.delayNode.connect(this.modulationNode);
        this.modulationNode.connect(this.output);

        this.modulationOscillator.start();
    }

    setPitchOffset(offset) {
        this.modulationNode.gain.value = offset * 2;
    }

    applyAITransformations(inputBuffer) {
        return inputBuffer;
    }
}

// Bluetooth Functions
connectBluetoothButton.addEventListener('click', async () => {
    try {
        // Request device with specific services
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service'] // Add other services if needed
        });

        // Connect to the device
        bluetoothServer = await bluetoothDevice.gatt.connect();
        status.innerText = `Connected to ${bluetoothDevice.name}`;
        disconnectBluetoothButton.disabled = false;
        connectBluetoothButton.disabled = true;

        // Attempt to read the battery level
        const batteryService = await bluetoothServer.getPrimaryService('battery_service');
        const batteryLevelCharacteristic = await batteryService.getCharacteristic('battery_level');
        const batteryLevel = await batteryLevelCharacteristic.readValue();

        // Parse battery level
        const batteryLevelPercentage = batteryLevel.getUint8(0); // Battery level is a single byte
        status.innerText += ` | Battery Level: ${batteryLevelPercentage}%`;
    } catch (error) {
        if (error.name === 'NotFoundError') {
            status.innerText = 'Bluetooth pairing canceled by user.';
        } else {
            status.innerText = `Bluetooth error: ${error.message}`;
        }
        console.error('Bluetooth connection failed:', error);
    }
});

disconnectBluetoothButton.addEventListener('click', async () => {
    try {
        if (bluetoothDevice && bluetoothDevice.gatt.connected) {
            await bluetoothDevice.gatt.disconnect();
            status.innerText = `Disconnected from ${bluetoothDevice.name}`;
        } else {
            status.innerText = 'No device is connected.';
        }

        disconnectBluetoothButton.disabled = true;
        connectBluetoothButton.disabled = false;
    } catch (error) {
        status.innerText = `Error disconnecting: ${error.message}`;
        console.error('Error disconnecting:', error);
    }
});

// Initialize Visualizer and Audio Processing
const initializeVisualizer = async () => {
    // ... [The original visualizer code remains unchanged]
};

// Add listeners for buttons and controls
startButton.addEventListener('click', async () => {
    await initializeVisualizer();
    status.innerText = 'Microphone is live...';
    startButton.disabled = true;
    stopButton.disabled = false;
    muteButton.disabled = false;
    echoButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    if (audioContext) {
        audioContext.close();
    }
    status.innerText = 'Microphone stopped.';
    startButton.disabled = false;
    stopButton.disabled = true;
    muteButton.disabled = true;
    echoButton.disabled = true;
});

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    gainNode.gain.value = isMuted ? 0 : volumeControl.value / 100;
    muteButton.innerText = isMuted ? 'Muted' : 'Mute';
});

echoButton.addEventListener('click', () => {
    echoEnabled = !echoEnabled;
    if (echoEnabled) {
        enableEcho();
    } else {
        disableEcho();
    }
});

// Echo functions (enable/disable)
const enableEcho = () => {
    gainNode.connect(echoDelayNode);
    echoDelayNode.connect(echoGainNode);
    echoGainNode.connect(audioOutput);
};

const disableEcho = () => {
    gainNode.disconnect(echoDelayNode);
    echoDelayNode.disconnect(echoGainNode);
};

// Volume and pitch controls
volumeControl.addEventListener('input', (event) => {
    const volume = event.target.value;
    gainNode.gain.value = volume / 100;
    volumePercentage.innerText = `${volume}%`;
});

pitchControl.addEventListener('input', (event) => {
    const offset = event.target.value;
    pitchShifter.setPitchOffset((offset - 50) / 50);
    pitchPercentage.innerText = `${offset}%`;
});

// Equalizer controls
// (Bass, mid, and treble remain as per your initial setup)
