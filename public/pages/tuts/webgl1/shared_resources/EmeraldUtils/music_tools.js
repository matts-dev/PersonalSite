import { mat4, vec3, vec4 } from "../gl-matrix_esm/index.js";
import { SceneNode } from "./3d_utils.js";
import * as EmeraldUtils from "./emerald-opengl-utils.js";
import { Transform } from "./emerald-opengl-utils.js";
import { coloredCubeFactory_pivoted } from "./emerald_easy_shapes.js";
import {DragWidgetTextured} from "./draggable.js";
import {RadialPicker, CubeRadialButton, TexturedCubeRadialButton, TexturedTextButton} from "./radial_picker.js";
import { Montserrat_BMF } from "./Montserrat_BitmapFontConfig.js";
import { TextBlockSceneNode } from "./BitmapFontRendering.js";
import { i } from "./browser_key_codes.js";




export function majorScaleSteps() {return [2,2,1,2,2,2,1]; }
export function minorScaleSteps() { return [2,1,2,2,1,2,2]; }
export function harmonicMinorScaleSteps() {return [ 2,1,2,2,1,3,2 ];}

let noteNames = [
    "C",
    "CSHARP",
    "D",
    "DSHARP",
    "E",
    "F",
    "FSHARP",
    "G",
    "GSHARP",
    "A",
    "ASHARP",
    "B",
];

let noteToIdxMap = {
    "C" : 0,
    "CSHARP": 1,
    "D":2,
    "DSHARP":3,
    "E":4,
    "F":5,
    "FSHARP":6,
    "G":7,
    "GSHARP":8,
    "A":9,
    "ASHARP":10,
    "B":11,
};

let mapNoteNameToFilePrefix = 
{
    "C" : "C",
    "C#" : "CSHARP",
    "D" : "D",
    "D#" : "DSHARP",
    "E" :"E",
    "F" : "F",
    "F#" : "FSHARP",
    "G" : "G",
    "G#" :"GSHARP",
    "A" : "A",
    "A#" : "ASHARP",
    "B" : "B",
}

function generateScaleList(startNoteName, scaleSteps)
{
    let scale = [startNoteName];
    
    let scaleIdx = 0;
    let step = noteToIdxMap[startNoteName];
    for (const toneStep of scaleSteps)
    {
        step = step + toneStep;
        step = step % noteNames.length; //wrap around; #TODO make sure javascript does int modulus
        scale.push(noteNames[step]);
        scaleIdx = scaleIdx + 1;
    }

    return scale;
}

export function demoScaleGenerator()
{
    let demoScale = generateScaleList("C", minorScaleSteps);
    for(const note of demoScale)
    {
        console.log(note);
    }
}

export class ScaleMemberNote
{
    constructor(noteName, interval, semitonesFromRoot)
    {
        this.noteName = noteName;
        this.interval = interval;
        this.semitonesFromRoot = semitonesFromRoot;
    }

    isRoot() {return this.semitonesFromRoot === 0;}
}

export class Scale 
{
    /**
     * Construct a representation of a scale.
     *  @param startNoteName see noteNames list 
     * */
    constructor(startNoteName, scaleSteps)
    {
        this.notes = {};
        this.notes[startNoteName] = new ScaleMemberNote(startNoteName, 0, 0);
        this.intervals = [this.notes[startNoteName]];
        this.rootNote = startNoteName;

        let semitones = 0;
        let step = noteToIdxMap[startNoteName];
        for (const toneStep of scaleSteps)
        {
            semitones = semitones + toneStep;
            step = step + toneStep;
            step = step % noteNames.length; //wrap around; 

            let noteName = noteNames[step];

            if(!(noteName in this.notes)) //do not add octave root
            {
                this.intervals.push(new ScaleMemberNote(noteName, this.intervals.length, semitones));
                this.notes[noteName] = this.intervals[this.intervals.length - 1];
            }
        }   
    }
}

export function demoScaleObject(startNoteName, scaleSteps)
{
    let scaleObj = new Scale(startNoteName, scaleSteps);

    for(const noteName in scaleObj.notes)
    {  
        let note = scaleObj.notes[noteName];
        console.log(note.noteName, "\tinterval: ", note.interval, "\tsemitone: ", note.semitonesFromRoot);
    }

    return scaleObj
}

export class ScaleMatcher 
{
    constructor(currentScaleObj = null)
    {
        this.scaleObj = currentScaleObj;            
        this.allowExactMatch = false;
        this.targetScaleSteps = minorScaleSteps();
        this.minimumMatchingNotes = 3;
    }

    findSimilar()
    {
        //check invariants
        if(!this.scaleObj) { return null; }

        //generate all scales
        this.keys = [];
        for (const key of noteNames)
        {
            this.keys.push(new Scale(key, this.targetScaleSteps));
        }

        //filter based on search criteria
        this.filtered = [];
        for(const scale of this.keys)
        {
            let noteMatches = []
            let scaleNoteMatches = 0;
            for(const noteName in scale.notes)
            {
                if(noteName in this.scaleObj.notes)
                {
                    noteMatches.push(noteName);
                }
            }

            if(noteMatches.length >= this.minimumMatchingNotes)
            {
                this.filtered.push( {scale: scale, noteMatches: noteMatches});
            }
        }
        this.filtered.sort(function(a, b) {a.noteMatches.length - b.noteMatches.length});

        return this.filtered;
    }
}

