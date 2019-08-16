import { vec3,vec4, mat4,quat} from "../gl-matrix_esm/index.js";
import {coloredCubeFactory} from "./emerald_easy_shapes.js";
import * as Utils from "../EmeraldUtils/emerald-opengl-utils.js"

/**
 * 
 */
export class SceneNode
{
    constructor(parentNode)
    {
        this._bDirty = false;

        this._localXform = new Utils.Transform();

        //#todo add _score to implemenation specific fields; like below
        this.cached_WorldPos = vec4.create();
        this.cached_LocalModelMat = mat4.create();
        this.cached_ParentWorldModelMat = mat4.create();
        this.cached_WorldModelMat = mat4.create();

        this.dirtyEvent = new Utils.Delegate("dirty");
        this._boundDirtyHandler = this._handleParentDirty.bind(this);

        this.setParent(parentNode);

        this._cleanState();
    }

    /////////////////////////
    //virtuals
    /////////////////////////
    /** Called when resolving dirty flag */
    v_ChildUpdateCachedPostClean() {}
    
    /////////////////////////
    // Base functionality
    /////////////////////////
    isDirty() { return this._bDirty}

    makeDirty()
    {
        this._bDirty = true;
        this.dirtyEvent.dispatchEvent(new Event("dirty"));
    }
    
    getWorldMat()
    {
        if(this.isDirty())
        {
            this._cleanState();
        }
        
        return this._getCachedWorldMat();
    }

    getLocalPosition(out) { return vec3.copy(out, this._localXform.pos); }
    setLocalPosition(pos)
    {
        this.makeDirty();
        vec3.copy(this._localXform.pos, pos);
    }

    getLocalRotation(out) { return quat.copy(out, this._localXform.rot); }
    setLocalRotation(newLocalRotQuat)
    {
        this.makeDirty();
        quat.copy(this._localXform.rot, newLocalRotQuat);
    }

    getLocalScale(out) { return vec3.copy(out, this._localXform.scale); }
    setLocalScale(newScale)
    {
        this.makeDirty();
        vec3.copy(this._localXform.scale, newScale);
    }

    setParent(newParentSceneNode)
    {
        if(this._parentNode)
        {
            //remove previous event listener
            this._parentNode.dirtyEvent.removeEventListener("dirty", this._boundDirtyHandler);
        }

        this.bForceNextClean = true;
        this._parentNode = newParentSceneNode;
        if(this._parentNode) //pass null to clear parent.
        {
            this._parentNode.dirtyEvent.addEventListener("dirty", this._boundDirtyHandler,);
        }
    }

    /** Doesn't do recursive checks; should only be called if checks have already been done. */
    _getCachedWorldMat()
    {
        return mat4.clone(this.cached_WorldModelMat)
    }
    
    /** Updates current node and any dirty parents. */
    _cleanState()
    {
        let bWasDirty = false;

        if(this.isDirty() || this.bForceNextClean)
        {
            bWasDirty = true;
            this.cached_LocalModelMat = this._localXform.toMat4(this.cached_LocalModelMat);
            this.cached_ParentWorldModelMat =  this._parentNode ? this._parentNode._getCachedWorldMat() : mat4.identity(mat4.create());
            mat4.multiply(/*outparam*/this.cached_WorldModelMat, /*lhs*/this.cached_ParentWorldModelMat, /*rhs*/this.cached_LocalModelMat);
            this._updateCachesPostClean();

            this._bDirty = false;
            this.bForceNextClean = false;
        }

        //return true if recalculation happened
        return bWasDirty;
    }

    _handleParentDirty()
    {
        this.makeDirty();
    }

    _updateCachesPostClean()
    {
        let worldXform = this._getCachedWorldMat();
        this.cached_WorldPos = vec4.transformMat4(this.cached_WorldPos, vec4.fromValues(0,0,0,1), worldXform);
        this.v_ChildUpdateCachedPostClean();
    }
}


