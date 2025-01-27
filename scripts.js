const toggleButton = document.getElementById('toggleButton');
const recordButton = document.getElementById('recordButton');
const recordTimer = document.getElementById('recordTimer');
const playbackButton = document.getElementById('playbackButton');
const volumeControl = document.getElementById('volumeControl');
const volumePercentage = document.getElementById('volumePercentage');
const echoControl = document.getElementById('echoControl');
const echoPercentage = document.getElementById('echoPercentage');
const status = document.getElementById('status');

let audioContext, gainNode, microphone, delayNode, mediaRecorder, recordedChunks = [];
let isRecording = false;
let audioUrl, audio;
let recordingTimer, secondsElapsed = 0;

const initializeMicrophone = async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
    });
    gainNode = audioContext.createGain();

    const highPassFilter = audioContext.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 300;

    const lowPassFilter = audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 3000;

    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);

        microphone
            .connect(highPassFilter)
            .connect(lowPassFilter)
            .connect(gainNode)
            .connect(compressor)
            .connect(audioContext.destination);

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => recordedChunks.push(event.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
            audioUrl = URL.createObjectURL(audioBlob);
            audio = new Audio(audioUrl);
            playbackButton.disabled = false;
            status.innerText = 'Recording stopped. Playback is available.';

            const downloadLink = document.createElement('a');
            downloadLink.href = audioUrl;
            downloadLink.download = 'recording.wav';
            downloadLink.click();
        };

        status.innerText = 'Microphone initialized with noise reduction and low latency!';
    } catch (error) {
        console.error('Error accessing microphone:', error);
        status.innerText = `Error accessing microphone: ${error.message}`;
    }
};

toggleButton.addEventListener('click', async () => {
    if (!audioContext) {
        await initializeMicrophone();
        status.innerText = 'Microphone is live...';
        toggleButton.innerHTML = '<img src="assets/realmic3.png" alt="Microphone" class="microphone-btn">';
    } else {
        audioContext.close();
        audioContext = null;
        mediaRecorder = null;
        recordedChunks = [];
        status.innerText = 'Microphone stopped.';
        toggleButton.innerHTML = '<img src="assets/realmic4.png" alt="Muted Microphone" class="microphone-btn">';
    }
    recordButton.disabled = !audioContext;
});

volumeControl.addEventListener('input', () => {
    const volume = volumeControl.value / 100;
    gainNode.gain.value = volume;
    volumePercentage.innerText = `${volumeControl.value}%`;
});

echoControl.addEventListener('input', () => {
    const echo = echoControl.value / 100;
    if (delayNode) {
        delayNode.delayTime.value = echo;
    } else {
        delayNode = audioContext.createDelay();
        delayNode.delayTime.value = echo;
        gainNode.connect(delayNode).connect(audioContext.destination);
    }
    echoPercentage.innerText = `${echoControl.value}%`;
});

recordButton.addEventListener('click', () => {
    if (isRecording) {
        mediaRecorder.stop();
        clearInterval(recordingTimer);
        status.innerText = `Recording stopped at ${formatTime(secondsElapsed)}.`;
        secondsElapsed = 0;
        recordButton.innerHTML = '<i class="fa fa-stop-circle" style="color:red"></i> <span id="recordTimer">Start Recording</span>';
        recordButton.style.backgroundColor = '';
    } else {
        recordedChunks = [];
        mediaRecorder.start();
        status.innerText = 'Recording started...';
        recordButton.innerHTML = '<i class="fas fa-record-vinyl"></i> <span id="recordTimer">00:00:00</span>';
        recordButton.style.backgroundColor = 'red';

        recordingTimer = setInterval(() => {
            secondsElapsed++;
            recordButton.innerHTML = `<i class="fas fa-record-vinyl"></i> <span id="recordTimer">${formatTime(secondsElapsed)}</span>`;
        }, 1000);
    }
    isRecording = !isRecording;
});

playbackButton.addEventListener('click', () => {
    if (audio) {
        audio.play();
        setAudioOutputToBluetooth(audio); 
        status.innerText = 'Playing back the recording...';
        playbackButton.style.backgroundColor = 'red';
        audio.onended = () => {
            playbackButton.style.backgroundColor = '';
            status.innerText = 'Playback finished.';
        };
    } else {
        status.innerText = 'No recording available.';
    }
});

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const setAudioOutputToBluetooth = async (audioElement) => {
    if (typeof audioElement.setSinkId !== 'undefined') {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const bluetoothDevice = devices.find(device => device.kind === 'audiooutput' && device.label.includes('Bluetooth'));

            if (bluetoothDevice) {
                await audioElement.setSinkId(bluetoothDevice.deviceId);
                console.log('Audio output set to Bluetooth:', bluetoothDevice);
            } else {
                console.log('No Bluetooth audio output found.');
            }
        } catch (error) {
            console.error('Error setting audio output to Bluetooth:', error);
        }
    } else {
        console.log('setSinkId is not supported in this browser.');
    }
};
