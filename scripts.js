document.addEventListener('deviceready', () => {
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
    const bassControl = document.getElementById('bassControl');
    const midControl = document.getElementById('midControl');
    const trebleControl = document.getElementById('trebleControl');
    const bassPercentage = document.getElementById('bassPercentage');
    const midPercentage = document.getElementById('midPercentage');
    const treblePercentage = document.getElementById('treblePercentage');
    const status = document.getElementById('status');
    const deviceNameElement = document.getElementById('deviceName');
    const visualizer = document.getElementById('visualizer');
    const canvasContext = visualizer.getContext('2d');

    let audioContext, analyser, gainNode, microphone, audioOutput, pitchShifter;
    let dataArray, bufferLength;
    let isMuted = false;
    let echoEnabled = false;
    let bluetoothDevice = null;
    let bluetoothServer = null;
    let bluetoothSpeaker = null;

    // Function to change button color
    const changeButtonColor = (button, color) => {
        button.style.backgroundColor = color;
    };

    // Initialize the visualizer and pitch shifter
    const initializeVisualizer = () => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        pitchShifter = audioContext.createBiquadFilter();
        pitchShifter.type = 'peaking';
        pitchShifter.frequency.value = 1000; // Adjust to shift the pitch higher
        pitchShifter.gain.value = 5; // Adjust to increase the effect

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                microphone = audioContext.createMediaStreamSource(stream);
                gainNode = audioContext.createGain();
                audioOutput = bluetoothSpeaker || audioContext.destination;
                microphone.connect(pitchShifter);
                pitchShifter.connect(analyser);
                analyser.connect(gainNode);
                gainNode.connect(audioOutput);
                visualize();
            })
            .catch(error => {
                console.error("Error accessing microphone:", error);
                status.innerText = `Microphone access error: ${error.message}`;
            });
    };

    // Start the microphone
    startButton.addEventListener('click', () => {
        initializeVisualizer();
        status.innerText = 'Microphone is live...';
        startButton.disabled = true;
        stopButton.disabled = false;
        muteButton.disabled = false;
        echoButton.disabled = false;
        volumeControl.disabled = false;
        pitchControl.disabled = false;
        bassControl.disabled = false;
        midControl.disabled = false;
        trebleControl.disabled = false;
        changeButtonColor(startButton, 'grey');  // Change color when disabled
        changeButtonColor(stopButton, 'green');
    });

    // Stop the microphone
    stopButton.addEventListener('click', () => {
        if (audioContext) {
            audioContext.close();
        }
        status.innerText = 'Microphone stopped.';
        startButton.disabled = false;
        stopButton.disabled = true;
        muteButton.disabled = true;
        echoButton.disabled = true;
        volumeControl.disabled = true;
        pitchControl.disabled = true;
        bassControl.disabled = true;
        midControl.disabled = true;
        trebleControl.disabled = true;
        changeButtonColor(stopButton, 'grey');  // Change color when disabled
        changeButtonColor(startButton, 'green');
    });

    // Mute functionality
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        gainNode.gain.value = isMuted ? 0 : volumeControl.value / 100;
        muteButton.innerText = isMuted ? 'Muted' : 'Mute';
        changeButtonColor(muteButton, isMuted ? 'red' : 'blue');  // Change color based on mute status
    });

    // Echo functionality
    echoButton.addEventListener('click', () => {
        echoEnabled = !echoEnabled;
        if (echoEnabled) {
            enableEcho();
        } else {
            disableEcho();
        }
        changeButtonColor(echoButton, echoEnabled ? 'yellow' : 'blue');  // Change color based on echo status
    });

    // Echo enable/disable functions
    const enableEcho = () => {
        // Logic for enabling echo (e.g., connecting delay node)
    };

    const disableEcho = () => {
        // Logic for disabling echo
    };

    // Bluetooth connect/disconnect
    connectBluetoothButton.addEventListener('click', async () => {
        const options = {
            acceptAllDevices: true
        };
        try {
            bluetoothDevice = await navigator.bluetooth.requestDevice(options);
            console.log(`> Name: ${bluetoothDevice.name}`);
            console.log(`> Id: ${bluetoothDevice.id}`);
            console.log(`> Connected: ${bluetoothDevice.gatt.connected}`);
            bluetoothServer = await bluetoothDevice.gatt.connect();
            const deviceName = bluetoothDevice.name || 'Unnamed Device';
            status.innerText = `Connected to ${deviceName}`;
            deviceNameElement.innerText = `Device Name: ${deviceName}`;
            disconnectBluetoothButton.disabled = false;
            connectBluetoothButton.disabled = true;
            startButton.disabled = false;
            bluetoothSpeaker = bluetoothDevice; // Assigning the Bluetooth device to the output
            changeButtonColor(connectBluetoothButton, 'grey');  // Change color when disabled
            changeButtonColor(disconnectBluetoothButton, 'green');
        } catch (error) {
            if (error.name === 'NotFoundError') {
                status.innerText = 'No device selected. Please try again.';
            } else {
                console.error('Bluetooth connection failed:', error);
                status.innerText = `Error: ${error.message}`;
            }
        }
    });

    disconnectBluetoothButton.addEventListener('click', async () => {
        if (bluetoothDevice && bluetoothDevice.gatt.connected) {
            await bluetoothDevice.gatt.disconnect();
            const deviceName = bluetoothDevice.name || 'Unnamed Device';
            status.innerText = `Disconnected from ${deviceName}`;
            deviceNameElement.innerText = '';
            bluetoothSpeaker = null; // Clearing the Bluetooth speaker
        } else {
            status.innerText = 'No device is connected.';
        }
        disconnectBluetoothButton.disabled = true;
        connectBluetoothButton.disabled = false;
        startButton.disabled = true;
        stopButton.disabled = true;
        muteButton disabled = true;
        echoButton.disabled = true;
        volumeControl.disabled = true;
        pitchControl.disabled = true;
        bassControl disabled = true;
        midControl.disabled = true;
        trebleControl disabled = true;
        changeButtonColor(disconnectBluetoothButton, 'grey');  // Change color when disabled
        changeButtonColor(connectBluetoothButton, 'green');
    });

    // Volume control
    volumeControl.addEventListener('input', (event) => {
        const volume = event.target.value;
        gainNode.gain.value = volume / 100;
        volumePercentage.innerText = `${volume}%`;
    });

    // Pitch control
    pitchControl.addEventListener('input', (event) => {
        const offset = event.target.value;
        pitchShifter.detune value = offset * 100; // Adjust the pitch shift
        pitchPercentage.innerText = `${offset}%`;
    });

    // Bass control
    bassControl.addEventListener('input', (event) => {
        const bass = event.target.value;
        // Logic for bass control adjustment
        bassPercentage.innerText = `${bass}%`;
    });

    // Mid control
    midControl.addEventListener('input', (event) => {
        const mid = event.target.value;
        // Logic for mid control adjustment
        midPercentage.innerText = `${mid}%`;
    });

    // Treble control
    trebleControl.addEventListener('input', (event) => {
        const treble = event.target.value;
        // Logic for treble control adjustment
        treblePercentage.innerText = `${treble}%`;
    });

    // Visualizer function
    const visualize = () => {
        requestAnimationFrame(visualize);
        analyser.getByteTimeDomainData(dataArray);
        canvasContext.clearRect(0, 0, visualizer.width, visualizer.height);

        // Create a gradient
        const gradient = canvasContext.createLinearGradient(0, 0, visualizer.width, visualizer.height);
        gradient.addColorStop(0, 'rgb(255, 0, 0)');
        gradient addColorStop(0.5, 'rgb(0, 255, 0)');
        gradient addColorStop(1, 'rgb(0, 0, 255)');
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

    // Automatically guide user to connect Bluetooth on page load
    window.addEventListener('load', () => {
        status.innerText = 'Please connect your Bluetooth device first.';
        alert('Please click the "Connect Bluetooth" button to proceed.');
    });
});

