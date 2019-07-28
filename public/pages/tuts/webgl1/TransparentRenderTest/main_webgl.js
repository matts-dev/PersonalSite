import {vec3} from '../shared_resources/gl-matrix_esm/index.js';
import {mat4} from '../shared_resources/gl-matrix_esm/index.js';
import {quat} from '../shared_resources/gl-matrix_esm/index.js';

main();
// var cubeRotationRadians = 0;

function loadShader(gl, glShaderType, srcStr)
{
    const shader = gl.createShader(glShaderType);
    gl.shaderSource(shader, srcStr);
    gl.compileShader(shader)
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        alert("FAILED TO COMPILE SHADER:" + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initShaderProgram(gl, vertSrc, fragSrc)
{
    const vertShader = loadShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if(!vertShader || !fragShader) { return null;} //will be alerted in shader functions

    const shaderProg = gl.createProgram();
    gl.attachShader(shaderProg, vertShader);
    gl.attachShader(shaderProg, fragShader);
    gl.linkProgram(shaderProg);
    if(!gl.getProgramParameter(shaderProg, gl.LINK_STATUS))
    {
        alert("Failed to link shader program" + gl.getProgramInfoLog(shaderProg));
        gl.deleteProgram(shaderProg);
        return null;
    }
    return shaderProg;
}
function isPowerOf2(value)
{
    //powers of 2 should only occupy a single bit; use bitwise operators to ensure this is true
    return (value & (value - 1)) == 0
}

function loadTexture(gl, url)
{
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    //display error color until the image is loaded
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 0, 255, 255]); //basicaly [1,0,1,1] color becuase it is really obvious 
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width,  height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.onload = function(){ //javascript lambdas? :D 
        //image is now loaded once this callback is hit
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
        
        if(isPowerOf2(image.width) && isPowerOf2(image.height))
        {
            //leave default texturing filtering? tutorial doesn't specify anything
            gl.generateMipmap(gl.TEXTURE_2D);
        } else 
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    }
    image.src = url; //does this invoke the load? :O seems like load is only invoked when used?
    return texture;
}

function initBuffers(gl)
{
    const positionVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionVBO);
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
        
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
        
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
      ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);



    //texture coordinates
    const textureCoordinates = [
        // Front
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Back
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Top
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Bottom
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Right
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Left
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
    ];
    const UVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, UVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);


    const vertexNormals = [
        // Front
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
    
        // Back
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
    
        // Top
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
    
        // Bottom
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
    
        // Right
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
    
        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
    ];

    const normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    
    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];
    const indexBufferEAO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferEAO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    const quadUVs = [
        0.0,1.0,    1.0,1.0,    1.0,0.0,
        0.0,1.0,    1.0,0.0,    0.0,0.0,
    ];
    
    const quadUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadUVs), gl.STATIC_DRAW)

    const quadVerts = [
        -1.0,-1.0,    1.0,-1.0,    1.0,1.0,
        -1.0,-1.0,    1.0,1.0,    -1.0,1.0,
    ];
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVerts), gl.STATIC_DRAW)

    return {
        posVBO : positionVBO,
        uvVBO : UVBuffer,
        normalVBO : normalsBuffer,
        cubeEAO : indexBufferEAO,
        quad_VBO : quadBuffer,
        quadUV_VBO : quadUVBuffer,
    };
}

//for keycodes, see : http://www.javascripter.net/faq/keycodes.htm
//probable should make some scripting to map the keycodes to named constants

var up_pressed = false;
var down_pressed = false;
var left_pressed = false;
var right_pressed = false;

const up_keycode = 38;
const down_keycode = 40;
const left_keycode = 37;
const right_keycode = 39;
function handleKeyDown(event)
{
    if(event.keyCode == up_keycode) { up_pressed = true; }
    if(event.keyCode == down_keycode) { down_pressed = true; }
    if(event.keyCode == left_keycode) { left_pressed = true; }
    if(event.keyCode == right_keycode) { right_pressed = true; }
}

