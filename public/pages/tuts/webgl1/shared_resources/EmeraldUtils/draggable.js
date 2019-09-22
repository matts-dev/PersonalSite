import { mat4, vec3, vec4 } from "../gl-matrix_esm/index.js";
import { SceneNode } from "./3d_utils.js";
import { discard_simpleTexturedQuadShapeShader_fs, simpleTexturedQuadShapeShader_vs, texturedQuadFactory } from "./emerald_easy_shapes.js";
import * as EmeraldUtils from "../EmeraldUtils/emerald-opengl-utils.js";

/** Widget that reacts to being moved by updating its local position to the moved location */
export class DragWidget extends SceneNode
{
    constructor(bAutoRegisterToEvents = false, canvas = null, camera = null, stopTouchesFromInvokingMouseEvents = true)
    {
        super();
        this.bDragging = false;
        this.trackedTouch = null;
        this.draggingRightBasis = vec3.fromValues(0,0,0);
        this.draggingUpBasis = vec3.fromValues(0,0,0);
        this.startDragClientX = 0;
        this.startDragClientY = 0;
        this.clientToCameraConversionX = 0;
        this.clientToCameraConversionY = 0;
        this.startParentLocalPos = vec3.fromValues(0,0,0);
        this._updatePositionBuffer = vec3.fromValues(0,0,0);
        this._scaledUpBuffer = vec3.fromValues(0,0,0);
        this._scaledRightBuffer = vec3.fromValues(0,0,0);

        this.stopTouchesFromInvokingMouseEvents = stopTouchesFromInvokingMouseEvents;
        this.bAutoRegisterHandlers = this.bAutoRegisterHandlers;
        if(bAutoRegisterToEvents && canvas && camera)
        {
            this.canvas = canvas;
            this.camera = camera;
            document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
            document.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
            document.addEventListener('mouseup', this.handleMouseUp.bind(this), false);
            canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
            canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
            canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
            // this.glCanvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), false);
        }
    }

    //these handlers can be optionally bound; if not boudn then user will be responsible for calling notifies
    handleMouseDown(e) { this.notifyInputDownEvent(e, this.canvas, this.camera);}
    handleMouseMove(e) { this.notifyInputMoveEvent(e);}
    handleMouseUp(e)   { this.notifyInputUpEvent(e);}
    handleTouchStart(e){ if(this.stopTouchesFromInvokingMouseEvents) { e.preventDefault();} this.notifyInputDownEvent(e,this.canvas, this.camera);}
    handleTouchMove(e) { if(this.stopTouchesFromInvokingMouseEvents) { e.preventDefault();} this.notifyInputMoveEvent(e);}
    handleTouchEnd(e)  { if(this.stopTouchesFromInvokingMouseEvents) { e.preventDefault();} this.notifyInputUpEvent(e);}

    v_rayHitTest(rayStart, rayDir){console.log("draggable did not implement hittest virtual", rayStart, rayDir)} //implement this to do hit tests

    notifyDeleted()
    {
        // if(this.bAutoRegisterHandlers && this.canvas && this.camera)
        // {
        //     document.removeEventListener()
        // }
    }

    notifyInputDownEvent(e, canvas, camera)
    {
        let touch = null;
        if (e.changedTouches && e.changedTouches.length > 0) 
        {
            touch = e.changedTouches[0]; 
        }

        let ray = camera.generateClickedRay(touch ? touch : e, canvas);
        if(ray)
        {
            if(this.v_rayHitTest(ray.rayStart, ray.rayDir))
            {
                let clientX = touch ? touch.clientX : e.clientX;
                let clientY = touch ? touch.clientY : e.clientY;

                this.bDragging = true;
                // if (e.changedTouches && e.changedTouches.length > 0) { this.trackedTouch = e.changedTouches[0]; }
                this.trackedTouch = touch;
                vec3.copy(this.draggingRightBasis,camera.right);
                vec3.copy(this.draggingUpBasis, camera.up);
                this.startDragClientX = clientX;
                this.startDragClientY = clientY;
                // let aspect = canvas.clientWidth / canvas.clientHeight;  //#note clientWidth may not be a great value to read here; scrolling considered?
                
                this.clientToCameraConversion = (camera.orthoHeight) / canvas.clientHeight; 
                // this.clientToCameraConversionY = 2*(camera.orthoHeight)          / canvas.clientHeight; 
                // this.clientToCameraConversionX = 2*(camera.orthoHeight * aspect) / canvas.clientWidth; 
                let topParent = this.getTopParent();
                topParent.getLocalPosition(this.startParentLocalPos);
            }
        }
    }

