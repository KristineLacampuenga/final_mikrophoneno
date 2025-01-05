const toggleButton = document.getElementById('toggleButton');
const recordButton = document.getElementById('recordButton');
const recordTimer = document.getElementById('recordTimer');
const playbackButton = document.getElementById('playbackButton');
const volumeControl = document.getElementById('volumeControl');
const volumePercentage = document.getElementById('volumePercentage');
const echoControl = document.getElementById('echoControl');
const echoPercentage = document.getElementById('echoPercentage');
const status = document.getElementById('status');

let audioContext, gainNode, microphone, lowpassFilter, highpassFilter, mediaRecorder, recordedChunks = [];
let isRecording = false;
let audioUrl, audio;
let recordingTimer, secondsElapsed = 0;

const initializeMicrophone = async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();

    // Create filters
    lowpassFilter = audioContext.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.value = 20000; // Adjust frequency as needed

    highpassFilter = audioContext.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = 20; // Adjust frequency as needed

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(gainNode);
        gainNode.connect(lowpassFilter);
        lowpassFilter.connect(highpassFilter);
        highpassFilter.connect(audioContext.destination);

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

        status.innerText = 'Microphone initialized!';
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
    status.innerText = `Echo effect disabled.`;
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
};
