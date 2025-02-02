// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' + // Set the vertex coordinates of the point
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_Segments;
let u_ModelMatrix;
let u_GlobalRotateMatrix;


function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
  
    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
  
    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
      console.log('Failed to get the storage location of u_FragColor');
      return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_ModelMatrix');
      return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
      console.log('Failed to get the storage location of u_GlobalRotateMatrix');
      return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedSegments = 10;
let g_selectedType = POINT;
let g_globalAngle = 2.9;
let g_yellowAngle = 0;
let g_headAngle = 0;
let g_bowAngle = 0;
let g_bowAnimation = false;
let g_headAnimation = false;
let g_yellowAnimation = false;
var g_pokeAnimation = false;
var g_pokeStartTime = 0;

function addActionsForHtmlUI() {
/*   document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, g_selectedColor[3]]; };
  document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, g_selectedColor[3]]; };
  document.getElementById('clearButton').onclick = function() { g_shapeList = []; renderAllShapes(); };

  document.getElementById('pointButton').onclick = function() { g_selectedType = POINT; };
  document.getElementById('triButton').onclick = function() { g_selectedType = TRIANGLE; };
  document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE; };

  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value / 100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value / 100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value / 100; });

  document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });
  document.getElementById('segmentSlide').addEventListener('mouseup', function() { g_selectedSegments = this.value; });
  document.getElementById('opacitySlide').addEventListener('mouseup', function() { g_selectedColor[3] = this.value / 100; }); */

  
  document.getElementById('yellowSlide').addEventListener('mousemove', function() { g_yellowAngle = this.value / 100; renderAllShapes(); });
  document.getElementById('headSlide').addEventListener('mousemove', function() { g_headAngle = this.value / 100; renderAllShapes(); });
  document.getElementById('bowSlide').addEventListener('mousemove', function() { g_bowAngle = this.value / 100; renderAllShapes(); });
  document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); }); 

  document.getElementById('animationYellowOffButton').onclick = function() { g_yellowAnimation = false;};
  document.getElementById('animationYellowOnButton').onclick = function() { g_yellowAnimation = true; };

  document.getElementById('animationHeadOffButton').onclick = function() { g_headAnimation = false;};
  document.getElementById('animationHeadOnButton').onclick = function() { g_headAnimation = true; };

  document.getElementById('animationBowOffButton').onclick = function() { g_bowAnimation = false;};
  document.getElementById('animationBowOnButton').onclick = function() { g_bowAnimation = true; };
}


function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  // Retrieve the canvas element
  var canvas = document.getElementById('webgl');

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev); } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick(){
  g_seconds = performance.now()/1000.0 - g_startTime;
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateAnimationAngles(){
  if(g_yellowAnimation){
    g_yellowAngle = 1*Math.sin(g_seconds); 
  }
  if(g_headAnimation){
    g_headAngle = 0.2*Math.sin(g_seconds);
  if(g_bowAnimation){
    g_bowAngle = 180 * Math.sin(g_seconds);
  }
  }

  if (g_pokeAnimation) {
    var pokeDuration = 2; // 2 seconds for the poke animation
    var currentTime = performance.now() / 1000.0;
    if (currentTime - g_pokeStartTime > pokeDuration) {
      g_pokeAnimation = false;
    } else {
      // Update angles or positions for the poke animation
      g_yellowAngle += 5; // Example: faster rotation during poke
    }
  }
}
var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_sizes = [];
var g_shapeList = [];

var g_mouseX = 0;
var g_mouseY = 0;
var g_mouseDown = false;

canvas.onmousedown = function(ev) {
  g_mouseDown = true;
  g_mouseX = ev.clientX;
  g_mouseY = ev.clientY;
};

canvas.onmouseup = function() {
  g_mouseDown = false;
};

canvas.onmousemove = function(ev) {
  if (g_mouseDown) {
    var deltaX = ev.clientX - g_mouseX;
    var deltaY = ev.clientY - g_mouseY;
    g_globalAngle += deltaX * 0.5; // Adjust the sensitivity as needed
    g_headAngle += deltaY * 0.5; // Adjust the sensitivity as needed
    g_mouseX = ev.clientX;
    g_mouseY = ev.clientY;
    renderAllShapes();
  }
};

function click(ev) {
  if (ev.shiftKey) {
    g_pokeAnimation = true;
    g_pokeStartTime = performance.now() / 1000.0;
  } else {
    let [x, y] = convertCoordinatesEventToGL(ev);
    let point;
    if (g_selectedType == POINT) {
      point = new Point();
    } else if (g_selectedType == TRIANGLE) {
      point = new Triangle();
    } else {
      point = new Circle();
      point.segments = g_selectedSegments; // Set the number of segments
    }
    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_shapeList.push(point);
    renderAllShapes();
  }
}

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return([x,y]);
}

