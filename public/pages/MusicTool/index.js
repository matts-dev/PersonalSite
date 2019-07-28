import * as EmeraldUtils from "../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import {UnitCube3D, texturedCubeFactory, coloredCubeFactory} from "../shared_resources/EmeraldUtils/emerald_easy_shapes.js";
import * as key from "../shared_resources/EmeraldUtils/browser_key_codes.js";
import {Camera} from "../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import {vec2, vec3, vec4, mat4} from "../shared_resources/gl-matrix_esm/index.js";
import {RenderBox3D, GlyphRenderer} from "../shared_resources/EmeraldUtils/BitmapFontRendering.js"
import * as BMF from "../shared_resources/EmeraldUtils/BitmapFontRendering.js"
import { Montserrat_BMF } from "../shared_resources/EmeraldUtils/Montserrat_BitmapFontConfig.js";
import { Piano } from "../shared_resources/EmeraldUtils/music_tools.js";
import {isSafari} from "../shared_resources/EmeraldUtils/browser_key_codes.js";



//////////////////////////////////////////////////////
//module level statics
//////////////////////////////////////////////////////
var game = null;


//////////////////////////////////////////////////////
// Shaders
//////////////////////////////////////////////////////


//////////////////////////////////////////////////////
// Base Game Class
//////////////////////////////////////////////////////
class Game
{
    constructor(glCanvasId = "#glCanvas")
    {
        this.glCanvas = document.querySelector(glCanvasId);
        this.gl = this.glCanvas.getContext("webgl");
        this.prevFrameTimestampSec = 0;

        this.inputMonitor = new key.InputMonitor();
        
        this.boundGameLoop = this.gameLoop.bind(this);
        
        // this.buffers = this._createBuffers(this.gl);
        // this.shaders = this._createShaders(this.gl);
        this.textures = this._createTextures(this.gl);
        
        ///////////////////////////////
        //custom game code
        this.coloredCube = coloredCubeFactory(this.gl);
        this.camera = new Camera(vec3.fromValues(0,0,1), vec3.fromValues(0,0,-1));
    
        //todo create a list of pianos?
        this.piano = new Piano(this.gl, "../shared_resources/Sounds/PianoKeySounds/");
        // this.piano.xform.pos[0] = 3;
        // this.piano.xform.pos[1] = 3;
        this.piano.xform.scale[0] = 0.75;
        this.piano.xform.scale[1] = 0.75;


        this.lineRenderer = new EmeraldUtils.LineRenderer(this.gl);

        this.useOrthoCamera = true;
        this.orthoCameraHeight = 10;

        this.bRenderLineTrace = false;
        this.bStopTicks;

        //////////////////////////////
        
        this._bindCallbacks();
    }

    // _createBuffers(gl)
    // {
        
    // }

    _createTextures(gl){
        return {
            grass : new EmeraldUtils.Texture(gl, "../shared_resources/Grass2.png"),
            montserratFontWhite : new EmeraldUtils.Texture(gl, "../shared_resources/Montserrat_ss_alpha_white_power2.png"),
            montserratFontBlack : new EmeraldUtils.Texture(gl, "../shared_resources/Montserrat_ss_alpha_black_power2.png"),
            montserratFont : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/Fonts/Montserrat_ss_alpha_1024x1024_wb.png"),
        }
    }

    // _createShaders(gl){
    //     let quad2DShader = EmeraldUtils.initShaderProgram(gl, quad2DVertSrc, quad2DFragSrc);
    //     return {
    //         quad2D : {
    //             program : quad2DShader,
    //             attribs : {
    //                 pos : gl.getAttribLocation(quad2DShader, "vertPos"),
    //                 uv : gl.getAttribLocation(quad2DShader, "texUVCoord"),
    //             },
    //             uniforms : {
    //                 model      : gl.getUniformLocation(quad2DShader, "model"),
    //                 texSampler : gl.getUniformLocation(quad2DShader, "diffuseTexSampler"),
    //             },
    //         },
    //     };
    // }