export function demoScaleMatcher()
{
    console.log("Demo scale matcher");
    let scaleObj = new Scale("DSHARP", minorScaleSteps());

    let scaleMatcher = new ScaleMatcher(scaleObj);

    let matches = scaleMatcher.findSimilar();
    for(const match of matches)
    {
        console.log(match);
    }
}
// demoScaleMatcher();

class PianoKey 
{
    constructor(keyXform, isWhiteKey, soundPrefixLocation, keyString, octaveIdx)
    {
        this.xform = keyXform;
        this.isWhiteKey = isWhiteKey;
        this.baseColor = isWhiteKey ? vec3.fromValues(1,1,1) : vec3.fromValues(0,0,0);
        this.colorDecaySpeedSec = 4.0; //over range [0, 1]; 1 being max click color

        this.scaleNote = null;
        this.scaleColor = vec3.fromValues(0,1,0);
        // this.rootColor = vec3.fromValues(0.5,0.0,0.0);
        this.rootColor = vec3.fromValues(1.0,0.0,0.0);
        // this.rootColor = vec3.fromValues(1,0.7,0);
        // this.rootColor = vec3.fromValues(0.99, 0.6, 0.2);
        this.scaleNoteColorPerc = 0.5;

        this.blendColorBuffer = vec3.clone(this.baseColor);
        this.pressColorAlpha = 0;
        this.pressColor = vec3.fromValues(0.56, 0.56, 0.058);

        this.file_path_prefix = "";
        this.keyString = keyString;
        this.octaveString = octaveIdx.toString();
        this.generateSound(soundPrefixLocation);
        
        this.bShowRootNote = true;
        this.bFilterPlaybleNotesToScale = false;
    }

    generateSound(soundPrefixURL)
    {
        this.sound = new EmeraldUtils.Sound( soundPrefixURL + this.keyString + this.octaveString + ".wav");
    }

    shouldSkipHitTest()
    {
        return this.bFilterPlaybleNotesToScale && !this.scaleNote;
    }

    getColor()
    {
        return this.blendColorBuffer;
    }

    setScaleNote(scaleNote)
    {
        this.scaleNote = scaleNote;
        this.updateColor(0.0);
    }

    press(bypassScaleFilter=false)
    {
        if(this.bFilterPlaybleNotesToScale && !bypassScaleFilter)
        {
            if(!this.scaleNote)
            {
                return; //no scale note, do not play!
            }
        }

        this.pressColorAlpha = 1.0;
        this.sound.play();
    }

    setFilterPlayableToScale(bFilterPlaybleNotesToScale)
    {
        this.bFilterPlaybleNotesToScale = bFilterPlaybleNotesToScale;
    }
    setShowRootNote(bShowRootNote)
    {
        this.bShowRootNote = bShowRootNote;
        this.updateColor(0.01);
    }

    updateColor(dt_sec)
    {
        //load base color into blending buffer for manipulation
        this.blendColorBuffer[0] = this.baseColor[0];
        this.blendColorBuffer[1] = this.baseColor[1];
        this.blendColorBuffer[2] = this.baseColor[2];

        //blend scales
        if(this.scaleNote)
        {
            let percBase = 1 - this.scaleNoteColorPerc;
            this.blendColorBuffer[0] = this.scaleNoteColorPerc * this.scaleColor[0] + percBase * this.baseColor[0];
            this.blendColorBuffer[1] = this.scaleNoteColorPerc * this.scaleColor[1] + percBase * this.baseColor[1];
            this.blendColorBuffer[2] = this.scaleNoteColorPerc * this.scaleColor[2] + percBase * this.baseColor[2];

            if(this.bShowRootNote && this.scaleNote.semitonesFromRoot == 0)
            {
                this.blendColorBuffer[0] = this.scaleNoteColorPerc * this.rootColor[0] + percBase * this.baseColor[0];
                this.blendColorBuffer[1] = this.scaleNoteColorPerc * this.rootColor[1] + percBase * this.baseColor[1];
                this.blendColorBuffer[2] = this.scaleNoteColorPerc * this.rootColor[2] + percBase * this.baseColor[2];
            }
        }

        //blend clicks
        this.pressColorAlpha -= dt_sec * this.colorDecaySpeedSec;
        this.pressColorAlpha = EmeraldUtils.clamp(this.pressColorAlpha, 0, 1);

        let baseAlpha = 1 - this.pressColorAlpha;
        this.blendColorBuffer[0] = this.blendColorBuffer[0] * baseAlpha + this.pressColor[0] * this.pressColorAlpha; 
        this.blendColorBuffer[1] = this.blendColorBuffer[1] * baseAlpha + this.pressColor[1] * this.pressColorAlpha; 
        this.blendColorBuffer[2] = this.blendColorBuffer[2] * baseAlpha + this.pressColor[2] * this.pressColorAlpha; 
    }

    tick(dt_sec)
    {
        if(this.pressColorAlpha > 0.0)
        {
            this.updateColor(dt_sec);
        }
    }
}

export class Piano
{
    constructor(gl, soundPrefixLocation = "", numOctaves=2)
    {
        this.gl = gl;
        this.xform = new Transform();
        this.cube = coloredCubeFactory_pivoted(gl);
        this.keyData = {
            whiteKey : {
                width : 1,
                height : 2,
            },
            blackKey : {
                width : 0.75,
                height : 1.25,
            },
            spacing : 0.1
        }
        this.baseOctave = 3;
        this.octaves = numOctaves;

        this.soundPrefixLocation = soundPrefixLocation;
        this.bShowRootNote = false;
        this.bFilterPlaybleNotesToScale = false;
        this._generateKeys();

        //#suggestion not sure, but perhaps have this be self contained and request its own animation frames. may be bad for perf
        this.bound_tickLoop = this._tickLoop.bind(this);
        this.prevFrameTimestampSec = 0;
        requestAnimationFrame(this.bound_tickLoop);
    }

