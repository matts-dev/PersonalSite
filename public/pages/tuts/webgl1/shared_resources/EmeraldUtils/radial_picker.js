import * as EmeraldUtils from "./emerald-opengl-utils.js";
import { vec2, vec3, vec4 } from "../gl-matrix_esm/index.js";
import { SceneNode } from "./3d_utils.js";
import * as utils2d from "./2d_utils.js";
import { coloredCubeFactory } from "./emerald_easy_shapes.js";

export class RadialButton extends SceneNode
{
    constructor(buttonRadius, childButtons = [])
    {   
        super();
        this.buttonRadius = buttonRadius;
        this.childButtons = childButtons;
        this.radiusVector = vec4.fromValues(1,0,0,0); //transformations apply to this vector before getting length; update to define custom button's radius
        this.bExpands = true;
        this.bHasAction = false;
        this._bIsToggled = false;
        this.desiredScale = vec3.fromValues(1,1,1);    //radial picker may scale-down button; this is used to further tweak scaling
        this.customActionFunction = null;
    }

    //virtuals
    render(dt_sec)          { console.log("RadialButton::render() not implemented", dt_sec); }
    hitTest(rayStart, rayDir) { console.log("RadialButton::hitTest not implemented", rayStart, rayDir); return false;}
    
    takeAction()
    { 
        if(this.customActionFunction)    
        {
            this.customActionFunction();
        } 
        else 
        {
            console.log("no action function provided");
        }
        
    }
    actionExpandsLayer() {return this.childButtons.length > 0; }
    isToggled(){ return this._bIsToggled;}
    setToggled(bIsToggled){this._bIsToggled = bIsToggled;}
    getButtonRadius() 
    {
        let worldXform = this.getWorldMat();
        let transformedRadiusVec = vec4.transformMat4(vec4.create(), this.radiusVector, worldXform);
        return vec4.length(transformedRadiusVec);
    }
}

/**
 * Radial button picker. Passed an open/close button that populates children. Layers are created around open-close button
 * within some specific angle (or circular if non is specified). Buttons are added in a recursive tree fashion; the 
 * open/close button has children buttons that make up layer 1. The layer1 buttons can either take an action and close
 * the radial picker menu, or can contain children and add those to layer2 for selection. This repeats for buttons in
 * layer 2 and so on. 
 */
export class RadialPicker extends SceneNode
{
    /** @param openButton expects RadialButton that has (uniquely-owned) children that will populate layers recursively. */
    constructor(openButton, spawnRegionAngleDegrees = 360 )
    {
        super();
        this.layers = [];                                   //a radial layer of buttons
        this.layerPivots = [];                              //The desired starting point of items in the layer
        this.layerRadii = [];
        this.openButton = openButton;
        this.startItemDir = vec3.fromValues(1,0,0);

        //radial behavior
        this.bClockWise = true;
        this.spawnRegionAngle_deg = spawnRegionAngleDegrees;    //angle in which to spawn buttons
        this.bCenterButtonsAtPivot = true;                  //should buttons spawn centered around their pivot; or grow clockwise/counter-clock-wise

        this.openButton.setParent(this);
    }

