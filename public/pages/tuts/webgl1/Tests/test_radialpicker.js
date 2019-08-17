import * as BMF from "../shared_resources/EmeraldUtils/BitmapFontRendering.js";
import * as key from "../shared_resources/EmeraldUtils/browser_key_codes.js";
import * as EmeraldUtils from "../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import { Camera } from "../shared_resources/EmeraldUtils/emerald-opengl-utils.js";
import { coloredCubeFactory } from "../shared_resources/EmeraldUtils/emerald_easy_shapes.js";
import { Montserrat_BMF } from "../shared_resources/EmeraldUtils/Montserrat_BitmapFontConfig.js";
import { mat4, vec3 } from "../shared_resources/gl-matrix_esm/index.js";
import {CubeRadialButton, RadialPicker} from "../shared_resources/EmeraldUtils/radial_picker.js";


//////////////////////////////////////////////////////
//Test cases:
//      full circle radial
//      semi-circle radial
//      buttons too large for full circle radial should scale down
//      buttons too large for semi circle radial should scale down
//////////////////////////////////////////////////////
function createButtons(gl, num)
{
    let buttons = [];
    for(let btn = 0; btn < num; ++btn)
    {
        buttons.push(new CubeRadialButton(gl));
    }
    return buttons;
}

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

        this.lineRenderer = new EmeraldUtils.LineRenderer(this.gl);

        this.camera.enableOrthoMode = true;
        this.orthoCameraHeight = 10;
        this.zoomSpeed = 1;

        this.bRenderLineTrace = false;
        this.bStopTicks;

        this.font = this.bitmapFont = new Montserrat_BMF(this.gl, "../shared_resources/Textures/Fonts/Montserrat_ss_alpha_1024x1024_wb.png");
        this.text_instructions1 = new BMF.BitmapTextblock3D(this.gl, this.font, "Radial Picker Test. Click/touch a button to open up radial picker. WASD to move camera.");
        this.text_instructions1.xform.pos = vec3.fromValues(0,4.5,0);
        this.text_instructions1.xform.scale = vec3.fromValues(10,10,10);
        this.text_instructions1.hAlignment = BMF.HAlignment.CENTER;


        this.text1 = new BMF.BitmapTextblock3D(this.gl, this.font, "360, center pivot.");
        this.text1.xform.pos = vec3.fromValues(-6,2.5,0);
        this.text1.xform.scale = vec3.fromValues(10,10,10);
        this.text1.hAlignment = BMF.HAlignment.CENTER;
        
        this.text2 = new BMF.BitmapTextblock3D(this.gl, this.font, "360, no pivot.");
        this.text2.xform.pos = vec3.fromValues(-3,2.5,0);
        this.text2.xform.scale = vec3.fromValues(10,10,10);
        this.text2.hAlignment = BMF.HAlignment.CENTER;

        this.text3 = new BMF.BitmapTextblock3D(this.gl, this.font, "90, center pivot.");
        this.text3.xform.pos = vec3.fromValues(0,2.5,0);
        this.text3.xform.scale = vec3.fromValues(10,10,10);
        this.text3.hAlignment = BMF.HAlignment.CENTER;

        this.text4 = new BMF.BitmapTextblock3D(this.gl, this.font, "180, center pivot.");
        this.text4.xform.pos = vec3.fromValues(3,2.5,0);
        this.text4.xform.scale = vec3.fromValues(10,10,10);
        this.text4.hAlignment = BMF.HAlignment.CENTER;

        this.text5 = new BMF.BitmapTextblock3D(this.gl, this.font, "180, no pivot.");
        this.text5.xform.pos = vec3.fromValues(6,2.5,0);
        this.text5.xform.scale = vec3.fromValues(10,10,10);
        this.text5.hAlignment = BMF.HAlignment.CENTER;

        let bLargeNumber = true;
        if(bLargeNumber)
        {
            this.layer1Buttons = createButtons(this.gl, 10);
            this.layer2Buttons = createButtons(this.gl, 20);
            this.layer3Buttons = createButtons(this.gl, 30);
            this.layer4Buttons = createButtons(this.gl, 40);
        }
        else
        {
            this.layer1Buttons = createButtons(this.gl, 5);
            this.layer2Buttons = createButtons(this.gl, 2);
            this.layer3Buttons = createButtons(this.gl, 3);
            this.layer4Buttons = createButtons(this.gl, 4);
        }
        function makeButtonsChild(parentButtons, childButtons)
        {
            for(const parentBtn of parentButtons)
            {
                parentBtn.childButtons = childButtons;
            }
        };
        makeButtonsChild(this.layer1Buttons, this.layer2Buttons);
        makeButtonsChild(this.layer2Buttons, this.layer3Buttons);
        makeButtonsChild(this.layer3Buttons, this.layer4Buttons);

        this.openbtn_360_centerpivot = new CubeRadialButton(this.gl);
        makeButtonsChild([this.openbtn_360_centerpivot], this.layer1Buttons);
        this.radialPicker_360_centerpivot = new RadialPicker(this.openbtn_360_centerpivot);
        this.radialPicker_360_centerpivot.setLocalPosition(vec3.fromValues(-6,0,0));
        // this.radialPicker_360_centerpivot.bCenterButtonsAtPivot = true;

        this.openbtn_360_nopivot = new CubeRadialButton(this.gl);
        makeButtonsChild([this.openbtn_360_nopivot], this.layer1Buttons);
        this.radialPicker_360_nopivot = new RadialPicker(this.openbtn_360_nopivot);
        this.radialPicker_360_nopivot.setLocalPosition(vec3.fromValues(-3,0,0));
        this.radialPicker_360_nopivot.bCenterButtonsAtPivot = false;

        this.openbtn_90_centerpivot = new CubeRadialButton(this.gl);
        makeButtonsChild([this.openbtn_90_centerpivot], this.layer1Buttons);
        this.radialPicker_90_centerpivot = new RadialPicker(this.openbtn_90_centerpivot, 90);
        this.radialPicker_90_centerpivot.setLocalPosition(vec3.fromValues(0,0,0));
        this.radialPicker_90_centerpivot.startItemDir = vec3.fromValues(1,0,0);

        this.openbtn_180_centerpivot = new CubeRadialButton(this.gl);
        makeButtonsChild([this.openbtn_180_centerpivot], this.layer1Buttons);
        this.radialPicker_180_centerpivot = new RadialPicker(this.openbtn_180_centerpivot, 180);
        this.radialPicker_180_centerpivot.setLocalPosition(vec3.fromValues(3,0,0));
        // this.radialPicker_180_centerpivot.startItemDir = vec3.fromValues(1,0,0);
        this.radialPicker_180_centerpivot.startItemDir = vec3.fromValues(0,-1,0);

        this.openbtn_180_nopivot = new CubeRadialButton(this.gl);
        makeButtonsChild([this.openbtn_180_nopivot], this.layer1Buttons);
        this.radialPicker_180_nopivot = new RadialPicker(this.openbtn_180_nopivot, 180);
        this.radialPicker_180_nopivot.setLocalPosition(vec3.fromValues(6,0,0));
        this.radialPicker_180_nopivot.startItemDir = vec3.fromValues(1,0,0);
        this.radialPicker_180_nopivot.bCenterButtonsAtPivot = false;

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

    _bindCallbacks()
    {
        document.addEventListener('keydown', this.handleKeyDown.bind(this), /*useCapture*/ false);
        document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        document.addEventListener('wheel', this.handleMouseWheel.bind(this), false);

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

        window.addEventListener("contextmenu", this.handleContextMenuRequested.bind(this));
    }

    handleContextMenuRequested(e)
    {
        // this can be used to prevent the right click menu from popping up
        // but calling e.preventDefault(); in touch events prevents upcoming mouses
        // it appears that if touch events cancel the right-click mouse event, then
        // no context menu will appear. Hence no longer needing to handle it here.
    }

    handleKeyDown(event)
    {
        let deltaMovement = vec3.fromValues(0,0,0);

        if(event.keyCode == key.t)
        {
            this.camera.enableOrthoMode = !this.camera.enableOrthoMode;
            this.camera.enableMouseFollow = false;
            vec3.set(this.camera.forward, 0, 0, -1);
            vec3.set(this.camera.up, 0, 1, 0);
            // this.glCanvas.exitPointerLock();
            this.camera._squareBases();
        }
        if(event.keyCode == key.minus_underscore)
        {
            this.updateZoom(1);
        }
        if(event.keyCode == key.equals_plus)
        {
            this.updateZoom(-1);
        }
        if(event.keyCode == key.y)
        {
            this.bRenderLineTrace = true;
        }

        vec3.scale(deltaMovement, deltaMovement, this.camera.speed * this.deltaSec);
        vec3.add(this.camera.position, this.camera.position, deltaMovement);
    }

    handleMouseDown(e)
    {
        this.notifyInputDownEvent(e);
    }

    notifyInputDownEvent(e)
    {
        // canvas click will only happen when click is released
        let elementClicked = document.elementFromPoint(e.clientX, e.clientY);
        if(elementClicked)
        {
            if(elementClicked == this.glCanvas)
            {
                // this.handleCanvasClicked(e);
                if(this.camera.enableOrthoMode)
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

            //immediately do ray test; don't wait as we may have chords
            if(this.rayEnd && this.rayStart)
            {
                let rayDir = vec3.sub(vec3.create(), this.rayEnd, this.rayStart);
                vec3.normalize(rayDir, rayDir);

                this.radialPicker_360_centerpivot.hitTest(this.rayStart, rayDir);
                this.radialPicker_360_nopivot.hitTest(this.rayStart, rayDir);
                this.radialPicker_90_centerpivot.hitTest(this.rayStart, rayDir);
                this.radialPicker_180_centerpivot.hitTest(this.rayStart, rayDir);
                this.radialPicker_180_nopivot.hitTest(this.rayStart, rayDir);
            }
        }
    }

    updateZoom(normalizedY)
    {
        this.orthoCameraHeight = this.orthoCameraHeight + normalizedY * this.zoomSpeed;
    }

    handleMouseWheel(e)
    {
        //wheel event is not supported by safari
        let normalizedY = e.deltaY / Math.abs(e.deltaY);
        this.updateZoom(normalizedY);
    }

    handleTouchEnd(event)
    {
        event.preventDefault(); //stop mouse event

        for(const touch of event.changedTouches)
        {
            // console.log("released touch", touch.identifier);
        }
    }

    handleTouchStart(event)
    {
        event.preventDefault(); //stop mouse event

        for(const touch of event.changedTouches)
        {   
            // console.log("added touch", touch.identifier);
            this.notifyInputDownEvent(touch);
        }

    }
    handleTouchMove(event)
    {
        event.preventDefault(); //stop mouse event
    }
    handleTouchCancel(event)
    {
        event.preventDefault(); //stop mouse event
    }


    handleCanvasClicked( e )
    {
        if(this.camera.enableOrthoMode)
        {
            //
        }
        else
        {
            //not using ortho... do pointerlock for perspective camera
            this.glCanvas.requestPointerLock();
        }
    }

    handlePointerLockChange()
    {
        if(!this.camera.enableOrthoMode)
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
        this.camera.tick(this.deltaSec);

        /////////////////////////////////////
        // RENDER
        /////////////////////////////////////

        //some of these may be appropriate for camera fields
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

        let perspectiveMat = null;
        if(this.camera.enableOrthoMode) { perspectiveMat = this.camera.getOrtho(aspect * this.orthoCameraHeight, this.orthoCameraHeight);}
        else                            { perspectiveMat = this.camera.getPerspective(aspect); }

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

        this.text_instructions1.render(perspectiveMat, viewMat);
        this.text1.render(perspectiveMat, viewMat);
        this.text2.render(perspectiveMat, viewMat);
        this.text3.render(perspectiveMat, viewMat);
        this.text4.render(perspectiveMat, viewMat);
        this.text5.render(perspectiveMat, viewMat);
        this.radialPicker_360_centerpivot.render(perspectiveMat, viewMat);
        this.radialPicker_360_nopivot.render(perspectiveMat, viewMat);
        this.radialPicker_90_centerpivot.render(perspectiveMat, viewMat);
        this.radialPicker_180_centerpivot.render(perspectiveMat, viewMat);
        this.radialPicker_180_nopivot.render(perspectiveMat, viewMat);

        if(!this.bStopTicks)
        {
            requestAnimationFrame(this.boundGameLoop);
        }
    }
}

function main()
{
    game = new Game();
    game.run();
    
}

main()