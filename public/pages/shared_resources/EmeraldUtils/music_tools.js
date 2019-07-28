import {vec3} from "../gl-matrix_esm/index.js"
import {vec4} from "../gl-matrix_esm/index.js"
import {quat} from "../gl-matrix_esm/index.js"
import {mat4} from "../gl-matrix_esm/index.js"
import * as key from "../EmeraldUtils/browser_key_codes.js";
import * as EmeraldUtils from "./emerald-opengl-utils.js"
import {Transform} from "./emerald-opengl-utils.js"
import { coloredCubeFactory, coloredCubeFactory_pivoted} from "./emerald_easy_shapes.js";


class PianoKey 
{
    constructor(keyXform, isWhiteKey, soundPrefixLocation, keyString, octaveIdx)
    {
        this.xform = keyXform;
        this.isWhiteKey = isWhiteKey;
        this.baseColor = isWhiteKey ? vec3.fromValues(1,1,1) : vec3.fromValues(0,0,0);
        this.colorDecaySpeedSec = 4.0; //over range [0, 1]; 1 being max click color

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
        // this.sound = new EmeraldUtils.Sound("../Sounds/PianoKeySounds/C3.wav");
        this.sound = new EmeraldUtils.Sound( soundPrefixURL + this.keyString + this.octaveString + ".wav");
        // shared_resources\Sounds\PianoKeySounds
    }

    getColor()
    {
        return this.blendColorBuffer;
    }

    press()
    {
        this.pressColorAlpha = 1.0;
        this.sound.play();
    }

    tick(dt_sec)
    {
        if(this.pressColorAlpha > 0.0)
        {
            this.pressColorAlpha -= dt_sec * this.colorDecaySpeedSec;
            this.pressColorAlpha = EmeraldUtils.clamp(this.pressColorAlpha, 0, 1);

            let baseAlpha = 1 - this.pressColorAlpha;
            this.blendColorBuffer[0] = this.baseColor[0] * baseAlpha + this.pressColor[0] * this.pressColorAlpha; 
            this.blendColorBuffer[1] = this.baseColor[1] * baseAlpha + this.pressColor[1] * this.pressColorAlpha; 
            this.blendColorBuffer[2] = this.baseColor[2] * baseAlpha + this.pressColor[2] * this.pressColorAlpha; 
        }
    }
}

let keyNames = [
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
                let keyString = keyNames[keyIdx];
                keyIdx = (keyIdx + 1) % keyNames.length

                keyOffset[0] = whiteKeyOffset * key.whiteKeyOffsets;
                keyOffset[1] = 0;
                keyOffset[2] = 0;
                if(!key.isWhiteKey)
                {
                    keyOffset[0] += (this.keyData.whiteKey.width + this.keyData.spacing / 2.0) - this.keyData.blackKey.width/2;
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
                
                //TODO pass key's octave to ctor and have key generate sound file name
                this.keys.push(new PianoKey(keyXform, key.isWhiteKey, this.soundPrefixLocation, keyString, octave + baseOctave));
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

        //TODO have key object able to play itself?
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