    hitTest(rayStart, rayDir)
    {
        //start from outter-most layer and work in; this gives priority to outter
        for(let layerIdx = this.layers.length - 1; layerIdx >= 0; --layerIdx)
        {
            let layer = this.layers[layerIdx];
            for(const button of layer)
            {
                if(button.hitTest(rayStart, rayDir))
                {
                    if(button.actionExpandsLayer())
                    {
                        // button.takeAction();
                        for(const buttonToUnToggle of layer) {buttonToUnToggle.setToggled(false);}
                        button.setToggled(true);

                        shrinkArrayLength(this.layers, layerIdx + 1);
                        shrinkArrayLength(this.layerPivots, layerIdx + 1);
                        shrinkArrayLength(this.layerRadii, layerIdx + 1);

                        this.pushNewLayer(button.childButtons, button);

                        return true;
                    }
                    else
                    {
                        button.takeAction();
                        this.close();
                        return true;
                    }
                }
            }
        }

        //check if open button was hit
        if(this.openButton.hitTest(rayStart, rayDir))
        {
            if (!this.openButton.isToggled()) { this.open(); } 
            else { this.close();}
            return;
        }

        //user clicked out of radial; collapse
        this.close();

        return false;
    }

    
    pushNewLayer(buttons, owningButton = null)
    {
        //add buttons at layer index
        let layerIdx = this.layers.length; //this will be index when we add the layer
        this.layers.push(buttons);

        //add pivot direction for this layer based on last button clicked
        if(owningButton)
        {
            this.layerPivots.push(this.calculateNewLayerPivot(owningButton));
        }
        else
        {
            this.layerPivots.push(this.startItemDir);
        }

        //calculate layer offset before pushing new layer size
        let previousRadiiDistance = this.openButton.getButtonRadius();
        for(const previousLayerRadius of this.layerRadii) { previousRadiiDistance += 2 * previousLayerRadius;}

        //calculate layer size and add it to this layer's index
        let maxLayerRadius = 0;
        for(const childBtn of buttons) 
        {
            childBtn.setToggled(false);
            childBtn.setLocalScale(childBtn.desiredScale); //clear out any previous scaling effects done by picker; must be done before radius calculated
            let childRadius = childBtn.getButtonRadius();
            if (childRadius > maxLayerRadius) { maxLayerRadius = childRadius;}
        }
        this.layerRadii.push(maxLayerRadius);

        //calculate center offset distance for each button
        let centerOffsetDistance = previousRadiiDistance + (maxLayerRadius);    //aka layer radius

        let pivotOffsetVec = vec3.clone(this.layerPivots[layerIdx]);
        vec3.normalize(pivotOffsetVec, pivotOffsetVec);
        vec3.scale(pivotOffsetVec, pivotOffsetVec, centerOffsetDistance);

        let pivotAngle_deg = (180 / Math.PI) * Math.atan2(/*y*/pivotOffsetVec[1], /*x*/pivotOffsetVec[0]) + 360; //+360 converts negative degrees into positive degrees
        let startAngle_deg = (180 / Math.PI) * Math.atan2(/*y*/this.startItemDir[1], /*x*/this.startItemDir[0]) + 360; 

        //prepare to place buttons along spawn angle
        let totalRequiredCircumference = 0;
        let totalRequiredAngle_deg = 0;
        let circumferenceAt360degrees = (2 * Math.PI * centerOffsetDistance);
        let availableCircumference = circumferenceAt360degrees * (this.spawnRegionAngle_deg/360.0); //circumference of whole circle scaled down to the sub-angle we're spawning in.
        let buttonAngles = [];
        let buttonPortionOfCircumference = [];
        for(const layerButton of buttons)
        {
            //we need to figure out what amount of circumference each button will occupy to correctly pack the buttons.
            //one way to do this is to calculate the intersections of the layer-circle and the button'circle. 
            //the angle between those intersection points can tell use the amount of required circumference. 
            //just make button circle at top of for calculation purposes; we just need 
            let intersectPnts = utils2d.twoCirclesIntersection_ambrsoft(
                new utils2d.Circle_ambrsoft(0,0,centerOffsetDistance), new utils2d.Circle_ambrsoft(0,centerOffsetDistance,layerButton.getButtonRadius()));
            if(intersectPnts)
            {
                let dirA = vec2.fromValues(intersectPnts.first[0], intersectPnts.first[1]);
                let dirB = vec2.fromValues(intersectPnts.second[0], intersectPnts.second[1]);
                vec2.normalize(dirA, dirA);
                vec2.normalize(dirB, dirB);

                let buttonRequiredAngle_deg = (180/Math.PI) * Math.acos(vec2.dot(dirA, dirB));
                let buttonRequiredCircumference = (buttonRequiredAngle_deg / 360) * circumferenceAt360degrees; //#future this can probably be optimized to only rely on angles and not circumference
                totalRequiredAngle_deg += buttonRequiredAngle_deg;
                totalRequiredCircumference += buttonRequiredCircumference
                
                buttonAngles.push(buttonRequiredAngle_deg);
                buttonPortionOfCircumference.push(buttonRequiredCircumference);
            }
            else
            {
                console.log("RadialPicker: Failed to find intersection between button and layer; this should be impossible");
                return;
            }
        }

        //scale down buttons if they're too big
        let buttonScaleDown = 1.0;
        if(totalRequiredCircumference > availableCircumference)
        {
            buttonScaleDown = availableCircumference / totalRequiredCircumference;
            totalRequiredAngle_deg *= buttonScaleDown;
            for(let btn = 0; btn < buttonAngles.length; ++btn)
            {
                buttonAngles[btn] *= buttonScaleDown;
                buttonPortionOfCircumference[btn] *= buttonScaleDown;
            }
        }

        //calculate spawn start angle
        let currentSpawnAngle = pivotAngle_deg;
        if(this.bCenterButtonsAtPivot)
        {
            //back spawn direction up by half of the region we're going to fill with buttons
            currentSpawnAngle += -this._spinDir() * (totalRequiredAngle_deg / 2.0);

            //clamp so items can't leave specific region
            if(this.bClockWise)
            {
                let halfSpawnRegion = this.spawnRegionAngle_deg / 2;
                let minAngle_deg = startAngle_deg - halfSpawnRegion + totalRequiredAngle_deg;
                let maxAngle_deg = startAngle_deg + halfSpawnRegion;
                currentSpawnAngle = EmeraldUtils.clamp(currentSpawnAngle, minAngle_deg, maxAngle_deg);
            }
            else
            {
                let halfSpawnRegion = this.spawnRegionAngle_deg / 2;
                let minAngle_deg = startAngle_deg - halfSpawnRegion;
                let maxAngle_deg = startAngle_deg + halfSpawnRegion - totalRequiredAngle_deg;
                currentSpawnAngle = EmeraldUtils.clamp(currentSpawnAngle, minAngle_deg, maxAngle_deg);
            }
        }
        else
        {
            //clamp so items can't leave specific region
            if(this.bClockWise)
            {
                let minAngle_deg = startAngle_deg
                let maxAngle_deg = startAngle_deg + this.spawnRegionAngle_deg - totalRequiredAngle_deg;
                currentSpawnAngle = EmeraldUtils.clamp(currentSpawnAngle, minAngle_deg, maxAngle_deg);
            }
            else
            {
                let minAngle_deg = startAngle_deg + this.spawnRegionAngle_deg - totalRequiredAngle_deg
                let maxAngle_deg = startAngle_deg;
                currentSpawnAngle = EmeraldUtils.clamp(currentSpawnAngle, minAngle_deg, maxAngle_deg);
            }
        }

        // let adjustedRequiredCircumference = totalRequiredCircumference * buttonScaleDown;
        // let spawnAngleIncrement = this.spawnRegionAngle / buttons.length;
        let btnIdx = 0;
        for(const layerButton of buttons)
        {
            let buttonCenterOffset = this._spinDir() * ((buttons.length == 1) ? 0 : (buttonAngles[btnIdx] / 2.0));
            let buttonSpawnAngle_rad = (currentSpawnAngle + buttonCenterOffset) * (Math.PI/180);
            let spawnDir = vec3.fromValues(Math.cos(buttonSpawnAngle_rad), Math.sin(buttonSpawnAngle_rad), 0);
            let spawnPos = vec3.clone(spawnDir);
            vec3.scale(spawnPos, spawnPos, centerOffsetDistance);

            let scaleOverride = vec3.clone(layerButton.desiredScale);
            vec3.scale(scaleOverride, scaleOverride, buttonScaleDown);

            layerButton.setLocalPosition(spawnPos);
            layerButton.setLocalScale(scaleOverride);
            layerButton.setParent(this);

            currentSpawnAngle += this._spinDir() * buttonAngles[btnIdx];
            btnIdx += 1;
        }
    }