    _tickLoop(nowMS)
    {
        let nowTimeSec = (nowMS * 0.001);
        this.deltaSec = nowTimeSec - this.prevFrameTimestampSec;
        this.prevFrameTimestampSec = nowTimeSec;
        this.tick(this.deltaSec);
        requestAnimationFrame(this.bound_tickLoop);
    }

    _generateKeys()
    {
        let keyLocations = {
            c : {
                isWhiteKey : true,
                whiteKeyOffsets : 0,
                letter: 'c',
            },
            cSharp : {
                isWhiteKey : false,
                whiteKeyOffsets : 0,
                letter: 'c',
            },
            d : {
                isWhiteKey : true,
                whiteKeyOffsets : 1,
                letter: 'd',
            },
            dSharp : {
                isWhiteKey : false,
                whiteKeyOffsets : 1,
                letter: 'd',
            },
            e : {
                isWhiteKey : true,
                whiteKeyOffsets : 2,
                letter: 'e',
            },
            f : {
                isWhiteKey : true,
                whiteKeyOffsets : 3,
                letter: 'f',
            },
            fSharp : {
                isWhiteKey : false,
                whiteKeyOffsets : 3,
                letter: 'f',
            },
            g : {
                isWhiteKey : true,
                whiteKeyOffsets : 4,
                letter: 'g',
            },
            gSharp : {
                isWhiteKey : false,
                whiteKeyOffsets : 4,
                letter: 'g',
            },
            a : {
                isWhiteKey : true,
                whiteKeyOffsets : 5,
                letter: 'a',
            },
            aSharp : {
                isWhiteKey : false,
                whiteKeyOffsets : 5,
                letter: 'a',
            },
            b : {
                isWhiteKey : true,
                whiteKeyOffsets : 6,
                letter: 'b',
            }
        };

        this.keyToOctaves = {};
        this.keys = [];

        let whiteKeyOffset = this.keyData.whiteKey.width + this.keyData.spacing;
        let octaveSize = 7 * whiteKeyOffset;
        this.width = this.octaves * octaveSize;

        let keyIdx = 0;
        for(let octave = 0; octave < this.octaves; ++octave)
        {
            let startPos = vec3.fromValues(octave*octaveSize, 0, 0);
            let keyOffset = vec3.fromValues(0,0,0);
        
            for (const keyName in keyLocations) 
            {
                let key = keyLocations[keyName];
                let keyString = noteNames[keyIdx];
                keyIdx = (keyIdx + 1) % noteNames.length

                keyOffset[0] = whiteKeyOffset * key.whiteKeyOffsets;
                keyOffset[1] = 0;
                keyOffset[2] = 0;
                if(!key.isWhiteKey)
                {
                    keyOffset[0] += (this.keyData.whiteKey.width + this.keyData.spacing / 2.0) - this.keyData.blackKey.width/2;
                    keyOffset[1] += 0.001;//push up y
                    keyOffset[2] += 0.1;//push black keys up in z
                }

                let keyXform = new Transform();
                keyXform.pos[0] = startPos[0] + keyOffset[0];
                keyXform.pos[1] = keyOffset[1];
                keyXform.pos[2] = keyOffset[2];
                if(key.isWhiteKey)
                {
                    keyXform.scale[0] = this.keyData.whiteKey.width;
                    keyXform.scale[1] = this.keyData.whiteKey.height;
                }
                else
                {
                    keyXform.scale[0] = this.keyData.blackKey.width;
                    keyXform.scale[1] = this.keyData.blackKey.height;
                }
                
                this.keys.push(new PianoKey(keyXform, key.isWhiteKey, this.soundPrefixLocation, keyString, octave + this.baseOctave));
                
                if(keyString in this.keyToOctaves)
                    this.keyToOctaves[keyString].push(this.keys[this.keys.length-1]); //append to list
                else
                    this.keyToOctaves[keyString] = [ this.keys[this.keys.length-1] ]; //start list
            }
        }

        this.setShowRootNote(this.bShowRootNote);
        this.setFilterPlayableToScale(this.bFilterPlaybleNotesToScale);
    }

    _getBaseXform()
    {
        let centerXform = mat4.create();
        mat4.translate(centerXform, centerXform, vec3.fromValues(-this.width / 2, 1, 0));

        let baseXform = this.xform.toMat4(mat4.create());
        mat4.mul(baseXform, baseXform, centerXform);

        if(this.parentXform)
        {
            mat4.mul(baseXform, this.parentXform, baseXform);
        }

        return baseXform;
    }

    /* only allow notes in the scale to be playable */
    setFilterPlayableToScale(bFilterPlaybleNotesToScale)
    {
        this.bFilterPlaybleNotesToScale = bFilterPlaybleNotesToScale
        for(let pianoKey of this.keys)
        {
            pianoKey.setFilterPlayableToScale(bFilterPlaybleNotesToScale);
        }
    }
    setShowRootNote(bShowRootNote)
    {
        this.bShowRootNote = bShowRootNote;
        for(let pianoKey of this.keys)
        {
            pianoKey.setShowRootNote(this.bShowRootNote);
        }
    }

    setOctaveRange(start, end)
    {
        this.baseOctave = start;
        this.octaves = end - start;
        this._generateKeys();
    }