function handleKeyUp(event)
{
    if(event.keyCode == up_keycode) { up_pressed = false; }
    if(event.keyCode == down_keycode) { down_pressed = false; }
    if(event.keyCode == left_keycode) { left_pressed = false; }
    if(event.keyCode == right_keycode) { right_pressed = false; }
}

var eye = vec3.fromValues(1.5, 1.5, 0.25);
var camForwardVec = vec3.fromValues(0,0,-1);
var target = vec3.fromValues(0,0,-6);
const up = vec3.fromValues(0,1,0);

var cameraSpeed = 10;

function drawFont(gl, shaderStruct, buffers, texture, /*deltatime*/)
{
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


    // const width = 892;
    // const height = 320;
    //let imgAspect = width / height;

    // ------------------------- PREPARE SHADER -------------------------
    //this is all in NDC [-1, 1]
    const model = mat4.create();
    mat4.scale(model, model, [0.5, 0.5, 0.5]);
    mat4.translate(model, model, [-1, 1, 0]);

    gl.useProgram(shaderStruct.program);
    gl.uniformMatrix4fv(shaderStruct.uniformLocations.model, false, model);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderStruct.uniformLocations.texSampler, 0/*0 corresponds to gl.TEXTURE0*/);

    // ------------------------- PREPARE VERTEX ATTRIBUTES -------------------------
    { //scope the parameter names
        //POSITION ATTRIBUTES
        const numAttribVecComponents = 2;
        const glDataType = gl.FLOAT;
        const normalizeData = false;
        const stride = 0; //how is this set in webgl? c it is like 2*sizeof(float) etc
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.quad_VBO);
        gl.vertexAttribPointer(
            shaderStruct.attribLocations.pos,
            numAttribVecComponents, glDataType, normalizeData, stride, offset
        );
        gl.enableVertexAttribArray(shaderStruct.attribLocations.pos);

        //UV ATTRIBUTES
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.quadUV_VBO);
        gl.vertexAttribPointer(shaderStruct.attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shaderStruct.attribLocations.uv);
    }

    // ------------------------- RENDER -------------------------
    gl.disable(gl.DEPTH_TEST); 
    gl.drawArrays(gl.TRIANGLES, 0, 6);

}

