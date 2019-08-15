import {vec3, vec4, quat, mat4} from "../gl-matrix_esm/index.js"
import * as Utils from "./emerald-opengl-utils.js"
import {SceneNode} from "./3d_utils.js"

export class RadialButton extends SceneNode
{
    constructor(buttonRadius, childButtons)
    {   
        this.buttonRadius = buttonRadius;
        this.childButtons = childButtons
        this.actionExpandsLayer = false;
        this.xform = new Utils.Transform();
    }

    //virtuals
    render(dt_sec = 0)      { }
    takeAction()            { }
    isToggled()             { return false; }
    actionExpandsLayer()    { return false; }

    //provided
    getWorldPosition() 
    {
        let worldXformMat = getWorldXform();
        vec4.transformMat4(vec4.create(), xform.pos, worldXformMat)
    }
}


export class RadialPicker extends SceneNode
{
    constructor(baseButtons)
    {
        this.layers = [];
        this.baseButtons = baseButtons;

        _setButtonParentToThis(this.baseButtons);
    }

    hitTest(rayStart, rayDir)
    {
        //start from outter-most layer and work in; this gives priority to outter
        for(let layerIdx = this.layers.length - 1; layerIdx > 0; --layerIdx)
        {
            let layer = this.layers[layerIdx];
            for(const button of layer)
            {
                if(button.hitTest(rayStart, rayDir))
                {
                    if(button.actionExpandsLayer())
                    {
                        button.takeAction();
                        button.setToggled(true);

                        shrinkArrayLength(layers, layerIdx + 1);

                        calculateNewLayerPivot(button);

                        this.layers.push(button.childButtons);
                        for(childBtn of button.childButtons) { childBtn.setToggled(false);}

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
        }

        //user clicked out of radial; collapse
        this.close();

        return false;
    }

    calculateNewLayerPivot(clickedButton)
    {
        let center = openButton.getWorldPosition();
        let clicked = button.getWorldPosition();

        let layerPivot = vec3.sub(vec3.create(), clicked, center); // clicked <--- center direction

    }

    open()
    {
        //TODO set default layer pivot
        openButton.setToggled(true);
        layers.push(baseButtons);
    }

    close()
    {
        openButton.setToggled(false);
        layers = [];
    }

    render(dt_sec = 0)
    {
        for(const layer of layers)
        {
            for(const button of layer.childButtons)
            {
                button.render(dt_sec);
            }
        }
    }

    /** All buttons will be parented to center, regardless of layer  */
    _setButtonParentToThis(buttons)
    {
        for(button of buttons)
        {
            button.setParent(this);
            this._setButtonParentToThis(button.childButtons)
        }
    }
}

function shrinkArrayLength(array, newLength)
{
    while(array.length > newLength && newLength > 0) { array.pop(); }
}