    _bindCallbacks()
    {
        document.addEventListener('keydown', this.handleKeyDown.bind(this), /*useCapture*/ false);
        document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        // document.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
        // document.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        // document.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
        // document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), false);

        this.glCanvas.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
        this.glCanvas.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        this.glCanvas.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
        this.glCanvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), false);

        
        // document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        if(EmeraldUtils.supportPointerLock)
        {
            this.glCanvas.addEventListener("click", this.handleCanvasClicked.bind(this), false);
            EmeraldUtils.configureMultiBrowserPointerLock(this.glCanvas);
            EmeraldUtils.addEventListener_pointerlockchange(this.handlePointerLockChange.bind(this));
        }
    }

    handleKeyDown(event)
    {
        let deltaMovement = vec3.fromValues(0,0,0);
        if(event.keyCode == key.up)
        {
            deltaMovement[0] = deltaMovement[0] + this.camera.up[0];
            deltaMovement[1] = deltaMovement[1] + this.camera.up[1];
            deltaMovement[2] = deltaMovement[2] + this.camera.up[2];
        }
        if(event.keyCode == key.down)
        {
            deltaMovement[0] = deltaMovement[0] + -this.camera.up[0];
            deltaMovement[1] = deltaMovement[1] + -this.camera.up[1];
            deltaMovement[2] = deltaMovement[2] + -this.camera.up[2];
        }
        if(event.keyCode == key.left)
        {
            deltaMovement[0] = deltaMovement[0] + -this.camera.right[0];
            deltaMovement[1] = deltaMovement[1] + -this.camera.right[1];
            deltaMovement[2] = deltaMovement[2] + -this.camera.right[2];
        }
        if(event.keyCode == key.right)
        {
            deltaMovement[0] = deltaMovement[0] + this.camera.right[0];
            deltaMovement[1] = deltaMovement[1] + this.camera.right[1];
            deltaMovement[2] = deltaMovement[2] + this.camera.right[2];
        }
        if(event.keyCode == key.t)
        {
            this.useOrthoCamera = !this.useOrthoCamera;
        }

        vec3.scale(deltaMovement, deltaMovement, this.camera.speed * this.deltaSec);
        vec3.add(this.camera.position, this.camera.position, deltaMovement);
    }

    handleMouseDown(e)
    {
        // canvas click will only happen when click is released
        let elementClicked = document.elementFromPoint(e.clientX, e.clientY);
        if(elementClicked)
        {
            if(elementClicked == this.glCanvas)
            {
                // this.handleCanvasClicked(e);
                if(this.useOrthoCamera)
                {
                    let canvas = this.gl.canvas;
                    let canvasHalfWidth = canvas.clientWidth / 2.0;
                    let canvasHalfHeight = canvas.clientHeight / 2.0;
        
                    //x-y relative to center of canvas; assuming 0 padding
                    let x = (e.clientX - canvas.offsetLeft) - (canvasHalfWidth);
                    let y = -((e.clientY - canvas.offsetTop) - (canvasHalfHeight));
                    // console.log(x, y);
        
                    let fractionWidth = x / canvasHalfWidth;
                    let fractionHeight = y / canvasHalfHeight;
                    
                    let aspect = canvas.clientWidth / canvas.clientHeight;
                    let orthoHalfHeight = this.orthoCameraHeight / 2.0
                    let orthoHalfWidth = (aspect * this.orthoCameraHeight) / 2.0; 
        
                    let numCameraUpUnits = fractionHeight * orthoHalfHeight;
                    let numCameraRightUnits = fractionWidth * orthoHalfWidth;
        
                    let rayStart = vec3.clone(this.camera.position);
        
                    { //calculate start point
                        let scaledCamUp = vec3.clone(this.camera.up);
                        let scaledCamRight = vec3.clone(this.camera.right);
            
                        vec3.scale(scaledCamUp, scaledCamUp, numCameraUpUnits);
                        vec3.scale(scaledCamRight, scaledCamRight, numCameraRightUnits);
            
                        vec3.add(rayStart, rayStart, scaledCamUp);
                        vec3.add(rayStart, rayStart, scaledCamRight);
                    }
        
                    let rayEnd = vec3.clone(rayStart);
                    vec3.add(rayEnd, rayEnd, this.camera.forward);
                    
                    this.rayStart = rayStart;
                    this.rayEnd = rayEnd;
                }
            }
        }
    }

    handleTouchEnd(event)
    {
        this.piano.keys[7].press();
    }
    handleTouchStart(event)
    {
        this.piano.keys[0].press();
    }
    handleTouchMove(event)
    {
        this.piano.keys[3].press();
    }
    handleTouchCancel(event)
    {
        this.piano.keys[11].press();
    }


    handleCanvasClicked( e )
    {
        // #TODO move this code to utils so it can be used in other demos
        if(this.useOrthoCamera)
        {
            //moved to on clickdown so sound is immediate
            // let canvas = this.gl.canvas;
            // let canvasHalfWidth = canvas.clientWidth / 2.0;
            // let canvasHalfHeight = canvas.clientHeight / 2.0;

            // //x-y relative to center of canvas; assuming 0 padding
            // let x = (e.clientX - canvas.offsetLeft) - (canvasHalfWidth);
            // let y = -((e.clientY - canvas.offsetTop) - (canvasHalfHeight));
            // // console.log(x, y);

            // let fractionWidth = x / canvasHalfWidth;
            // let fractionHeight = y / canvasHalfHeight;
            
            // let aspect = canvas.clientWidth / canvas.clientHeight;
            // let orthoHalfHeight = this.orthoCameraHeight / 2.0
            // let orthoHalfWidth = (aspect * this.orthoCameraHeight) / 2.0; 

            // let numCameraUpUnits = fractionHeight * orthoHalfHeight;
            // let numCameraRightUnits = fractionWidth * orthoHalfWidth;

            // let rayStart = vec3.clone(this.camera.position);

            // { //calculate start point
            //     let scaledCamUp = vec3.clone(this.camera.up);
            //     let scaledCamRight = vec3.clone(this.camera.right);
    
            //     vec3.scale(scaledCamUp, scaledCamUp, numCameraUpUnits);
            //     vec3.scale(scaledCamRight, scaledCamRight, numCameraRightUnits);
    
            //     vec3.add(rayStart, rayStart, scaledCamUp);
            //     vec3.add(rayStart, rayStart, scaledCamRight);
            // }

            // let rayEnd = vec3.clone(rayStart);
            // vec3.add(rayEnd, rayEnd, this.camera.forward);
            
            // this.rayStart = rayStart;
            // this.rayEnd = rayEnd;

        }
        else
        {
            //not using ortho... do pointerlock for perspective camera
            this.glCanvas.requestPointerLock();
        }
    }

    handlePointerLockChange()
    {
        if(!this.useOrthoCamera)
        {
            this.camera.enableMouseFollow = EmeraldUtils.isElementPointerLocked(this.glCanvas);
        }
    }

    run()
    {
        requestAnimationFrame(this.boundGameLoop);
    }

    gameLoop(nowMS)
    {
        let gl = this.gl;

        let nowTimeSec = (nowMS * 0.001);
        let deltaSec = nowTimeSec - this.prevFrameTimestampSec;
        this.deltaSec = deltaSec;
        this.prevFrameTimestampSec = nowTimeSec;
        
        gl.enable(gl.DEPTH_TEST); 
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clearColor(0.0, 0.0, 0.0, 1);
        gl.clearDepth(1.0); //value gl.clear() write to depth buffer; is this default value?
        gl.depthFunc(gl.LEQUAL);  //maybe default,?
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        /////////////////////////////////////
        // TICK
        /////////////////////////////////////
        if(!this.useOrthoCamera)
        {
            this.camera.tick(this.deltaSec);
        }

        /////////////////////////////////////
        // RENDER
        /////////////////////////////////////

        //some of these may be appropriate for camera fields
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

        let perspectiveMat = null;
        if(this.useOrthoCamera){ perspectiveMat = this.camera.getOrtho(aspect * this.orthoCameraHeight, this.orthoCameraHeight);}
        else                   { perspectiveMat = this.camera.getPerspective(aspect); }

        let viewMat = this.camera.getView();


        if(this.bRenderLineTrace && this.rayStart && this.rayEnd)
        {
            this.lineRenderer.renderLine(this.rayStart, this.rayEnd, vec3.fromValues(1,0,0), viewMat, perspectiveMat);
        }

        if(this.bRenderLineTrace && this.rayEnd)
        {
            let coloredCubeModel = mat4.create();
            mat4.translate(coloredCubeModel, coloredCubeModel, this.rayEnd);
            mat4.scale(coloredCubeModel, coloredCubeModel, vec3.fromValues(0.1, 0.1, 0.1));
            let cubeColor = vec3.fromValues(1,0,0);
            this.coloredCube.bindBuffers();
            this.coloredCube.updateShader(coloredCubeModel, viewMat, perspectiveMat, cubeColor);
            this.coloredCube.render();
        }

        if(this.rayEnd && this.rayStart)
        {
            let rayDir = vec3.sub(vec3.create(), this.rayEnd, this.rayStart);
            vec3.normalize(rayDir, rayDir);
            let clickedKey = this.piano.clickTest(this.rayStart, rayDir);
            if(clickedKey)
            {
                this.rayEnd = null;
                this.rayStart = null;
            }
        }

        //render piano
        this.piano.render(viewMat, perspectiveMat);
        
        if(!this.bStopTicks)
        {
            requestAnimationFrame(this.boundGameLoop);
        }
    }
}

function handleIphoneWorkaround()
{
    // !!!!!!!! this is apparently not enough to load audio. :\ !!!!!!!!!!!!!!
    //see
    //  https://stackoverflow.com/questions/31776548/why-cant-javascript-play-audio-files-on-iphone-safari
    //  https://www.ibm.com/developerworks/library/wa-ioshtml5/wa-ioshtml5-pdf.pdf
    //  https://community.esri.com/thread/159378

    console.log("iphone workaround");
    // game.bStopTicks = true;
    // game = null; 
    
    game = new Game();
    game.run();

    let iphoneBtn = document.getElementById("enableIphoneAudioButton");
    if(iphoneBtn)
    {
        iphoneBtn.style.display="none";
    }
}

function main()
{
    let iphoneBtn = document.getElementById("enableIphoneAudioButton");

    let suppressStart = false;
    if(iphoneBtn)
    {
        if(!isSafari())
        {
            iphoneBtn.style.display="none";
        } 
        else 
        {
            iphoneBtn.onclick = handleIphoneWorkaround;
            suppressStart = true;
        }
    }

    if(!suppressStart)
    {
        game = new Game();
        game.run();
    }
}


main()