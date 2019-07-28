import {vec3} from '../shared_resources/gl-matrix_esm/index.js';
import {mat4} from '../shared_resources/gl-matrix_esm/index.js';
import {quat} from '../shared_resources/gl-matrix_esm/index.js';
import * as Util from '../shared_resources/EmeraldUtils/emerald-opengl-utils.js';



///////////////////////////////////////////////////////////////////////////////////////
// Shaders
///////////////////////////////////////////////////////////////////////////////////////
const basicVertSrc =
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

const basicFragSrc = `
    varying highp vec2 uvCoord;
    varying highp vec3 lightingColor;
    
    uniform sampler2D diffuseTexSampler;

    void main(){
        highp vec4 textureColor = texture2D(diffuseTexSampler, uvCoord);
        gl_FragColor = vec4(textureColor.rgb * lightingColor, textureColor.a);
    }
`;

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

//for keycodes, see : http://www.javascripter.net/faq/keycodes.htm
//probable should make some scripting to map the keycodes to named constants
const up_keycode = 38;
const down_keycode = 40;
const left_keycode = 37;
const right_keycode = 39;

class RendererBase
{

}

class BitmapFontTestRenderer extends RendererBase
{
    constructor() 
    {
        super();

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        // Initialization of resources
        ////////////////////////////////////////////////////////////////////////////////////////////////////

        const canvas = document.querySelector("#glCanvas");
        let gl = canvas.getContext("webgl");
        if(!gl)
        {
            alert("Failed to get webgl context; browser may not support webgl 1.0");
            return;
        }

        var browserSize = Util.getBrowserSize();
        canvas.width = browserSize.width;
        canvas.height = browserSize.height;

        gl.viewport(0, 0, canvas.width, canvas.height);

        const supportPointerLock = 
            "pointerLockElement" in document ||
            "mozPointerLockElement" in document ||
            "webkitPointerLockElement" in document;
        if(!supportPointerLock)
        {
            alert("Your browser does not support pointer locking! Which means you can't use the mouse to move camera like in most games");
        }
        const shader = Util.initShaderProgram(gl, basicVertSrc, basicFragSrc);
        const cubeShaderData = {
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

        const quadShader = Util.initShaderProgram(gl, quadVertSrc, quadFragSrc);
        const quadcubeShaderData = {
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
        
        //////////////////////////////////////////////////////////////////////////////////////////////
        // Member Variables (grouped in single location for readability)
        /////////////////////////////////////////////////////////////////////////////////////////////
        this.gl = gl;
        this.glCanvas = canvas;

        //TODO refactor these input states into a stand alone class
        this.up_pressed = false; 
        this.down_pressed = false; 
        this.left_pressed = false; 
        this.right_pressed = false; 

        this.pointerLocked = false;
        this.supportPointerLock = supportPointerLock;

        //callback binding objects
        this.boundGameLoop = this.gameLoop.bind(this);

        this.buffers = initBuffers(this.gl);
        this.cubeTexture = Util.loadTextureGL(this.gl, "../shared_resources/Grass2.png");
        this.montserratTexture = Util.loadTextureGL(this.gl, "../shared_resources/Montserrat_ss_alpha_white.png");
        this.montserratBlackTexture = Util.loadTextureGL(this.gl, "../shared_resources/Montserrat_ss_alpha_black.png");

        this.quadcubeShaderData = quadcubeShaderData;
        this.cubeShaderData = cubeShaderData;

        //TODO camera class!
        this.eye = vec3.fromValues(1.5, 1.5, 0.25);
        this.camForwardVec = vec3.fromValues(0,0,-1);
        this.target = vec3.fromValues(0,0,-6);
        this.up = vec3.fromValues(0,1,0);
        this.cameraSpeed = 10;

        ///////////////////////////////////////////////////////////////////////////////////////////////
        //Event Handler Bindings (after state initialized)
        ///////////////////////////////////////////////////////////////////////////////////////////////
        // event capturing means start events at top level and move down
        var useCapture = false; //false means use event bubbling
        document.addEventListener('keydown', this.handleKeyDown.bind(this), useCapture); //TODO when refactoring input state, have the class itself listen to these changes
        document.addEventListener('keyup', this.handleKeyUp.bind(this), useCapture);
        window.addEventListener("resize", this.handleResize.bind(this), false);
        document.addEventListener('mousemove', this.handleMouseMoved.bind(this));
        
        this.glCanvas.requestPointerLock = this.glCanvas.requestPointerLock || this.glCanvas.mozrequestPointerLock || this.glCanvas.webkitrequestPointerLock;
        document.exitPointerLock = document.exitPointerLock || document.mozexitPointerLock || document.webkitexitPointerLock;
        document.addEventListener("pointerlockchange",       this.handlePointerLockChanged.bind(this), false);
        document.addEventListener("mozpointerlockchange",    this.handlePointerLockChanged.bind(this), false);
        document.addEventListener("webkitpointerlockchange", this.handlePointerLockChanged.bind(this), false);
        document.addEventListener("pointerlockerror",        this.handlePointerLockError.bind(this), false);
        document.addEventListener("mozpointerlockerror",     this.handlePointerLockError.bind(this), false);
        document.addEventListener("webkitpointerlockerror",  this.handlePointerLockError.bind(this), false);

        // canvas.onclick = this.handleCanvasClicked;
        canvas.addEventListener("click", this.handleCanvasClicked.bind(this), false);
        
    }

    //////////////////////////////////////////////////
    // HANDLERS
    //////////////////////////////////////////////////
    handleResize()
    {
        console.log("resize detected");

        const size = Util.getBrowserSize();
        this.glCanvas.width = size.width;
        this.glCanvas.height = size.height;
        this.gl.viewport(0,0,size.width,size.height);
    }

    handleCanvasClicked()
    {
        //the line of code below should be set up in the ctor; it makes pointer lock browser independent
        //this.glCanvas.requestPointerLock = this.glCanvas.requestPointerLock || this.glCanvas.mozrequestPointerLock || this.glCanvas.webkitrequestPointerLock;
        this.glCanvas.requestPointerLock();
    }

    handleKeyDown(event)
    {
        if(event.keyCode == up_keycode) { this.up_pressed = true; }
        if(event.keyCode == down_keycode) { this.down_pressed = true; }
        if(event.keyCode == left_keycode) { this.left_pressed = true; }
        if(event.keyCode == right_keycode){ this.right_pressed = true; }
    }

    handleKeyUp(event)
    {
        if(event.keyCode == up_keycode) {    this.up_pressed = false; }
        if(event.keyCode == down_keycode) {  this.down_pressed = false; }
        if(event.keyCode == left_keycode) {  this.left_pressed = false; }
        if(event.keyCode == right_keycode) { this.right_pressed = false; }
    }

    handleMouseMoved(e)
    {
        var movX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        var movY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        if(this.pointerLocked)
        {
            /////////////////////////////////////////////////////////////////////////
            // TODO refactor these into a camera class
            /////////////////////////////////////////////////////////////////////////
            let camVecs = this.calcCamBasisVec();
            
            //fps camera, for free quat camera we can cache the up each frame after calculating bases again
            const yawAxis = camVecs.up;
            const pitchAxis = camVecs.right;
        
            var qYaw = quat.create();
            var qPitch = quat.create();
        
            //adhoc fractions -- this could actually just use pixels with some scalar to control speed
            var fractionX = movX / this.glCanvas.clientWidth;
            var fractionY = movY / this.glCanvas.clientHeight;
        
            quat.setAxisAngle(qYaw, yawAxis, fractionX);
            quat.setAxisAngle(qPitch, pitchAxis, -fractionY);
            var qRot = quat.create();
            quat.multiply(qRot, qYaw, qPitch);

            vec3.transformQuat(this.camForwardVec, this.camForwardVec, qRot);
            vec3.normalize(this.camForwardVec, this.camForwardVec);
        }
    }

    handlePointerLockChanged()
    {
        if(document.pointerLockElement  === this.glCanvas
            ||  document.mozpointerLockElement  === this.glCanvas
            ||  document.webkitpointerLockElement === this.glCanvas
            )
        {
            //console.log("canvas locked");
            this.pointerLocked = true;
        }
        else
        {
            //console.log("canvas unlocked");
            this.pointerLocked = false;
        }
    }

    handlePointerLockError(/*e*/) 
    {

    }

    //TODO needs refactoring to be more class-like, rather than copy paste
    drawScene(gl, cubeShaderData, buffers, texture, deltatime)
    {
        //UPDATE
        var camVecs = this.calcCamBasisVec();
        const moveVec = vec3.fromValues(0,0,0);
        if(this.up_pressed) { 
            vec3.add(moveVec, moveVec, camVecs.forward); //needs to update to a front vec
        }
        if(this.down_pressed) { 
            var back = vec3.clone(camVecs.forward);
            vec3.scale(back, back, -1);
            vec3.add(moveVec, moveVec, back); //needs to update to a front vec
        }
        if(this.right_pressed) { 
            vec3.add(moveVec, moveVec, camVecs.right); //needs to update to a front vec
        }
        if(this.left_pressed) { 
            var left = vec3.clone(camVecs.right);
            vec3.scale(left, left, -1);
            vec3.add(moveVec, moveVec, left); //needs to update to a front vec
        }
        if(moveVec[0] !== 0 || moveVec[1] !== 0 || moveVec[2] !== 0)
        {   
            vec3.normalize(moveVec, moveVec);
            vec3.scale(moveVec, moveVec, this.cameraSpeed * deltatime);
            vec3.add(this.eye, this.eye, moveVec);
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
        this.target = vec3.add(this.target, this.eye, this.camForwardVec)
        mat4.lookAt(view, this.eye, this.target, this.up);
    
        mat4.multiply(view_model, view, model);
    
        { //scope the parameter names
            const numAttribVecComponents = 3;
            const glDataType = gl.FLOAT;
            const normalizeData = false;
            const stride = 0; //how is this set in webgl? c it is like 2*sizeof(float) etc
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.posVBO);
            gl.vertexAttribPointer(
                cubeShaderData.attribLocations.pos,
                numAttribVecComponents, glDataType, normalizeData, stride, offset
            );
            gl.enableVertexAttribArray(cubeShaderData.attribLocations.pos);
        }
        //see above vertex attribute to understand what parameters are
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uvVBO);
        gl.vertexAttribPointer(cubeShaderData.attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(cubeShaderData.attribLocations.uv);
    
        //enable normal attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalVBO);
        gl.vertexAttribPointer(cubeShaderData.attribLocations.normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(cubeShaderData.attribLocations.normal);
    
        //construct the inverse transpose matrix to convert normals without scaling artifacts
        const normMatrix = mat4.create();
        mat4.invert(normMatrix, model);
        mat4.transpose(normMatrix, normMatrix);
        
        gl.useProgram(cubeShaderData.program);
        gl.uniformMatrix4fv(cubeShaderData.uniformLocations.normalMatrix, false, normMatrix);
        gl.uniformMatrix4fv(cubeShaderData.uniformLocations.projection, false, projectionMatrix);
        gl.uniformMatrix4fv(cubeShaderData.uniformLocations.view_model, false, view_model);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(cubeShaderData.uniformLocations.texSampler, 0/*0 corresponds to gl.TEXTURE0*/);
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.cubeEAO);
        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
    
    //TODO camera class
    calcCamBasisVec()
    {
        var worldUp = vec3.clone(this.up);
        if(vec3.equals(worldUp, this.camForwardVec)) //probably sould do some real float comparision with epsilon, but quick example
        {
            worldUp = vec3.fromValues(0,0, -1);
        }
    
        var camLocRight = vec3.create();
        vec3.cross(camLocRight, worldUp, this.camForwardVec); 
        vec3.scale(camLocRight, camLocRight, -1); //camera forward vector is not in z direction, but -z
    
        var camUp = vec3.create();
        vec3.cross(camUp, this.camForwardVec, camLocRight);
    
        vec3.normalize(camUp, camUp);
        vec3.normalize(camLocRight, camLocRight);
        vec3.normalize(this.camForwardVec, this.camForwardVec);
        return {
            up : camUp,
            right : camLocRight,
            forward : this.camForwardVec
        };
    }

    //TODO refactor so this isn't copy paste... perhaps entirely different function too
    drawFont(gl, cubeShaderData, buffers, texture, /*deltatime*/)
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

        gl.useProgram(cubeShaderData.program);
        gl.uniformMatrix4fv(cubeShaderData.uniformLocations.model, false, model);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(cubeShaderData.uniformLocations.texSampler, 0/*0 corresponds to gl.TEXTURE0*/);

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
                cubeShaderData.attribLocations.pos,
                numAttribVecComponents, glDataType, normalizeData, stride, offset
            );
            gl.enableVertexAttribArray(cubeShaderData.attribLocations.pos);

            //UV ATTRIBUTES
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.quadUV_VBO);
            gl.vertexAttribPointer(cubeShaderData.attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(cubeShaderData.attribLocations.uv);
        }

        // ------------------------- RENDER -------------------------
        gl.disable(gl.DEPTH_TEST); 
        gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    start()
    {
        this.prevSec = 0
        requestAnimationFrame(this.boundGameLoop);
    }

    gameLoop(nowMS)
    {
        var nowSec = nowMS * 0.001;
        const deltatime = nowSec - this.prevSec;


        this.gl.clearColor(0,0,0,1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.drawScene(this.gl, this.cubeShaderData, this.buffers, this.cubeTexture, deltatime); //seems wasteful to keep re-configuring vertext attrib, but this is a tutorial
        this.drawFont(this.gl, this.quadcubeShaderData, this.buffers, this.montserratTexture, deltatime);
        this.prevSec = nowSec;


        requestAnimationFrame(this.boundGameLoop);    
    }
}






































//TODO make this a member function?
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


















function main()
{
    var renderer = new BitmapFontTestRenderer();
    renderer.start();
    
}

main();