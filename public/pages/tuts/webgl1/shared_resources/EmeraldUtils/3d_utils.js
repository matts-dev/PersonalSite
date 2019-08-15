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
        this.parentNode = parentNode;
        this.bDirty = false;

        //#todo rename this and matrices so xform is the class, and rest are "mat" for matrix; it's unclear from names which is mat and which is class Transform
        this._localXform = new Utils.Transform();

        //#todo add _score to implemenation specific fields; like below
        this.cached_worldPos = vec4.create();
        this.cachedWorldXform = mat4.create();
        this.cachedLocalXform = mat4.create();
        this.cachedParentWorldXform = mat4.create();

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
    isDirtyRecursive() { return this.bDirty || (this.parentNode && this.parentNode.isDirtyRecursive()); } //#TODO would be better to listen to parent events for when dirty 
    
    getWorldXform()
    {
        if(this.isDirtyRecursive())
        {
            this._cleanState();
        }
        
        return this._getCachedWorldXform();
    }

    getLocalPosition(out) { return vec3.copy(out, this._localXform.pos); }
    setLocalPosition(pos)
    {
        this.bDirty = true;
        vec3.copy(this._localXform.pos, pos);
    }

    getLocalRotation(out) { return quat.copy(out, this._localXform.rot); }
    setLocalRotation(newLocalRotQuat)
    {
        this.bDirty = true;
        quat.copy(this._localXform.rot, newLocalRotQuat);
    }

    getLocalScale(out) { return vec3.copy(out, this._localXform.scale); }
    setLocalScale(newScale)
    {
        this.bDirty = true;
        vec3.copy(this._localXform.scale, newScale);
    }

    setParent(newParentSceneNode)
    {
        this.bForceNextClean = true;
        this.parentNode = newParentSceneNode;
    }

    //private:

    /** Doesn't do recursive checks; should only be called if checks have already been done. */
    _getCachedWorldXform()
    {
        return mat4.clone(this.cachedWorldXform)
    }
    
    /** Updates current node and any dirty parents. */
    _cleanState()
    {
        let bDirtyFlagFoundInHierarchy = false;

        //1. recursively update all parents and cache results
        if(this.parentNode && this.parentNode._cleanState() || this.bForceNextClean)
        {
            //parents updated, get updated xform; but don't let cursive checks happen since we know they were just updated
            this.cachedParentWorldXform = this.parentNode._getCachedWorldXform();
            bDirtyFlagFoundInHierarchy = true;
        }

        //2. try caching local xform (now that we've got updated cached parent xforms)
        if(this.bDirty || this.bForceNextClean)
        {
            bDirtyFlagFoundInHierarchy = bDirtyFlagFoundInHierarchy || this.bDirty;
            this.cachedLocalXform = this._localXform.toMat4(this.cachedLocalXform);
        }

        //3. combine all matrices if any dirty flags found
        if(bDirtyFlagFoundInHierarchy)
        {
            mat4.multiply(/*outparam*/this.cachedWorldXform,
                 /*lhs*/this.cachedParentWorldXform, /*rhs*/this.cachedLocalXform);
        }

        //4. update all specific caches
        this._updateCachesPostClean();

        this.bDirty = false;
        this.bForceNextClean = false;

        //return true if recalculation happened
        return bDirtyFlagFoundInHierarchy;
    }

    _updateCachesPostClean()
    {
        let worldXform = this._getCachedWorldXform();
        this.cached_worldPos = vec4.transformMat4(this.cached_worldPos, vec4.fromValues(0,0,0,1), worldXform);
        this.v_ChildUpdateCachedPostClean();
    }

    _getVec3(out, target)
    {
        out[0] = target[0];
        out[1] = target[1];
        out[2] = target[2];
    }
}