    applyScale(scale)
    {
        //clear old scale data
        this.scale = null;
        for(const key of this.keys)
        {
            key.setScaleNote(null);
        }

        //add new scale data
        this.scale = scale;
        for(const noteName in scale.notes)
        {
            let scaleNote = scale.notes[noteName];

            let keyOctaves = this.keyToOctaves[scaleNote.noteName];
            for(let key of keyOctaves)
            {
                key.setScaleNote(scaleNote);
            }
        }
    }
    
    /* parameters are vec3s in world space */
    clickTest(rayStart, rayDir)
    {  
        let t = Infinity;
        let hitKey = null;

        let baseXform = this._getBaseXform();
        for(const key of this.keys)
        {
            if(key.shouldSkipHitTest()){ continue;}

            let keyXform = mat4.mul(mat4.create(), baseXform, key.xform.toMat4(mat4.create()));            
            let keyInverseXform = mat4.invert(mat4.create(), keyXform);
            
            let transformedRayStart = vec4.fromValues(rayStart[0], rayStart[1], rayStart[2], 1.0); //this is a point so 4th coordinate is a 1
            vec4.transformMat4(transformedRayStart, transformedRayStart, keyInverseXform);

            let transformedRayDir = vec4.fromValues(rayDir[0], rayDir[1], rayDir[2], 0.0);   //this is a dir, 4th coordinate is 0
            vec4.transformMat4(transformedRayDir, transformedRayDir, keyInverseXform);

            //match the vertices on keys before transformations; x[0, 1] y[0, -1] z[0, -1]
            let hit_t = EmeraldUtils.rayTraceFastAABB(0, 1, -1, 0, -1, 0, transformedRayStart, transformedRayDir);
            if(hit_t)
            {
                if(t > hit_t)
                {
                    t = hit_t;
                    hitKey = key;
                }
            }
        }

        if(hitKey)
        {
            hitKey.press();
        }
        return hitKey;
    }

    render(viewMat, projectionMat)
    {
        this.cube.bindBuffers();
        
        let baseXform = this._getBaseXform();

        for(const key of this.keys)
        {
            let modelMat = mat4.mul(mat4.create(), baseXform, key.xform.toMat4(mat4.create()));
            this.cube.updateShader(modelMat, viewMat, projectionMat, key.getColor());
            this.cube.render();
        }
    }

    tick(dt_sec)
    {
        for(const key of this.keys)
        {
            key.tick(dt_sec);
        }
    }

}

class CanvasEventHandler
{
    constructor(glCanvas)
    {
        this.glCanvas = glCanvas;
        this._bindCallbacks();
        this.subscribers = new Set(); //iteration complexity is probably either o(n) for tree implementations or o(n + m) for hashmap implemenations
        this.camera = null;
    }

    _bindCallbacks()
    {
        document.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        document.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
        document.addEventListener('mouseup', this.handleMouseUp.bind(this), false);

        this.glCanvas.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
        this.glCanvas.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        this.glCanvas.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
        this.glCanvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), false);
        
    }

    addSubscriber(pianoNode){ this.subscribers.add(pianoNode);}
    deleteSubscriber(pianoNode){ this.subscribers.delete(pianoNode);}

    setCamera(camera)
    {
        this.camera = camera;
    }

    handleMouseDown(e) { this.notifyInputDownEvent(e); }
    handleMouseMove(e) { this.notifyInputMoveEvent(e);}
    handleMouseUp(e) { this.notifyInputUpEvent(e); }
    handleTouchMove(event)  { event.preventDefault(); /*stop mouse event*/}
    handleTouchCancel(event) { event.preventDefault(); /*stop mouse event*/}
    handleTouchEnd(event)
    {
        event.preventDefault(); /*stop mouse event*/
        // for(const touch of event.changedTouches) { /* console.log("released touch", touch.identifier);*/ }
    }
    handleTouchStart(event)
    {
        event.preventDefault(); /*stop mouse event*/
        for(const touch of event.changedTouches)
        {   
            // console.log("added touch", touch.identifier);
            this.notifyInputDownEvent(touch);
        }
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
                    let canvas = this.glCanvas;
                    let canvasHalfWidth = canvas.clientWidth / 2.0;
                    let canvasHalfHeight = canvas.clientHeight / 2.0;
        
                    //x-y relative to center of canvas; assuming 0 padding
                    let x = (e.clientX - canvas.offsetLeft) - (canvasHalfWidth);
                    let y = -((e.clientY - canvas.offsetTop) - (canvasHalfHeight));
                    // console.log(x, y);
        
                    let fractionWidth = x / canvasHalfWidth;
                    let fractionHeight = y / canvasHalfHeight;
                    
                    let aspect = canvas.clientWidth / canvas.clientHeight;
                    let orthoHalfHeight = this.camera.orthoHeight / 2.0
                    let orthoHalfWidth = (aspect * this.camera.orthoHeight) / 2.0; 
        
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

                for(let subscriberNode of this.subscribers)
                {
                    subscriberNode.hitTest(this.rayStart, rayDir);
                }
            }
        }
    }
    notifyInputMoveEvent(e)
    {
        
    }
    notifyInputUpEvent(e)
    {
        
    }
}

/** A wrapper for pianos that is a scene node */
let static_canvasToEventHandlers = new Map();
function getEventHandler(glCanvas)
{
    if(!static_canvasToEventHandlers.has(glCanvas))
    {
        console.log("creating static event handler")
        let eventHandler = new CanvasEventHandler(glCanvas);
        static_canvasToEventHandlers.set(glCanvas, eventHandler);
    }
    return static_canvasToEventHandlers.get(glCanvas);
}


