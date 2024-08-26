"use strict";

var canvas;
var gl;
var positions = [];
var timeLocation;
var startTime;
var timeSpeed = 1.0;
var xFrequency = 0.01;
var yFrequency = 0.01;
var color1 = [1.0, 0.843, 0.0];  // Default to gold
var color2 = [0.0, 0.153, 0.298];  // Default to blue
var program;
var fractalDepth = 3; //default fractal depth value
var bufferId;




window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    document.getElementById("timeSpeed").addEventListener("input", function(e) {
        timeSpeed = parseFloat(e.target.value);
        document.getElementById("timeSpeedValue").textContent = timeSpeed.toFixed(1);
    });

    document.getElementById("xFrequency").addEventListener("input", function(e) {
        xFrequency = parseFloat(e.target.value);
        document.getElementById("xFrequencyValue").textContent = xFrequency.toFixed(3);
    });

    document.getElementById("yFrequency").addEventListener("input", function(e) {
        yFrequency = parseFloat(e.target.value);
        document.getElementById("yFrequencyValue").textContent = yFrequency.toFixed(3);
    });

    document.getElementById("color1").addEventListener("input", function(e) {
        color1 = hexToRgb(e.target.value);
    });

    document.getElementById("color2").addEventListener("input", function(e) {
        color2 = hexToRgb(e.target.value);
    });
    
    document.getElementById("fractalDepth").addEventListener("input", function(e) {
        fractalDepth = parseInt(e.target.value);
        document.getElementById("fractalDepthValue").textContent = fractalDepth;
        regenerateFractal();
    });

    document.getElementById("color1").addEventListener("input", function(e) {
        color1 = hexToRgb(e.target.value);
    });
    
    document.getElementById("color2").addEventListener("input", function(e) {
        color2 = hexToRgb(e.target.value);
    });

    document.getElementById("resetButton").addEventListener("click", function() {
        timeSpeed = 1.0;
        xFrequency = 0.01;
        yFrequency = 0.01;
        fractalDepth = 3;
        color1 = [1.0, 0.843, 0.0];
        color2 = [0.0, 0.153, 0.298];
        
        document.getElementById("timeSpeed").value = "1.0";
        document.getElementById("timeSpeedValue").textContent = "1.0";
        document.getElementById("xFrequency").value = "0.01";
        document.getElementById("xFrequencyValue").textContent = "0.01";
        document.getElementById("yFrequency").value = "0.01";
        document.getElementById("yFrequencyValue").textContent = "0.01";
        document.getElementById("fractalDepth").value = "3";
        document.getElementById("fractalDepthValue").textContent = "3";
        document.getElementById("color1").value = "#FFD700";
        document.getElementById("color2").value = "#00274C";
        
        regenerateFractal();
    });

    document.getElementById('theme-toggle').addEventListener('click', function() {
        document.body.classList.toggle('dark');
        this.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙'; // Change icon based on mode
    });
    
    // Helper functions

    //clear existing fractal and generate new one with updated fractal depth
    function regenerateFractal() {
        positions = [];
        var vertices = [
            vec2(-1.0, 0.0), // Starting point
            vec2(1.0, 0.0)   // Ending point
        ];
        positions.push(vertices[0]);
        generateFractal(vertices[0], vertices[1], fractalDepth);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    }


    function vec2(x, y) {
        return [x, y];
    }

    function subtract(vecA, vecB) {
        return [vecA[0] - vecB[0], vecA[1] - vecB[1]];
    }

    function add(vecA, vecB) {
        return [vecA[0] + vecB[0], vecA[1] + vecB[1]];
    }

    function scale(scalar, vec) {
        return [scalar * vec[0], scalar * vec[1]];
    }

    // Recursive function to generate the fractal mountain
    function generateFractal(start, end, depth) {
        if (depth === 0) {
            positions.push(end);
        } else {
            var third = subtract(end, start);
            third = scale(1/3, third);
            
            var v1 = add(start, third);
            var v2 = add(v1, third);
            
            var peak = add(v1, vec2(-third[1], third[0])); // Rotate the vector 90 degrees
            
            generateFractal(start, v1, depth - 1);
            generateFractal(v1, peak, depth - 1);
            generateFractal(peak, v2, depth - 1);
            generateFractal(v2, end, depth - 1);
        }
    }

    // Initial setup
    var vertices = [
        vec2(-1.0, 0.0), // Starting point
        vec2(1.0, 0.0)   // Ending point
    ];

    positions.push(vertices[0]);
    // Generate the fractal mountain
    generateFractal(vertices[0], vertices[1], fractalDepth);

    // Log all positions (this is for debugging purposes)
    positions.forEach((pos, index) => {
        // console.log(`Position ${index}: ${pos}`);
    });

    // Now draw everything using WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    timeLocation = gl.getUniformLocation(program, "uTime");
    startTime = Date.now();

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);




    updateUniforms(gl, program);
    render();
};


function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : null;
}

function updateUniforms(gl, program) {
    gl.uniform1f(gl.getUniformLocation(program, "uTimeSpeed"), timeSpeed);
    gl.uniform1f(gl.getUniformLocation(program, "uXFrequency"), xFrequency);
    gl.uniform1f(gl.getUniformLocation(program, "uYFrequency"), yFrequency);
    gl.uniform3fv(gl.getUniformLocation(program, "uColor1"), color1);
    gl.uniform3fv(gl.getUniformLocation(program, "uColor2"), color2);
}

function render() {
    var currentTime = (Date.now() - startTime) / 1000.0; // Convert to seconds
    gl.uniform1f(timeLocation, currentTime);

    updateUniforms(gl, program);


    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINE_STRIP, 0, positions.length);

    requestAnimationFrame(render);
}