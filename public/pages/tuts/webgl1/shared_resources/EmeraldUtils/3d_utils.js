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
        this.cached_InverseWorldModel = null; //lazy calculate

        this.dirtyEvent = new Utils.Delegate("dirty");
        this._boundDirtyHandler = this._handleParentDirty.bind(this);

        this.setParent(parentNode);

        this._cleanState();
    }

    /////////////////////////
    //virtuals
    /////////////////////////
    /** Called when resolving dirty flag. For updating child local caches only; cleaning is not complete when this method is called. */
    v_ChildUpdateCachedPostClean() {}
    /** A safe method to query things that have a dirty flag immediately after cleaned*/
    v_CleanComplete() {}
    
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

    getLocalModelMat()
    {
        if(this.isDirty()) { this._cleanState();}
        return mat4.copy(mat4.create(), this.cached_LocalModelMat);
    }

    requestClean()
    {
        if(this.isDirty())
        {
            this._cleanState();
        }
    }

    getLocalPosition(out) { return vec3.copy(out, this._localXform.pos); }
    setLocalPosition(pos)
    {
        vec3.copy(this._localXform.pos, pos);
        this.makeDirty();
    }

    getLocalRotation(out) { return quat.copy(out, this._localXform.rot); }
    setLocalRotation(newLocalRotQuat)
    {
        quat.copy(this._localXform.rot, newLocalRotQuat);
        this.makeDirty();
    }

    getLocalScale(out) { return vec3.copy(out, this._localXform.scale); }
    setLocalScale(newScale)
    {
        vec3.copy(this._localXform.scale, newScale);
        this.makeDirty();
    }

    getWorldPosition() 
    {
        if(this.isDirty())
        {
            this._cleanState();
        }
        return this.cached_WorldPos;
    }

    getInverseWorldMat()
    {
        this._cleanState();
        if(!this.cached_InverseWorldModel)
        {
            this.cached_InverseWorldModel = mat4.invert(mat4.create(), this.cached_WorldModelMat);
        }
        return this.cached_InverseWorldModel;
    }

    setParent(newParentSceneNode)
    {
        if(this._parentNode)
        {
            //remove previous event listener
            this._parentNode.dirtyEvent.removeEventListener("dirty", this._boundDirtyHandler);
        }

        this.makeDirty();
        this._parentNode = newParentSceneNode;
        if(this._parentNode) //pass null to clear parent.
        {
            this._parentNode.dirtyEvent.addEventListener("dirty", this._boundDirtyHandler,);
        }
    }

    getTopParent()
    {
        let child = this;
        while(child._parentNode)
        {
            child = child._parentNode;
        }
        return child;
    }

    /** Doesn't do recursive checks; should only be called if checks have already been done. */
    _getCachedWorldMat(out)
    {
        if(out == null)
        {
            out = mat4.create();
        }
        return mat4.copy(out, this.cached_WorldModelMat);
    }
    
    /** Updates current node and any dirty parents. */
    _cleanState()
    {
        let bWasDirty = false;

        if(this.isDirty())
        {
            bWasDirty = true;
            this.cached_LocalModelMat = this._localXform.toMat4(this.cached_LocalModelMat);
            this.cached_ParentWorldModelMat =  this._parentNode ? this._parentNode.getWorldMat() : mat4.identity(mat4.create());
            mat4.multiply(/*outparam*/this.cached_WorldModelMat, /*lhs*/this.cached_ParentWorldModelMat, /*rhs*/this.cached_LocalModelMat);
            this.cached_InverseWorldModel = null;
            this._updateCachesPostClean();

            this._bDirty = false;
            this.bForceNextClean = false;

            this.v_CleanComplete();
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

/** Used to make non-scene node based classes behave like scene child scene nodes*/
// export class SceneNodeWrapper extends SceneNode
// {
//     constructor()
//     {
//         super();
//         this.wrappedObject = null; //wrappedObject;
//         this.updateWrappedItem = null; //updateFunction;
//     }

//     requestClean()
//     {
//         this._cleanState();
//     }

//     _updateCachesPostClean()
//     {
//         super._updateCachesPostClean();
//         this.updateWrappedItem(this.wrappedObject);
//     }
// }