class PianoNode extends SceneNode
{
    constructor(gl, glCanvas, piano, camera)
    {
        super();
        this.gl = gl;
        this.glCanvas = glCanvas;
        this.piano = piano;

        let eventHandler = getEventHandler(glCanvas);

        eventHandler.addSubscriber(this);
        eventHandler.setCamera(camera);
    }

    v_CleanComplete()
    {
        if(this.piano)
        {
            this.piano.parentXform = this.getWorldMat();
        }
    }

    hitTest(rayStart, rayDir)
    {
        let clickedKey = this.piano.clickTest(rayStart, rayDir);
        if(clickedKey)
        {
            // this.rayEnd = null;
            // this.rayStart = null;
        }
    }
    
    render(viewMat, perspectiveMat)
    {
        this.requestClean();
        this.piano.render(viewMat, perspectiveMat);
    }

    notifyDeleted()
    {
        let eventHandler = getEventHandler(this.glCanvas);
        eventHandler.deleteSubscriber(this);
    }
}

class ScaleButton extends TexturedTextButton
{
    constructor(gl, textureObj, text="", pianoSettings = null)
    {
        super(gl,textureObj, text);
        this.pianoSettings = pianoSettings;
    }
    actionClosesLayer(){return false;}
    takeAction()
    {
        if(this.pianoSettings)
        {
            let scaleStr = mapNoteNameToFilePrefix[this.text.wrappedText.text];
            if(scaleStr)
            {
                this.scaleObj = new Scale(scaleStr, this.pianoSettings.currentScaleSteps); //TODO hardcoded to minor; fix this
                this.pianoSettings.pianoNode.piano.applyScale(this.scaleObj);
            }
        }
        else
        {
            console.log("ScaleButton: No piano settings available");
        }
    }
}

class ToggleButton extends TexturedCubeRadialButton
{
    constructor(gl, textureObj, defaultState=false)
    {
        super(gl, textureObj);
        
        this.bToggleEffect = defaultState;
        super.setToggled(defaultState);
        this.v_applyToggleEffect(this.bToggleEffect); //in most case will not have effect because super ctor must be called before derived ctors
    }

    setToggled(bIsToggled)
    {
        //ignore what radial picker wants of this button and always reflect toggle state of effect.
        if(bIsToggled == this.bToggleEffect)
        {
            super.setToggled(bIsToggled);
        }
    }
    actionClosesLayer() {return false;}
    takeAction()
    {
        this.bToggleEffect = !this.bToggleEffect
        this.setToggled(this.bToggleEffect);
        this.v_applyToggleEffect(); //derived classes must override this virtual
    }
}

export class TexturedTextButton_Toggle extends TexturedTextButton
{
    constructor(gl, textureObj, text="", defaultState=false)
    {
        super(gl, textureObj, text);

        this.bToggleEffect = defaultState;
        super.setToggled(defaultState);
        this.v_applyToggleEffect(this.bToggleEffect); //in most case will not have effect because super ctor must be called before derived ctors
    }
    setToggled(bIsToggled)
    {
        //ignore what radial picker wants of this button and always reflect toggle state of effect.
        if(bIsToggled == this.bToggleEffect)
        {
            super.setToggled(bIsToggled);
        }
    }
    actionClosesLayer() {return false;}
    takeAction()
    {
        this.bToggleEffect = !this.bToggleEffect
        this.setToggled(this.bToggleEffect);
        this.v_applyToggleEffect(); //derived classes must override this virtual
    }
}

class ScaleLockButton extends ToggleButton
{
    constructor(gl, textureObj, pianoNodeGetter)
    {
        super(gl, textureObj);
        this.pianoNodeGetter = pianoNodeGetter;
        this.v_applyToggleEffect();
    }

    v_applyToggleEffect()
    {
        if(this.pianoNodeGetter)
        {
            let pianoNode = this.pianoNodeGetter();
            if(pianoNode)
            {
                pianoNode.piano.setFilterPlayableToScale(this.bToggleEffect);
            }
        }
    }
}


export class ShowRootNoteButtonToggle extends TexturedTextButton_Toggle
{
    constructor(gl, textureObj, pianoNodeGetter)
    {
        super(gl, textureObj, "root");
        this.pianoNodeGetter = pianoNodeGetter;
        this.v_applyToggleEffect();
    }

    v_applyToggleEffect()
    {
        if(this.pianoNodeGetter)
        {
            let pianoNode = this.pianoNodeGetter();
            if(pianoNode)
            {
                pianoNode.piano.setShowRootNote(this.bToggleEffect);
            }
        }
    }
}

class AddPianoButton  extends TexturedCubeRadialButton
{
    constructor(gl, textureObj, owningPianoManager)
    {
        super(gl, textureObj);
        this.pianoManager = owningPianoManager;
    }

    takeAction()
    {
        if(this.pianoManager)
        {
            let newPianoPos = this.pianoManager.getLocalPosition(vec3.create());
            newPianoPos[1] -= 2;

            //module static will hold this piano to prevent it from being deleted.
            let newPianoManager = new PianoManager(this.pianoManager.gl, this.pianoManager.glCanvas, null, this.pianoManager.camera);
            newPianoManager.setLocalPosition(newPianoPos);
            console.log("created piano manager");
        }
    }
}

class DeletePianoButton  extends TexturedTextButton
{
    constructor(gl, textureObj, owningPianoManager)
    {
        super(gl,textureObj, "yes");
        this.pianoManager = owningPianoManager;
    }

