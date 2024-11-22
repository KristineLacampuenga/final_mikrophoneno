const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const muteButton = document.getElementById('muteButton');
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

class Jungle {
    constructor(context) {
        this.context = context;
        this.input = context.createGain();
        this.output = context.createGain();
        this.modulationNode = context.createGain();
        this.delayNode = context.createDelay();
        
        // Configure initial values
        this.delayNode.delayTime.value = 0.05; // Initial delay time
        
        // Modulation for voice-changing effect (like robotic or AI-style)
        this.modulationOscillator = context.createOscillator();
        this.modulationOscillator.type = 'sine';
        this.modulationOscillator.frequency.value = 0.1; // Modulation frequency for effect
        this.modulationOscillator.connect(this.modulationNode.gain);

        // Connect nodes
        this.input.connect(this.delayNode);
        this.delayNode.connect(this.modulationNode);
        this.modulationNode.connect(this.output);
        
        // Start the oscillator
        this.modulationOscillator.start();
    }

    setPitchOffset(offset) {
        // Offset can be positive or negative to shift pitch up or down
        this.modulationNode.gain.value = offset;
    }
    
    // Example of adding more AI-like transformations (like formant shifting)
    applyAITransformations(inputBuffer) {
        // For now, a simple example might involve pitch shift
        // AI algorithms would be more complex here, and could use pretrained models
        // For instance, you could send this buffer to an AI service for processing
        return inputBuffer;
    }
}

const initializeVisualizer = async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    gainNode = audioContext.createGain();
    pitchShifter = new Jungle(audioContext);

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
            .connect(analyser)
            .connect(audioOutput);

        const audioElement = new Audio();
        audioElement.srcObject = audioOutput.stream;
        audioElement.play();

        visualize();
    } catch (error) {
        status.innerText = `Error accessing microphone: ${error.message}`;
    }
};

const visualize = () => {
    requestAnimationFrame(visualize);
    analyser.getByteTimeDomainData(dataArray);

    canvasContext.fillStyle = 'white';
    canvasContext.fillRect(0, 0, visualizer.width, visualizer.height);

    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = 'purple';
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

// Volume control
volumeControl.addEventListener('input', (event) => {
    const volume = event.target.value;
    gainNode.gain.value = volume / 100;
    volumePercentage.innerText = `${volume}%`;
});

// Pitch control
pitchControl.addEventListener('input', (event) => {
    const offset = event.target.value - 1; // Adjust based on slider range
    pitchShifter.setPitchOffset(offset);

    const pitchPercentageValue = Math.round(((event.target.value - 0.5) / 1.5) * 100);
    pitchPercentage.innerText = `${pitchPercentageValue}%`;
});

// Start microphone
startButton.addEventListener('click', async () => {
    await initializeVisualizer();
    status.innerText = 'Microphone is live...';
    startButton.disabled = true;
    stopButton.disabled = false;
    muteButton.disabled = false;
});

// Stop microphone
stopButton.addEventListener('click', () => {
    if (audioContext) {
        audioContext.close();
        status.innerText = 'Microphone stopped.';
        startButton.disabled = false;
        stopButton.disabled = true;
        muteButton.disabled = true;
    }
});

// Mute/unmute microphone
muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    gainNode.gain.value = isMuted ? 0 : volumeControl.value / 100;
    muteButton.innerText = isMuted ? 'Unmute' : 'Mute';
});

// Load saved settings
const loadSettings = () => {
    const savedVolume = localStorage.getItem('volume');
    const savedPitch = localStorage.getItem('pitch');

    if (savedVolume) volumeControl.value = savedVolume;
    if (savedPitch) pitchControl.value = savedPitch;

    gainNode.gain.value = volumeControl.value / 100;
    pitchShifter.setPitchOffset(pitchControl.value - 1);
};

window.addEventListener('load', () => {
    loadSettings();
    startButton.disabled = false;
    stopButton.disabled = true;
    muteButton.disabled = true;
});
