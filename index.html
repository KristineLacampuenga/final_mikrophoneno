<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Microphone Web App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>MikroPHONEno</h1>
        <button id="startButton">Start Microphone</button>
        <button id="stopButton" disabled>Stop Microphone</button>
        <button id="muteButton" disabled>Mute</button>
        <div class="controls">
            <label for="volumeControl">Volume: </label>
            <input type="range" id="volumeControl" min="0" max="100" value="50">
            <span id="volumePercentage">58%</span> <!-- Added percentage display -->
            
            <label for="pitchControl">Pitch: </label>
            <input type="range" id="pitchControl" min="0.5" max="2" step="0.1" value="1">
            <span id="pitchPercentage">73%</span> <!-- Added percentage display -->
        </div>
        <p id="status"></p>
        <canvas id="visualizer"></canvas>
    </div>
    <script src="scripts.js"></script>
    <script>
        // Jungle.js implementation
        class Jungle {
            constructor(context) {
                this.context = context;
                this.input = context.createGain();
                this.output = context.createGain();
                this.modulationNode = context.createGain();
                this.delayNode = context.createDelay();
                
                // Configure initial values
                this.delayNode.delayTime.value = 0.05; // Initial delay time
                
                // Modulation
                this.modulationOscillator = context.createOscillator();
                this.modulationOscillator.type = 'sine';
                this.modulationOscillator.frequency.value = 0.1; // Modulation frequency
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
        }
    </script>
</body>
</html>