    takeAction()
    {
        if(this.pianoManager)
        {
            console.log("requesting delete piano manager");
            pianoManagers.notifyRequestDeletePianoManager(this.pianoManager.glCanvas, this.pianoManager);
        }
    }
}

let majorStr = "Major";
let minorStr = "Minor";
let harmonicMinorStr = "Harmonic m.";
let scalePatternMap = {};
scalePatternMap[majorStr] = majorScaleSteps();
scalePatternMap[minorStr] = minorScaleSteps();
scalePatternMap[harmonicMinorStr] = harmonicMinorScaleSteps();

class ScalePatternButton extends TexturedTextButton
{
    constructor(gl, textureObj, text="", pianoSettings = null)
    {
        super(gl,textureObj, text);
        this.pianoSettings = pianoSettings;
    }
    actionClosesLayer(){return false;}
    takeAction()
    {
        if(this.pianoSettings)
        {
            this.pianoSettings.currentScaleSteps = scalePatternMap[this.text.wrappedText.text];
        }
        else
        {
            console.log("ScalePatternButton: No piano settings available");
        }
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Piano Settings
///////////////////////////////////////////////////////////////////////////////////////////////////////////
class PianoSettingsStatics
{
    constructor(gl)
    {
        this.gl = gl;
        this.textures = {
            gearIcon : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/Icons/GearIcon.png"),
            scale : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/MusicTool/MusicScaleIcon.png"),
            scaleLock : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/MusicTool/MusicScale_Locked.png"),
            newPiano : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/MusicTool/NewPianoIcon.png"),
            chords :  new EmeraldUtils.Texture(gl, "../shared_resources/Textures/MusicTool/Chords.png"),
            search :  new EmeraldUtils.Texture(gl, "../shared_resources/Textures/MusicTool/Binoculars.png"),
            setScale :  new EmeraldUtils.Texture(gl, "../shared_resources/Textures/MusicTool/NewScaleIcon.png"),
            removeScale : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/MusicTool/RemoveScaleIcon.png"),
            searchParameters :  new EmeraldUtils.Texture(gl, "../shared_resources/Textures/MusicTool/SearchParameters.png"),
            blankCircle : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/MusicTool/BlankCircle.png"),
        };
    }
}
let static_PianoSettingsPerGLContext = new Map();
function getPianoSettingsStatics(gl)
{
    if(!static_PianoSettingsPerGLContext.has(gl))
    {
        console.log("creating static piano settings statics");
        let pianoSettingsStatics = new PianoSettingsStatics(gl);
        static_PianoSettingsPerGLContext.set(gl, pianoSettingsStatics);
    }
    return static_PianoSettingsPerGLContext.get(gl);
}

class PianoSettingsWidget extends RadialPicker
{
    static makeOpenButton(gl)
    {
        let statics = getPianoSettingsStatics(gl)
        let openButton = new TexturedCubeRadialButton(gl, statics.textures.gearIcon);
        openButton.desiredScale = vec3.fromValues(0.75, 0.75, 0.75);
        openButton.setLocalScale(openButton.desiredScale);
        return openButton;
    }

    constructor(gl, glCanvas, pianoNode, owningPianoManager)
    {
        super(PianoSettingsWidget.makeOpenButton(gl), 180);
        
        this.glCanvas = glCanvas;
        this.pianoNode = pianoNode;
        this.owningPianoManager = owningPianoManager;
        this.currentScaleSteps = minorScaleSteps();
        
        let eventHandler = getEventHandler(glCanvas)
        eventHandler.addSubscriber(this);
        
        this.requestLayoutRefreshDelegate = new EmeraldUtils.Delegate();

        this.makeButtons(gl);
    }

    notifyDeleted()
    {
        let eventHandler = getEventHandler(this.glCanvas);
        eventHandler.deleteSubscriber(this);
    }

    configDefaultButton(btn)
    {
        btn.desiredScale = vec3.fromValues(0.75, 0.75, 0.75);
        btn.setLocalScale(btn.desiredScale);
        return btn;        
    }

    getCurrentPianoNode()
    {
        return this.pianoNode;
    }

    makeButtons(gl)
    {
        let statics = getPianoSettingsStatics(gl)
        let boundPianoNodeGetter = this.getCurrentPianoNode.bind(this);
        
        // mustical scales
        let scalesButton = this.configDefaultButton(new TexturedCubeRadialButton(gl, statics.textures.scale))
        let scaleButtonChildren = [];
        {
            let scaleLockButton = this.configDefaultButton(new ScaleLockButton(gl, statics.textures.scaleLock, boundPianoNodeGetter));
            scaleButtonChildren.push(scaleLockButton);

            let showRootNoteButton = this.configDefaultButton(new ShowRootNoteButtonToggle(gl, statics.textures.blankCircle, boundPianoNodeGetter));
            scaleButtonChildren.push(showRootNoteButton);

            let setScaleButton = this.configDefaultButton(new TexturedCubeRadialButton(gl, statics.textures.setScale));
            let scaleTypesButtons = [];
            {
                let majorScalesButton = this.configDefaultButton(new ScalePatternButton(gl, statics.textures.blankCircle, majorStr, this));
                let minorScalesButton = this.configDefaultButton(new ScalePatternButton(gl, statics.textures.blankCircle, minorStr, this));
                let harmonicMinorScalesButton = new ScalePatternButton(gl, statics.textures.blankCircle, harmonicMinorStr, this);

                scaleTypesButtons.push(majorScalesButton);
                scaleTypesButtons.push(minorScalesButton);
                scaleTypesButtons.push(harmonicMinorScalesButton);

                let rootNoteButtons = null;
                {
                    //set up root notes
                    let c_button =      this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "C", this));
                    let c_s_button =    this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "C#", this));
                    let d_button =      this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "D", this));
                    let d_s_button =    this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "D#", this));
                    let e_button =      this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "E", this));
                    let f_button =      this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "F", this));
                    let f_s_button =    this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "F#", this));
                    let g_button =      this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "G", this));
                    let g_s_button =    this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "G#", this));
                    let a_button =      this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "A", this));
                    let a_s_button =    this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "A#", this));
                    let b_button =      this.configDefaultButton(new ScaleButton(gl, statics.textures.blankCircle, "B", this));

                    rootNoteButtons = [
                        c_button,
                        c_s_button,
                        d_button ,
                        d_s_button,
                        e_button, 
                        f_button,
                        f_s_button,
                        g_button, 
                        g_s_button,
                        a_button, 
                        a_s_button,
                        b_button,
                    ];
                }

                majorScalesButton.childButtons = rootNoteButtons;
                minorScalesButton.childButtons = rootNoteButtons;
                harmonicMinorScalesButton.childButtons = rootNoteButtons;
            }
            setScaleButton.childButtons = scaleTypesButtons;
            scaleButtonChildren.push(setScaleButton);

            let removeScaleButton = this.configDefaultButton(new TexturedCubeRadialButton(gl, statics.textures.removeScale));
            scaleButtonChildren.push(removeScaleButton);
        }
        scalesButton.childButtons = scaleButtonChildren;

        //octaves
        let octavesButton = this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "Octaves", this));
        let octavesChildren = [];
        {
            let startOctaveButton = this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "Start", this));
            let startOctavesChildren = [];
            {
                startOctavesChildren.push(this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "2", this)));
                startOctavesChildren.push(this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "3", this)));
                startOctavesChildren.push(this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "4", this)));
                startOctavesChildren.push(this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "5", this)));

                let handleOctaveStartClick_Bound = this.handleOctaveClicked_start.bind(this);
                for(let startOctBtn of startOctavesChildren)
                {
                    startOctBtn.customTextActionFunction = handleOctaveStartClick_Bound;
                    startOctBtn.closeLayerOnAction = false;
                }
            }
            startOctaveButton.childButtons = startOctavesChildren;
            octavesChildren.push(startOctaveButton);

            let stopOctaveButton = this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "Stop", this));
            let stopOctavesChildren = [];
            {
                stopOctavesChildren.push(this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "3", this)));
                stopOctavesChildren.push(this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "4", this)));
                stopOctavesChildren.push(this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "5", this)));
                stopOctavesChildren.push(this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "6", this)));

                let handleOctaveStopClick_Bound = this.handleOctaveClicked_end.bind(this);
                for(let stopOctBtn of stopOctavesChildren)
                {
                    stopOctBtn.customTextActionFunction = handleOctaveStopClick_Bound;
                    stopOctBtn.closeLayerOnAction = false;
                }
            }
            stopOctaveButton.childButtons = stopOctavesChildren;
            octavesChildren.push(stopOctaveButton)
        }
        octavesButton.childButtons = octavesChildren;

        let addPianoButton = this.configDefaultButton(new AddPianoButton(gl, statics.textures.newPiano, this.owningPianoManager));
        let deletePianoButton = this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "delete", this));
        deletePianoButton.childButtons = 
        [
            this.configDefaultButton(new DeletePianoButton(gl, statics.textures.blankCircle, this.owningPianoManager)),
            this.configDefaultButton(new TexturedTextButton(gl, statics.textures.blankCircle, "no", this))
        ]

        let Layer1Buttons = [
            octavesButton,
            scalesButton,
            addPianoButton,
            deletePianoButton,
        ]

        this.openButton.childButtons = Layer1Buttons;
    }

    handleOctaveClicked_start(start_num_str)
    {
        let currentStart = this.pianoNode.piano.baseOctave;
        let currentEnd = this.pianoNode.piano.octaves + currentStart;

        let newStart = parseInt(start_num_str)
        let newEnd = currentEnd;

        if(newStart >= newEnd)
        {
            newStart = newEnd - 1;
        }

        this.pianoNode.piano.setOctaveRange(newStart, newEnd);
        this.pianoNode.makeDirty();
        this.requestLayoutRefreshDelegate.dispatchEvent(new Event("requestLayoutRefresh"));
    }

    handleOctaveClicked_end(end_num_str)
    {
        let currentStart = this.pianoNode.piano.baseOctave;

        let newStart = currentStart;
        let newEnd = parseInt(end_num_str);

        if(newStart > newEnd)
        {
            newEnd += 1;
        }

        this.pianoNode.piano.setOctaveRange(newStart, newEnd);
        this.pianoNode.makeDirty();
        this.requestLayoutRefreshDelegate.dispatchEvent(new Event("requestLayoutRefresh"));
    }


    render(viewMat, perspectiveMat)
    {
        this.requestClean();
        super.render(perspectiveMat, viewMat); //notice flipping of matrices; I should have been consistent. :\
    }

}