    notifyInputMoveEvent(e)
    {
        if(this.bDragging)
        {
            let clientX = 0;
            let clientY = 0;
            if(this.trackedTouch)
            {
                let foundTouch = false;
                //make sure this is same touch; object instances will be different
                if (e.changedTouches && e.changedTouches.length > 0) 
                {
                    for(const touch of event.changedTouches)
                    {
                        if(this.trackedTouch.identifier == touch.identifier)
                        {
                            clientX = touch.clientX;
                            clientY = touch.clientY;
                            foundTouch = true;
                            break;
                        }
                    }
                }
                if(!foundTouch) { return ;}
            }
            else
            {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            //convert the drag mouse coordinates to camera coordinates
            let deltaClientX = clientX - this.startDragClientX;
            let deltaClientY = clientY - this.startDragClientY;
            
            let deltaCamX = deltaClientX * this.clientToCameraConversion;
            let deltaCamY = deltaClientY * this.clientToCameraConversion;
            deltaCamY *= -1;

            //get toplevel parent (that is the local position we're going to transform)
            let topParent = this.getTopParent();

            //adjust the top-level parent's coordinates by the camera right and up vecs
            vec3.copy(this._updatePositionBuffer, this.startParentLocalPos);

            vec3.scale(this._scaledUpBuffer, this.draggingUpBasis, deltaCamY);
            vec3.add(this._updatePositionBuffer, this._updatePositionBuffer, this._scaledUpBuffer);

            vec3.scale(this._scaledRightBuffer, this.draggingRightBasis, deltaCamX);
            vec3.add(this._updatePositionBuffer, this._updatePositionBuffer, this._scaledRightBuffer);

            topParent.setLocalPosition(this._updatePositionBuffer);
        }
    }

    notifyInputUpEvent(e)
    {
        if(this.bDragging)
        {
            if(this.trackedTouch)
            {
                //check to make sure this is the same touch
                if (e.changedTouches && e.changedTouches.length > 0) 
                {
                    for(const touch of event.changedTouches)
                    {
                        if(this.trackedTouch.identifier == touch.identifier)
                        {
                            this.bDragging = false;
                            this.trackedTouch = null;
                            break;
                        }
                    }
                }
            }
            else
            {
                this.bDragging = false;
            }
        }
    }
}

export class DragWidgetTextured extends DragWidget
{
    constructor(gl, bAutoRegisterHandlers = false, canvas = null, camera = null)
    {
        super(bAutoRegisterHandlers, canvas, camera);
        this.gl = gl;

        this.textures = this._createTextures(this.gl);
        this.texturedQuad = texturedQuadFactory(this.gl, simpleTexturedQuadShapeShader_vs, discard_simpleTexturedQuadShapeShader_fs);
    }

    v_rayHitTest(rayStart, rayDir)
    {
        let inverseXform = this.getInverseWorldMat();

        let transformedRayStart = vec4.fromValues(rayStart[0], rayStart[1], rayStart[2], 1.0); //this is a point so 4th coordinate is a 1
        vec4.transformMat4(transformedRayStart, transformedRayStart, inverseXform);

        let transformedRayDir = vec4.fromValues(rayDir[0], rayDir[1], rayDir[2], 0.0);   //this is a dir, 4th coordinate is 0
        vec4.transformMat4(transformedRayDir, transformedRayDir, inverseXform);

        //the inverse transform will handle scaling etc; so the fast-box-collision test must use the normalized cube units
        //since this is a quad plane, we make a skinny box and use that for hit test (there's no triangle test currentlyk)
        let hit_t = EmeraldUtils.rayTraceFastAABB(-0.5, 0.5, -0.5, 0.5, -0.05, 0.05, transformedRayStart, transformedRayDir);
        if(hit_t)
        {
            return true;
        } 
        return false;
    } 

    render(viewMat, perspectiveMat)
    {
        let quadModelMat = this.getWorldMat();

        this.texturedQuad.bindBuffers();
        this.texturedQuad.bindTexture(this.gl.TEXTURE0, this.textures.depad.glTextureId, this.texturedQuad.shader.uniforms.texSampler);
        this.texturedQuad.updateShader(quadModelMat, viewMat, perspectiveMat);
        this.texturedQuad.render();

    }

    _createTextures(gl)
    {
        return {
            depad : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/Icons/DepadIcon3.png"),
        }
    }

}