function drawScene(gl, shaderStruct, buffers, texture, deltatime)
{
    //UPDATE
    var camVecs = calcCamBasisVec();
    const moveVec = vec3.fromValues(0,0,0);
    if(up_pressed) { 
        vec3.add(moveVec, moveVec, camVecs.forward); //needs to update to a front vec
    }
    if(down_pressed) { 
        var back = vec3.clone(camVecs.forward);
        vec3.scale(back, back, -1);
        vec3.add(moveVec, moveVec, back); //needs to update to a front vec
    }
    if(right_pressed) { 
        vec3.add(moveVec, moveVec, camVecs.right); //needs to update to a front vec
    }
    if(left_pressed) { 
        var left = vec3.clone(camVecs.right);
        vec3.scale(left, left, -1);
        vec3.add(moveVec, moveVec, left); //needs to update to a front vec
    }
    if(moveVec[0] !== 0 || moveVec[1] !== 0 || moveVec[2] !== 0)
    {   
        vec3.normalize(moveVec, moveVec);
        vec3.scale(moveVec, moveVec, cameraSpeed * deltatime);
        vec3.add(eye, eye, moveVec);
    }
    

    //RENDER
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST); 
    gl.depthFunc(gl.LEQUAL); //some of these may be default?, they are in opengl3.3
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const FOV = 45 * (Math.PI/180);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, FOV, aspect, zNear, zFar);

    //move square to infer this libraries matrix concatenation ordering
    // cubeRotationRadians += deltatime;
    const view = mat4.create();
    const model = mat4.create();
    mat4.translate(/*outvar*/model, /*mat to translate*/ model, [0.0, 0.0, -6.0]);
    
    const view_model = mat4.create();
    target = vec3.add(target, eye, camForwardVec)
    mat4.lookAt(view, eye, target, up);

    mat4.multiply(view_model, view, model);

    { //scope the parameter names
        const numAttribVecComponents = 3;
        const glDataType = gl.FLOAT;
        const normalizeData = false;
        const stride = 0; //how is this set in webgl? c it is like 2*sizeof(float) etc
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.posVBO);
        gl.vertexAttribPointer(
            shaderStruct.attribLocations.pos,
            numAttribVecComponents, glDataType, normalizeData, stride, offset
        );
        gl.enableVertexAttribArray(shaderStruct.attribLocations.pos);
    }
    //see above vertex attribute to understand what parameters are
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uvVBO);
    gl.vertexAttribPointer(shaderStruct.attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderStruct.attribLocations.uv);

    //enable normal attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalVBO);
    gl.vertexAttribPointer(shaderStruct.attribLocations.normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shaderStruct.attribLocations.normal);

    //construct the inverse transpose matrix to convert normals without scaling artifacts
    const normMatrix = mat4.create();
    mat4.invert(normMatrix, model);
    mat4.transpose(normMatrix, normMatrix);
    
    gl.useProgram(shaderStruct.program);
    gl.uniformMatrix4fv(shaderStruct.uniformLocations.normalMatrix, false, normMatrix);
    gl.uniformMatrix4fv(shaderStruct.uniformLocations.projection, false, projectionMatrix);
    gl.uniformMatrix4fv(shaderStruct.uniformLocations.view_model, false, view_model);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderStruct.uniformLocations.texSampler, 0/*0 corresponds to gl.TEXTURE0*/);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.cubeEAO);
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

var glCanvas;
function handleCanvasClicked()
{
    if(glCanvas) //unsure if better to query from the document to get canvas or cache as global var
    {
        glCanvas.requestPointerLock();
    }
}

var pointerLocked;
function handlePointerLockChanged()
{
    if(document.pointerLockElement  === glCanvas
        ||  document.mozpointerLockElement  === glCanvas
        ||  document.webkitpointerLockElement === glCanvas
        )
    {
        //console.log("canvas locked");
        pointerLocked = true;
    }
    else
    {
        //console.log("canvas unlocked");
        pointerLocked = false;
    }
}

function calcCamBasisVec(){
    var worldUp = vec3.clone(up);
    if(vec3.equals(worldUp, camForwardVec)) //probably sould do some real float comparision with epsilon, but quick example
    {
        worldUp = vec3.fromValues(0,0, -1);
    }

    var camLocRight = vec3.create();
    vec3.cross(camLocRight, worldUp, camForwardVec); 
    vec3.scale(camLocRight, camLocRight, -1); //camera forward vector is not in z direction, but -z

    var camUp = vec3.create();
    vec3.cross(camUp, camForwardVec, camLocRight);

    vec3.normalize(camUp, camUp);
    vec3.normalize(camLocRight, camLocRight);
    vec3.normalize(camForwardVec, camForwardVec);
    return {
        up : camUp,
        right : camLocRight,
        forward : camForwardVec
    };
}

function handleMouseMoved(e)
{
    //console.log("x:" + e.clientX + " " + "y:" + e.clientY);
    //console.log("/\\: x:" + e.movementX + " " + "y:" + e.movementY);
    var movX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    var movY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

    if(pointerLocked)
    {
        let camVecs = calcCamBasisVec();
        
        //fps camera, for free quat camera we can cache the up each frame after calculating bases again
        const yawAxis = camVecs.up;
        const pitchAxis = camVecs.right;
    
        var qYaw = quat.create();
        var qPitch = quat.create();
    
        //adhoc fractions -- this could actually just use pixels with some scalar to control speed
        var fractionX = movX / glCanvas.clientWidth;
        var fractionY = movY / glCanvas.clientHeight;
    
        quat.setAxisAngle(qYaw, yawAxis, fractionX);
        quat.setAxisAngle(qPitch, pitchAxis, -fractionY);
        var qRot = quat.create();
        quat.multiply(qRot, qYaw, qPitch);

        vec3.transformQuat(camForwardVec, camForwardVec, qRot);
        vec3.normalize(camForwardVec, camForwardVec);
    }

}

 function handlePointerLockError(/*e*/) 
 {
    
 }

 