/**
 * Creates a module scope collection of piano managers. This means piano managers can create
 * more piano managers on the fly and not need to worry about maintaining a reference to the piano.
 * Piano managers have the ability to delete themselves via settings which will remove them from this collection
 * 
 */
class ModulePianoManagerCollection
{
    constructor()
    {
        console.log("Creating module-level piano manager collection");
        this.glcanvas_to_pianoManagers = new Map();
    }

    notifyPianoManagerCreated(glCanvas, pianoManager)
    {
        if(!this.glcanvas_to_pianoManagers.has(glCanvas))
        {
            this.glcanvas_to_pianoManagers.set(glCanvas, []);
        }

        let pianoManagerSet = this.glcanvas_to_pianoManagers.get(glCanvas);
        if(!pianoManagerSet.includes(pianoManager))
        {
            pianoManagerSet.push(pianoManager);
        }
    }
    notifyRequestDeletePianoManager(glCanvas, pianoManager)
    {
        //#todo this should probably alert all statics to stop listening to events for this manager; otherwise we have dangling pointers
        if(!this.glcanvas_to_pianoManagers.has(glCanvas))
        {
            console.log("trying to delete piano manager but no piano manager for provided glCanvas");
            return;
        }

        let pianoManagerList = this.glcanvas_to_pianoManagers.get(glCanvas);

        if(pianoManagerList.length <= 1)
        {
            console.log("delete aborted, last piano.");
            return;
        }

        if(pianoManagerList.includes(pianoManager))
        {
            let filterOutValue = function(item) 
            {
                return item != pianoManager;
            };
            let newList = pianoManagerList.filter(filterOutValue);
            this.glcanvas_to_pianoManagers.set(glCanvas, newList);
            pianoManager.notifyDeleted();
        }
    }

