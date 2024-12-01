const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const muteButton = document.getElementById('muteButton');
const echoButton = document.getElementById('echoButton');
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
        this.modulationOscillator.frequency.value = 10; // Higher frequency for chipmunk effect
        this.modulationOscillator.connect(this.modulationNode.gain);

        this.input.connect(this.delayNode);
        this.delayNode.connect(this.modulationNode);
        this.modulationNode.connect(this.output);

        this.modulationOscillator.start();
    }

    setPitchOffset(offset) {
        this.modulationNode.gain.value = offset * 4; // Increase offset for higher pitch
    }

    applyAITransformations(inputBuffer) {
        return inputBuffer;
    }
}

const initializeVisualizer = async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    gainNode = audioContext.createGain();
    pitchShifter = new Jungle(audioContext);

    echoGainNode = audioContext.createGain();
    echoDelayNode = audioContext.createDelay();
    echoDelayNode.delayTime.value = 0.5;

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

        if (echoEnabled) {
            enableEcho();  // Ensure echo is enabled if it's already active
        }

        const audioElement = new Audio();
        audioElement.srcObject = audioOutput.stream;
        audioElement.play();

        visualize();
    } catch (error) {
        console.error('Error accessing microphone:', error);
        status.innerText = `Error accessing microphone: ${error.message}`;
    }
};

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

// Volume control
volumeControl.addEventListener('input', (event) => {
    const volume = event.target.value;
    gainNode.gain.value = volume / 100;
    volumePercentage.innerText = `${volume}%`;
});

// Pitch control
pitchControl.addEventListener('input', (event) => {
    const offset = event.target.value;
    pitchShifter.setPitchOffset((offset - 50) / 10); // Adjust to range -5 to 5 for higher pitch
    pitchPercentage.innerText = `${offset}%`;
});

// Equalizer Controls
const equalizerControls = {
    bassControl: document.getElementById('bassControl'),
    midControl: document.getElementById('midControl'),
    trebleControl: document.getElementById('trebleControl'),
    bassPercentage: document.getElementById('bassPercentage'),
    midPercentage: document.getElementById('midPercentage'),
    treblePercentage: document.getElementById('treblePercentage'),
};

equalizerControls.bassControl.addEventListener('input', (event) => {
    const value = event.target.value;
    bassFilter.gain.value = (value - 50) / 5; // Adjust to range -10 to 10
    equalizerControls.bassPercentage.innerText = `${value}%`;
});

equalizerControls.midControl.addEventListener('input', (event) => {
    const value = event.target.value;
    midFilter.gain.value = (value - 50) / 5; // Adjust to range -10 to 10
    equalizerControls.midPercentage.innerText = `${value}%`;
});

equalizerControls.trebleControl.addEventListener('input', (event) => {
    const value = event.target.value;
    trebleFilter.gain.value = (value - 50) / 5; // Adjust to range -10 to 10
    equalizerControls.treblePercentage.innerText = `${value}%`;
});

// Start microphone
startButton.addEventListener('click', async () => {
    await initializeVisualizer();
    status.innerText = 'Microphone is live...';
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

// Mute functionality
muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    gainNode.gain.value = isMuted ? 0 : volumeControl.value / 100;
    changeButtonColor(muteButton, isMuted ? 'red' : 'blue');  // Change color based on mute status
});

// Echo button
echoButton.addEventListener('click', () => {
    echoEnabled = !echoEnabled;

    if (echoEnabled) {
        enableEcho();
        echoButton.style.backgroundColor = 'yellow';  // Change color when echo is enabled
    } else {
        disableEcho();
        echoButton.style.backgroundColor = 'blue';  // Change color when echo is disabled
    }
});

// Enable echo
const enableEcho = () => {
    gainNode.connect(echoDelayNode);
    echoDelayNode.connect(echoGainNode);
    echoGainNode.connect(audioOutput);
};

// Disable echo
const disableEcho = () => {
    gainNode.disconnect(echoDelayNode);
    echoDelayNode.disconnect(echoGainNode);
    echoGainNode.disconnect(audioOutput);
};

// Function to change button color
const changeButtonColor = (button, color) => {
    button.style.backgroundColor = color;
};

// Visualizer function
const vizualize = () => {
    requestAnimationFrame(visualize);
    analyser.getByteTimeDomainData(dataArray);
    canvasContext.clearRect(0, 0, visualizer.width, visualizer.height);

    // Create a gradient
    const gradient = canvasContext.createLinearGradient(0, 0, visualizer.width, visualizer.height);
    gradient.addColorStop(0, 'rgb(255, 0, 0)');
    gradient.addColorStop(0.5, 'rgb(0, 255, 0)');
    gradient.addColorStop(1, 'rgb(0, 0, 255)');
    canvasContext.strokeStyle = gradient;

    canvasContext.lineWidth = 2;
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
    canvasContext.lineTo(visualizer.width, visualizer.height / 2);
    canvasContext.stroke();
};

// Automatically guide user on page load
window.addEventListener('load', () => {
    status.innerText = 'Ready to start your audio experience.';
});