function getBrowserSize(){
    //newer browsers should support window.innerWidth, but returning all for backwards compatibility
    var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    return {
        width : w,
        height : h,
    }
}

function handleResize()
{
    console.log("resize detected");
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");

    const size = getBrowserSize();
    canvas.width = size.width;
    canvas.height = size.height;
    gl.viewport(0,0,size.width,size.height);
}



function main()
{
    const canvas = document.querySelector("#glCanvas");
    glCanvas = canvas;

    const gl = canvas.getContext("webgl");

    if(!gl)
    {
        alert("Failed to get webgl context; browser may not support webgl 1.0");
        return;
    }
    //css means that a canvas size isn't always the size it is displayed
    //for example, we may we're stretching the canvas to be full screen (see html/css)
    //canvas.width = draw buffer width, canvas.clientwidth = perceived size in browser

    //directly look up browser size, but alternatively can use clientwidth and clientheight
    // var size = getBrowserSize();
    // canvas.width = size.width;
    // canvas.height = size.height;
    // gl.viewport(0,0,size.width,size.height);

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0,0,canvas.width,canvas.height);
    window.addEventListener("resize", handleResize, false);

    const supportPointerLock = 
        "pointerLockElement" in document ||
        "mozPointerLockElement" in document ||
        "webkitPointerLockElement" in document;
    if(!supportPointerLock)
    {
        alert("Your browser does not support pointer locking! Which means you can't use the mouse to move camera like in most games");
        return;
    }

    const vertSrc =
    `
        attribute vec4 vertPos;
        attribute vec3 vertNormal;
        attribute vec2 texUVCoord;

        uniform mat4 view_model;
        uniform mat4 projection;
        uniform mat4 normalMatrix; //the inverse transpose of the view_model matrix

        //notice the use of highp instead of lowp
        varying highp vec2 uvCoord; //this is like an out variable in opengl3.3+
        varying highp vec3 lightingColor;

        void main(){
            gl_Position = projection * view_model * vertPos;
            uvCoord = texUVCoord;

            highp vec3 ambient = vec3(0.3,0.3,0.3);
            highp vec3 dirLightColor = vec3(1,1,1);
            highp vec3 dirLight_dir = normalize(vec3(0.85, 0.8, 0.75));
            highp vec4 transformedNormal = normalMatrix * vec4(vertNormal, 1.0);

            highp float directionalIntensity = max(dot(transformedNormal.xyz, dirLight_dir), 0.0);
            lightingColor = ambient + (dirLightColor * directionalIntensity);
        }
    `;
    const fragSrc = `
        varying highp vec2 uvCoord;
        varying highp vec3 lightingColor;
        
        uniform sampler2D diffuseTexSampler;

        void main(){
            highp vec4 textureColor = texture2D(diffuseTexSampler, uvCoord);
            gl_FragColor = vec4(textureColor.rgb * lightingColor, textureColor.a);
        }
    `;

    const shader = initShaderProgram(gl, vertSrc, fragSrc);
    const shaderStruct = {
        program : shader,
        attribLocations : {
            pos: gl.getAttribLocation(shader, "vertPos"),
            uv: gl.getAttribLocation(shader, "texUVCoord"),
            normal: gl.getAttribLocation(shader, "vertNormal"),
        },
        uniformLocations : {
            projection : gl.getUniformLocation(shader, "projection"),
            view_model : gl.getUniformLocation(shader, "view_model"),
            normalMatrix : gl.getUniformLocation(shader, "normalMatrix"),
            texSampler : gl.getUniformLocation(shader, "diffuseTexSampler"),
        },
    };


    const quadVertSrc = 
    `
        attribute vec2 vertPos;
        attribute vec2 texUVCoord;

        // uniform mat4 view_model;
        // uniform mat4 projection;
        uniform mat4 model;

        varying highp vec2 uvCoord; //this is like an out variable in opengl3.3+

        void main(){
            //gl_Position = vec4(vertPos.x/2.0, vertPos.y/2.0, 0, 1);
            // gl_Position = projection * view_model * vec4(vertPos, 0, 1);
            gl_Position = model * vec4(vertPos, 0, 1);
            uvCoord = texUVCoord;
        }
    `;
    const quadFragSrc = 
    `
        varying highp vec2 uvCoord;
        
        uniform sampler2D diffuseTexSampler;

        void main(){
            gl_FragColor = texture2D(diffuseTexSampler, uvCoord);
            // gl_FragColor = vec4(1,1,1,1);
        }
    `;
   const quadShader = initShaderProgram(gl, quadVertSrc, quadFragSrc);
   var quadShaderStruct = {
       program : quadShader,
       attribLocations : {
            pos : gl.getAttribLocation(quadShader, "vertPos"),
            uv : gl.getAttribLocation(quadShader, "texUVCoord"),
       },
       uniformLocations : {
            // projection : gl.getUniformLocation(quadShader, "projection"),
            // view_model : gl.getUniformLocation(quadShader, "view_model"),
            model      : gl.getUniformLocation(quadShader, "model"),
            texSampler : gl.getUniformLocation(quadShader, "diffuseTexSampler"),
       },
   }

    const buffers = initBuffers(gl);
    const cubeTexture = loadTexture(gl, "../shared_resources/Grass2.png");
    const montserratTexture = loadTexture(gl, "../shared_resources/Montserrat_ss_alpha_white.png");
    // const montserratBlackTexture = loadTexture(gl, "../shared_resources/Montserrat_ss_alpha_black.png");

    //event bubbling means start events at bottom element and move up
    //event capturing means start events at top level and move down
    var useCapture = false; //false means use event bubbling
    document.addEventListener('keydown', handleKeyDown, useCapture);
    document.addEventListener('keyup', handleKeyUp, useCapture);
    document.addEventListener('mousemove', handleMouseMoved);

    document.addEventListener("pointerlockchange", handlePointerLockChanged, false);
    document.addEventListener("mozpointerlockchange", handlePointerLockChanged, false);
    document.addEventListener("webkitpointerlockchange", handlePointerLockChanged, false);
    document.addEventListener("pointerlockerror", handlePointerLockError, false);
    document.addEventListener("mozpointerlockerror", handlePointerLockError, false);
    document.addEventListener("webkitpointerlockerror", handlePointerLockError, false);

    glCanvas.requestPointerLock = glCanvas.requestPointerLock || glCanvas.mozrequestPointerLock || glCanvas.webkitrequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozexitPointerLock || document.webkitexitPointerLock;

    //glCanvas.requestPointerLock(); //start pointer lock
    //document.exitPointerLock();     //end pointer lock

    canvas.onclick = handleCanvasClicked;

    var prevSec = 0
    function renderLoopCallback(nowMS)
    {
        var nowSec = nowMS * 0.001;
        const deltatime = nowSec - prevSec;
        drawScene(gl, shaderStruct, buffers, cubeTexture, deltatime); //seems wasteful to keep re-configuring vertext attrib, but this is a tutorial
        drawFont(gl, quadShaderStruct, buffers, montserratTexture, deltatime);
        //drawFontQuad(gl, quadShaderStruct, buffers, montserratBlackTexture, deltatime);
        prevSec = nowSec;

        requestAnimationFrame(renderLoopCallback);
    }
    requestAnimationFrame(renderLoopCallback);
}