function renderAllShapes() {
  var startTime = performance.now();

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Render cat body
  var body = new Cube();
  body.color = [0.8, 0.5, 0.3, 1.0]; // Brown color
  body.matrix.translate(-0.25, -0.5, 0);
  body.matrix.scale(0.5, 0.3, 0.2);
  body.render();

  // Render cat head
  var head = new Cube();
  head.color = [0.9, 0.6, 0.4, 1.0]; // Lighter brown color
  head.matrix.translate(-0.15, -0.2, 0);
  head.matrix.scale(0.3, 0.3, 0.2);
  head.matrix.rotate(g_headAngle, 0, 1, 0); // Rotate head
  head.render();

  // Render cat left ear
  var leftEar = new Cube();
  leftEar.color = [0.7, 0.4, 0.2, 1.0]; // Darker brown color
  leftEar.matrix.translate(-0.2, 0.1, 0);
  leftEar.matrix.scale(0.1, 0.1, 0.1);
  leftEar.matrix.rotate(g_headAngle, 0, 1, 0); // Rotate head
  leftEar.render();

  // Render cat right ear
  var rightEar = new Cube();
  rightEar.color = [0.7, 0.4, 0.2, 1.0]; // Darker brown color
  rightEar.matrix.translate(0.0, 0.1, 0);
  rightEar.matrix.scale(0.1, 0.1, 0.1);
  rightEar.matrix.rotate(g_headAngle, 0, 1, 0); // Rotate head
  rightEar.render();

  // Render cat left eye
  var leftEye = new Cube();
  leftEye.color = [0.0, 0.0, 0.0, 1.0]; // Black color
  leftEye.matrix.translate(-0.1, -0.1, 0.15);
  leftEye.matrix.scale(0.05, 0.05, 0.05);
  leftEye.matrix.rotate(g_headAngle, 0, 1, 0); // Rotate head
  leftEye.render();

  // Render cat right eye
  var rightEye = new Cube();
  rightEye.color = [0.0, 0.0, 0.0, 1.0]; // Black color
  rightEye.matrix.translate(0.05, -0.1, 0.15);
  rightEye.matrix.scale(0.05, 0.05, 0.05);
  rightEye.matrix.rotate(g_headAngle, 0, 1, 0); // Rotate head
  rightEye.render();

  // Render cat nose
  var nose = new Cube();
  nose.color = [0.9, 0.4, 0.4, 1.0]; // Pink color
  nose.matrix.translate(-0.025, -0.15, 0.15);
  nose.matrix.scale(0.05, 0.05, 0.05);
  nose.matrix.rotate(g_headAngle, 0, 1, 0); // Rotate head
  nose.render();

  // Render cat left front leg
  var leftFrontLeg = new Cube();
  leftFrontLeg.color = [0.9, 0.6, 0.4, 1.0]; // Brown color
  leftFrontLeg.matrix.translate(-0.2, -0.8, 0.1);
  leftFrontLeg.matrix.scale(0.1, 0.3, 0.1);
  leftFrontLeg.render();

  // Render cat right front leg
  var rightFrontLeg = new Cube();
  rightFrontLeg.color = [0.9, 0.6, 0.4, 1.0]; // Brown color
  rightFrontLeg.matrix.translate(0.1, -0.8, 0.1);
  rightFrontLeg.matrix.scale(0.1, 0.3, 0.1);
  rightFrontLeg.render();

  // Render cat left back leg
  var leftBackLeg = new Cube();
  leftBackLeg.color = [0.9, 0.6, 0.4, 1.0]; // Brown color
  leftBackLeg.matrix.translate(-0.2, -0.8, -0.1);
  leftBackLeg.matrix.scale(0.1, 0.3, 0.1);
  leftBackLeg.render();

  // Render cat right back leg
  var rightBackLeg = new Cube();
  rightBackLeg.color = [0.9, 0.6, 0.4, 1.0]; // Lighter Brown color
  rightBackLeg.matrix.translate(0.1, -0.8, -0.1);
  rightBackLeg.matrix.scale(0.1, 0.3, 0.1);
  rightBackLeg.render();

  // Render cat tail
  var tail = new Cube();
  tail.color = [0.9, 0.6, 0.4, 1.0]; // Lighter Brown color
  tail.matrix.translate(0.2, -0.5, 0);
  tail.matrix.rotate(g_yellowAngle, 0, 0, 0.5); // Rotate tail
  tail.matrix.scale(0.1, 0.4, 0.1);
  tail.render();

    // Render cat bow using a cylinder
    var bow = new Cylinder(0.05, 0.4, 20);
    bow.color = [0.9, 0.4, 0.4, 1.0]; // Pink color
    bow.matrix.translate(0, -0.2, 0.2);
    bow.matrix.rotate(g_bowAngle, 1, 0, 0); // Rotate bow
    bow.matrix.rotate(45, 0, 1, 0);
    bow.matrix.scale(1, 0.2, 1);
    bow.render();

  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
  }
  
  function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm){
      console.log("Failed to get " + htmlID + " from HTML");
      return;
    }
    htmlElm.innerHTML = text;
  }
