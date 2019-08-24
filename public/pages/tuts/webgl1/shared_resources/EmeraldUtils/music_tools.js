import {vec3} from "../gl-matrix_esm/index.js"
import {vec4} from "../gl-matrix_esm/index.js"
import {quat} from "../gl-matrix_esm/index.js"
import {mat4} from "../gl-matrix_esm/index.js"
import * as key from "../EmeraldUtils/browser_key_codes.js";
import * as EmeraldUtils from "./emerald-opengl-utils.js"
import {Transform} from "./emerald-opengl-utils.js"
import { coloredCubeFactory, coloredCubeFactory_pivoted} from "./emerald_easy_shapes.js";
import {RadialPicker, RadialButton} from "./radial_picker.js";
import { SceneNode } from "./3d_utils.js";





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
        this.scaleNoteColorPerc = 0.5;

        this.blendColorBuffer = vec3.clone(this.baseColor);
        this.pressColorAlpha = 0;
        this.pressColor = vec3.fromValues(1, 0.56, 0.058);

        this.file_path_prefix = "";
        this.keyString = keyString;
        this.octaveString = octaveIdx.toString();
        this.generateSound(soundPrefixLocation);
    }

    generateSound(soundPrefixURL)
    {
        this.sound = new EmeraldUtils.Sound( soundPrefixURL + this.keyString + this.octaveString + ".wav");
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

    press()
    {
        this.pressColorAlpha = 1.0;
        this.sound.play();
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
        this.octaves = numOctaves;

        this.soundPrefixLocation = soundPrefixLocation;
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

        let baseOctave = 3;
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
                
                this.keys.push(new PianoKey(keyXform, key.isWhiteKey, this.soundPrefixLocation, keyString, octave + baseOctave));
                
                if(keyString in this.keyToOctaves)
                    this.keyToOctaves[keyString].push(this.keys[this.keys.length-1]); //append to list
                else
                    this.keyToOctaves[keyString] = [ this.keys[this.keys.length-1] ]; //start list
            }
        }
    }

    _getBaseXform()
    {
        let centerXform = mat4.create();
        mat4.translate(centerXform, centerXform, vec3.fromValues(-this.width / 2, 0.5, 0));

        let baseXform = this.xform.toMat4(mat4.create());
        mat4.mul(baseXform, baseXform, centerXform);

        return baseXform;
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

class PianoSettingsWidget extends SceneNode
{

}

export class PianoManager
{
    constructor(gl, soundPrefixLocation="../shared_resources/Sounds/PianoKeySounds/", numOctaves=2)
    {
        this.dragwidget = new DragWidget(gl);

        this.piano = new Piano(gl, soundPrefixLocation, numOctaves);
        this.piano.setParent(this.dragwidget);

        this.pianoSettings = new PianoSettingsWidget();
        this.pianoSettings.setParent(this.dragwidget);
    }
}