    calculateNewLayerPivot(clickedButton)
    {
        let center = this.openButton.getLocalPosition(vec3.create());
        let clicked = clickedButton.getLocalPosition(vec3.create());

        let layerPivot = vec3.sub(vec3.create(), clicked, center); // clicked <--- center direction

        this.layerPivots.push(layerPivot);

        return layerPivot;
    }

    open()
    {
        this.openButton.setToggled(true);
        this.pushNewLayer(this.openButton.childButtons);
    }

    close()
    {
        this.openButton.setToggled(false);
        this.layers = [];                       
        this.layerPivots = [];    
        this.layerRadii = [];
    }

    render(projection_mat, view_mat)
    {
        if(this.openButton)
        {
            this.openButton.render(projection_mat, view_mat);
        }
        for(const layer of this.layers)
        {
            for(const button of layer)
            {
                button.render(projection_mat, view_mat);
            }
        }
    }

    /** All buttons will be parented to center, regardless of layer  */
    _setButtonParentToThis(buttons)
    {
        for(const button of buttons)
        {
            button.setParent(this);
            this._setButtonParentToThis(button.childButtons)
        }
    }

    
    _spinDir() { return this.bClockWise ? -1 : 1;}
}

function shrinkArrayLength(array, newLength)
{
    while(array.length > newLength && newLength >= 0) { array.pop(); }
}












/////////////////////////////////////////////////////////////////////
// Example Radial Tools
////////////////////////////////////////////////////////////////////
export class CubeRadialButton extends RadialButton
{
    constructor(gl)
    {
        super();

        this.gl = gl;
        this.clickCube = coloredCubeFactory(gl);
        this.bgColor = vec3.fromValues(1,1,1);
        this.toggleColor = vec3.fromValues(1,0,0);
        this.desiredScale = vec3.fromValues(0.4, 0.4, 0.4);
        this.setLocalScale(this.desiredScale);
        this.customActionFunction = function(){console.log("CubeRadialButton custom action function; please override")}
    }

    hitTest(rayStart, rayDir)
    {
        let inverseXform = this.getInverseWorldMat();

        let transformedRayStart = vec4.fromValues(rayStart[0], rayStart[1], rayStart[2], 1.0); //this is a point so 4th coordinate is a 1
        vec4.transformMat4(transformedRayStart, transformedRayStart, inverseXform);

        let transformedRayDir = vec4.fromValues(rayDir[0], rayDir[1], rayDir[2], 0.0);   //this is a dir, 4th coordinate is 0
        vec4.transformMat4(transformedRayDir, transformedRayDir, inverseXform);

        //the inverse transform will handle scaling etc; so the fast-box-collision test must use the normalized cube units
        let hit_t = EmeraldUtils.rayTraceFastAABB(-0.5, 0.5, -0.5, 0.5, -0.5, 0.5, transformedRayStart, transformedRayDir);
        if(hit_t)
        {
            return true;
        } 
    }

    render(projection_mat, view_mat)
    {
        this.clickCube.updateShader(this.getWorldMat(), view_mat, projection_mat, this.isToggled() ? this.toggleColor : this.bgColor);
        this.clickCube.bindBuffers();
        this.clickCube.render();
    }
}