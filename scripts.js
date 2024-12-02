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

            this.delayNode.delayTime.value = 0.01;

            this.modulationOscillator = context.createOscillator();
            this.modulationOscillator.type = 'sine';
            this.modulationOscillator.frequency.value = 30; // Higher frequency for chipmunk effect
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

            if (echoEnabled) {
                enableEcho();  // Ensure echo is enabled if it's already active
            }

            const audioElement = new Audio();
            audioElement.srcObject = audioOutput.stream;
            audioElement.play();

            // Attempt to route audio to Bluetooth if available
            await setAudioOutputToBluetooth(audioElement);

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
                // Set the output device to Bluetooth
                await audioElement.setSinkId(bluetoothDevice.deviceId);
                console.log('Audio output set to Bluetooth:', bluetoothDevice);
            } else {
                console.log('No Bluetooth audio output found.');
            }
        } catch (error) {
            console.error('Error setting audio output to Bluetooth:', error);
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

    // Mute/Unmute functionality (with color change only)
muteButton.addEventListener('click', () => {
    isMuted = !isMuted;  // Toggle mute state

    if (isMuted) {
        gainNode.gain.value = 0;  // Mute the audio
        muteButton.style.backgroundColor = '#888';  // Change button color to indicate muted state
    } else {
        gainNode.gain.value = 1;  // Unmute the audio
        muteButton.style.backgroundColor = '#FF6347';  // Restore original color (or a different color)
    }
});

// Echo functionality (with color change only)
echoButton.addEventListener('click', () => {
    echoEnabled = !echoEnabled;  // Toggle echo state

    if (echoEnabled) {
        enableEcho();  // Enable echo effect
        echoButton.style.backgroundColor = '#32CD32';  // Change button color to indicate echo is enabled
    } else {
        disableEcho();  // Disable echo effect
        echoButton.style.backgroundColor = '#FF6347';  // Restore button color to indicate echo is disabled
    }
});

// Function to enable echo effect
const enableEcho = () => {
    echoGainNode.gain.value = 0.5;  // Set echo gain level (adjust as needed)
    gainNode.connect(echoDelayNode);
    echoDelayNode.connect(echoGainNode);
    echoGainNode.connect(audioContext.destination);
    status.innerText = 'ECHO';
};

// Function to disable echo effect
const disableEcho = () => {
    gainNode.disconnect(echoDelayNode);  // Disconnect echo effect from the signal path
    echoGainNode.disconnect(audioContext.destination);
    status.innerText = 'ECHO STOPPED';
};
// Update the volume and pitch based on the reversed slider movement
volumeControl.addEventListener('input', () => {
    const volume = 1 - volumeControl.value / volumeControl.max;  // Invert the volume
    gainNode.gain.value = volume;  // Set volume to the inverted value
    volumePercentage.innerText = Math.round(volume * 100) + '%';  // Display volume as a percentage
});

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