    render(glCanvas, viewMat, perspectiveMat)
    {
        let pianoManagers = this.glcanvas_to_pianoManagers.get(glCanvas);
        if(pianoManagers)
        {
            for(const pianoManager of pianoManagers)
            {
                pianoManager.render(viewMat, perspectiveMat);
            }
        }
    }
}
let pianoManagers = new ModulePianoManagerCollection;

/**
 *  #important this is the ideal way to manager piano managers. Just create one and let it add itself to this set.
 *  Then, just render this set. Your piano managers will be able to spawn new piano managers and delete themselves (if there's more than 1)
 */
export function getPianoManagerCollection()
{
    return pianoManagers;
}

export class PianoManager extends SceneNode
{
    constructor(gl, glCanvas, piano, camera)
    {
        super();

        this.gl = gl;
        this.glCanvas = glCanvas;
        this.camera = camera;

        if (!glCanvas || !camera) { console.log("Did not proved required parameters to PianoManager")}
        if (piano == null){ piano = new Piano(gl, "../shared_resources/Sounds/PianoKeySounds/", 2);}

        this.dragwidget = new DragWidgetTextured(gl, true, glCanvas, camera);
        this.dragwidget.setParent(this); 

        this.pianoNode = new PianoNode(gl, glCanvas, piano, camera);
        this.pianoNode.setParent(this);
        this.pianoNode.setLocalScale(vec3.fromValues(0.5, 0.5, 0.5));

        this.pianoSettings = new PianoSettingsWidget(gl, glCanvas, this.pianoNode, this);
        this.pianoSettings.setParent(this);
        this.pianoSettings.requestLayoutRefreshDelegate.addEventListener("requestLayoutRefresh", this._requestLayoutUpdate.bind(this));

        this._updateLayout();

        //add piano to a static set of piano managers to be tracked
        pianoManagers.notifyPianoManagerCreated(glCanvas, this);
    }

    _requestLayoutUpdate()
    {
        //clean everything just in case.
        this.dragwidget.requestClean();
        this.pianoNode.requestClean();
        this.pianoSettings.requestClean();

        this._updateLayout();
    }

    _updateLayout()
    {
        //objects are based on unit cubes; therefore untransformed widths/heights are 1
        let objectSpacing = 0.1;
        let xUnit = vec4.fromValues(1,0,0,0);

        let dragXform = this.dragwidget.getLocalModelMat();
        let dragWidthVec = vec4.transformMat4(vec4.create(), xUnit, dragXform);
        let dragWidgetWidth = vec4.length(dragWidthVec);

        // let pianoScale = this.pianoNode.getLocalScale(vec3.create());
        // let pianoScaledWidth = this.pianoNode.piano.width * pianoScale[0];
        let pianoLocalMat = this.pianoNode.getLocalModelMat();
        let pianoWidthVec = vec4.fromValues(this.pianoNode.piano.width, 0, 0, 0);
        vec4.transformMat4(pianoWidthVec, pianoWidthVec, pianoLocalMat);
        let pianoScaledWidth = pianoWidthVec[0];

        let settingsIconWidth = this.pianoSettings.openButton.getButtonRadius();

        // this.pianoNode.setLocalPosition(vec3.fromValues(dragWidgetWidth, 0, 0));
        this.pianoNode.setLocalPosition(vec3.fromValues(dragWidgetWidth/2 + pianoScaledWidth/2 + objectSpacing, 0, 0));

        this.pianoSettings.setLocalPosition(vec3.fromValues(dragWidgetWidth/2 + objectSpacing 
                                                            + pianoScaledWidth + objectSpacing 
                                                            + settingsIconWidth / 2 + 0.075, 0, 0)); //extra space because of illusion of more space created from depad arrows
        
    }

    notifyDeleted()
    {
        this.pianoNode.notifyDeleted();
        this.pianoSettings.notifyDeleted();
        this.dragwidget.notifyDeleted();
    }

    render(viewMat, perspectiveMat)
    {
        this.requestClean();

        this.dragwidget.render(viewMat, perspectiveMat);
        this.pianoNode.render(viewMat, perspectiveMat);
        this.pianoSettings.render(viewMat, perspectiveMat);
    }
}