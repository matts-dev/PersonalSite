import {vec3, mat4} from "../gl-matrix_esm/index.js"
import {initShaderProgram, Texture, Transform} from "./emerald-opengl-utils.js"
import { SceneNode } from "./3d_utils.js";



//////////////////////////////////////////////////////////////////////////////////////
// shaders
//////////////////////////////////////////////////////////////////////////////////////

export const glyphShader_vs =
`
    attribute vec4 vertPos;
    attribute vec2 texUVCoord;

    uniform mat4 projection;
    uniform mat4 view;
    uniform mat4 model;

    //-1.0 flips, 1.0 does not flip
    uniform float flipV;

    varying highp vec2 uvCoord;

    void main(){
        gl_Position = projection * view * model * vertPos;
        uvCoord = texUVCoord;
        uvCoord.y = uvCoord.y * flipV;
    }
`;

export const glyphShader_fs = `
    uniform sampler2D texture0;
    uniform highp vec3 color;

    varying highp vec2 uvCoord;

    void main(){
        gl_FragColor = texture2D(texture0, uvCoord);
        gl_FragColor = gl_FragColor * vec4(color, 1.0);
        if(gl_FragColor.a == 0.0) {
            discard;
        }
    }
`;

export function createGlyphShader(gl)
{
    let shaderProgram = initShaderProgram(gl, glyphShader_vs, glyphShader_fs);

    return {
        program : shaderProgram,
        attribs : {
            pos: gl.getAttribLocation(shaderProgram, "vertPos"),
            uv: gl.getAttribLocation(shaderProgram, "texUVCoord"),
        },
        uniforms :
        {
            projection : gl.getUniformLocation(shaderProgram, "projection"),
            view : gl.getUniformLocation(shaderProgram, "view"),
            model : gl.getUniformLocation(shaderProgram, "model"),
            texSampler : gl.getUniformLocation(shaderProgram, "texture0"),
            flipV : gl.getUniformLocation(shaderProgram, "flipV"),
            color : gl.getUniformLocation(shaderProgram, "color"),
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////
// vert data
//////////////////////////////////////////////////////////////////////////////////////

//quad indices
// 2---3
// | \ |
// 0---1
export const quadIndices = [
    0, 1, 2,        1, 3, 2,
]


export const quad3DPositions_idx = [
    0.0,0.0,0.0,    1.0,0.0,0.0,    0.0,1.0,0.0,   1.0,1.0,0.0
];
export const quad2DPositions_idx = [
    0.0,0.0,     1.0,0.0,     1.0,0.0,    1.0,1.0 
];


//////////////////////////////////////////////////////////////////////////////////////
// Glyph classes
//////////////////////////////////////////////////////////////////////////////////////

export class UVRenderBox
{
    /** uv pos is bottom-left aligned */
    constructor(uvPos, width, height)
    {
        this.pos = uvPos;
        this.width = width;
        this.height = height;
    }    
}

export class Glyph
{
    constructor()
    {
        //TODO make this the actual glyph, and have the renderer use this data instead
    }

}

//information on idiomatic ways of achiving enums in JS
//https://stackoverflow.com/questions/44447847/enums-in-javascript-with-es6
export const VAlignment = Object.freeze({
    TOP:   Symbol("top"),
    CENTER:  Symbol("center"),
    BOTTOM: Symbol("bottom")
});
export const HAlignment = Object.freeze({
    LEFT:   Symbol("left"),
    CENTER:  Symbol("center"),
    RIGHT: Symbol("right")
});

export class BitmapTextblock3D
{
    constructor(gl, bitMapFont, startText="", x=0, y=0, z=0)
    {
        this.gl = gl;
        this.bitMapFont = bitMapFont;
        this.text = startText;

        this.xform = new Transform();
        this.xform.pos = vec3.fromValues(x, y, z); 
        this.xform.scale = vec3.fromValues(1,1,1);
        this.parentModelMat = null;

        this.hAlignment = HAlignment.RIGHT;
        this.vAlignment = VAlignment.BOTTOM;
        this.localWidth = 0;

        //setup
        this.calculateLocalWidth();
    }

    //call this if tweaking any values regarding the font; this is the function resolve any "dirty" state about the bitmap font.
    refreshState()
    {
        this.calculateLocalWidth();
    }

    render(projection, view)
    {
        //this isn't the fastest text renderer as it renders each glyph separating rather than
        //caching them within a texture and rendering that texture each time.
        if(this.text)
        {
            let width_so_far = 0;

            //calculate width for pivot matrix
            for(let char_idx = 0; char_idx < this.text.length; ++char_idx)
            {
                let glyph = this.bitMapFont.getGlyphFor(this.text.charAt(char_idx));
                width_so_far += glyph.width;
            }

            let sizeReferenceGlyph = this.bitMapFont.getGlyphFor("A");

            let pivotMatrix = mat4.create();
            let pivotPos = vec3.fromValues(0,0,0);

            //BEFORE CHANING PIVOT ALIGNMENT: right alight means the cursor appears on the right; left align means
            //the cursor is on the left. Top align means an imaginary cursor would be on top. So, a left algined
            //text will actually have a pivot point on the right (think about: the text grows towards the right; where's the stationary point?)
            let hAlignFactor = 0.0;
            if      (this.hAlignment == HAlignment.LEFT)    { hAlignFactor = -1.0;}
            else if (this.hAlignment == HAlignment.CENTER)  { hAlignFactor = -0.5;} //move by half length

            let vAlignFactor = 0.0;
            if      (this.vAlignment == VAlignment.TOP)     { vAlignFactor = -1.0;}
            else if (this.vAlignment == VAlignment.CENTER)  { vAlignFactor = -0.5;} //move by half length
            pivotPos[0] = width_so_far * hAlignFactor;
            pivotPos[1] = sizeReferenceGlyph.height * vAlignFactor;
            mat4.translate(pivotMatrix, pivotMatrix, pivotPos);

            let sceneModelMat = mat4.create();
            if(this.parentModelMat)
            {
                mat4.mul(sceneModelMat, this.parentModelMat, sceneModelMat); 
            }
            let textBlockModelMat = this.xform.toMat4(mat4.create());
            mat4.mul(sceneModelMat, sceneModelMat, textBlockModelMat);

            //transform bitmap to parent space with pivot correction
            mat4.mul(sceneModelMat, sceneModelMat, pivotMatrix);

            let glyphPos = vec3.fromValues(0,0,0);
            let x_offset = 0;
            for(let char_idx = 0; char_idx < this.text.length; ++char_idx)
            {
                let glyph = this.bitMapFont.getGlyphFor(this.text.charAt(char_idx));
                glyphPos[0] = x_offset;
                glyphPos[1] = glyph.baselineOffsetY;
                x_offset += glyph.width; //be sure add width after we've calculated start pos

                let glyphModelMat = mat4.create();
                mat4.translate(glyphModelMat, glyphModelMat, glyphPos);

                //transform bitmap to parent space with pivot correction
                mat4.mul(glyphModelMat, sceneModelMat, glyphModelMat);

                glyph.render(view, projection, glyphModelMat);
            }
        }
    }

    calculateLocalWidth()
    {
        if(this.text)
        {
            let width_so_far = 0;
            
            //calculate width for pivot matrix
            for(let char_idx = 0; char_idx < this.text.length; ++char_idx)
            {
                let glyph = this.bitMapFont.getGlyphFor(this.text.charAt(char_idx));
                width_so_far += glyph.width;
            }

            this.localWidth = width_so_far;
        }
        else
        {
            this.localWidth = 0;
        }

    }

    getLocalWidth()
    {
        if(!this.localWidth)
        {
            this.calculateLocalWidth();
        }
        return this.localWidth;
    }
}

export class TextBlockSceneNode extends SceneNode
{
    constructor(gl, font, text)
    {
        super(null);
        this.wrappedText = new BitmapTextblock3D(this.gl, font, text);
        this.wrappedText.hAlignment = HAlignment.CENTER;
        this.wrappedText.vAlignment = VAlignment.CENTER;
        
        this.v_CleanComplete();
        // this.makeDirty();
        // this.requestClean();
    }

    v_CleanComplete()
    {
        if(this.wrappedText)
        {
            this.wrappedText.parentModelMat = this.getWorldMat();
        }
    }

    render(projection, view)
    {
        this.requestClean();
        this.wrappedText.render(projection, view);
    }
    
}

export class GlyphRenderer
{
    /**
     * 
     * @param {*} gl 
     * @param {*} glyphShader 
     * @param {*} fontTextureObj 
     * @param {*} uvPos 
     * @param {*} width 
     * @param {*} height 
     */
    constructor(gl, glyphShader, fontTextureObj, uvPos, width, height, baselineOffsetY=0.0)
    {
        this.gl = gl;
        this.glyphShader = glyphShader;
        this.fontTextureObj = fontTextureObj;
        this.uvPos = uvPos;
        this.width = width;
        this.height = height;
        this.baselineOffsetY = baselineOffsetY;
        this.color = vec3.fromValues(1,1,1);

        this.buffers = this._createBuffers(gl)
    }

    _createBuffers(gl)
    {
        const posVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posVBO);

        // transform this by scale [0.0,0.0,0.0,    1.0,0.0,0.0,    0.0,1.0,0.0,   1.0,1.0,0.0]
        let correctedPos = [0.0,0.0,0.0,   this.width,0.0,0.0,    0.0,this.height,0.0,   this.width, this.height,0.0]
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(correctedPos), gl.STATIC_DRAW);

        //quad indices
        // 2---3
        // | \ |
        // 0---1
        this.UVs = [
            this.uvPos[0],                  this.uvPos[1],                 //idx 0
            this.uvPos[0] + this.width,     this.uvPos[1],                 //idx 1
            this.uvPos[0],                  this.uvPos[1] + this.height,   //idx 2
            this.uvPos[0] + this.width,     this.uvPos[1] + this.height,   //idx 3
        ];
        const uvVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.UVs), gl.STATIC_DRAW);

        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadIndices), gl.STATIC_DRAW);

        return {
            posVBO : posVBO,
            uvVBO : uvVBO,
            ebo : ebo
        }
    }

    render(view, projection, model)
    {
        //#TODO support color override via uniform
        let gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.posVBO);
        gl.vertexAttribPointer(this.glyphShader.attribs.pos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.glyphShader.attribs.pos);

        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uvVBO);
        gl.vertexAttribPointer(this.glyphShader.attribs.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.glyphShader.attribs.uv);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.ebo);
        
        //generic matrices
        gl.useProgram(this.glyphShader.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fontTextureObj.glTextureId);
        gl.uniform1i(this.glyphShader.uniforms.texSampler, 0/*0 corresponds to gl.TEXTURE0*/);
        
        let renderColor = this.color;
        gl.uniform3f(this.glyphShader.uniforms.color, renderColor[0], renderColor[1], renderColor[2]);
        gl.uniform1f(this.glyphShader.uniforms.flipV, -1.0);
        gl.uniformMatrix4fv(this.glyphShader.uniforms.projection, false, projection);
        gl.uniformMatrix4fv(this.glyphShader.uniforms.view, false, view);
        gl.uniformMatrix4fv(this.glyphShader.uniforms.model, false, model);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, /*offset*/0);
    }
}

/** A rendering utility for rendering a glpy */
export class GlyphInstance
{
    constructor(glyphData)
    {
        this.glyphData = glyphData;
    }
}

/**
 * Notes:
 *  -to make the math easy, font textures are expected to have a size that is a square power of 2; eg 1024 x 1024. Otherwise 
 *     there will be some stretching that will need to be accounted for.
 */
export class BitmapFont
{
    constructor(glContext, textureURL)
    {
        this.gl = glContext;
        this.shader = createGlyphShader(this.gl);
        this.fontTexture = new Texture(this.gl, textureURL);
        this.defaultGlyph = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0, 0.8), 0.1, 0.1); //perhaps should not show anything? Will probably be more useful when debugging to see something
        this._glyphTable = this._createLookupHashTable();
    }

    getGlyphShader(){
        return this.shader;
    }

    getGlyphFor(letter)
    {
        //TODO this should probably return a glyph instance, rather than the actual GlyphRenderer
        let glyph = this._glyphTable[letter];
        if(glyph == null)
        {
            return this.defaultGlyph;
        }
        return glyph
    }

    setFontColor(newColor = vec3.fromValues(1,1,1))
    {
        for(let key in this._glyphTable)
        {
            let glyph = this._glyphTable[key]
            if(glyph)
            {
                glyph.color = newColor;
            }
        }
    }

    _createLookupHashTable()
    {
        //I prefer to create this table upfront with null values, then have subclasses overwrite values.
        //that way, the structure of what this should look like is defined in the base class
        //NOTE: implementing this as a hashtable like map is probably inherently slower than using an array with index structure (where symbol is index)
        return {
            "a" : null,
            "b" : null,
            "c" : null,
            "d" : null,
            "e" : null,
            "f" : null,
            "g" : null,
            "h" : null,
            "i" : null,
            "j" : null,
            "k" : null,
            "l" : null,
            "m" : null,
            "n" : null,
            "o" : null,
            "p" : null,
            "q" : null,
            "r" : null,
            "s" : null,
            "t" : null,
            "u" : null,
            "v" : null,
            "w" : null,
            "x" : null,
            "y" : null,
            "z" : null,

            "A" : null,
            "B" : null,
            "C" : null,
            "D" : null,
            "E" : null,
            "F" : null,
            "G" : null,
            "H" : null,
            "I" : null,
            "J" : null,
            "K" : null,
            "L" : null,
            "M" : null,
            "N" : null,
            "O" : null,
            "P" : null,
            "Q" : null,
            "R" : null,
            "S" : null,
            "T" : null,
            "U" : null,
            "V" : null,
            "W" : null,
            "X" : null,
            "Y" : null,
            "Z" : null,

            //numeric row
            "0" : null,
            "1" : null,
            "2" : null,
            "3" : null,
            "4" : null,
            "5" : null,
            "6" : null,
            "7" : null,
            "8" : null,
            "9" : null,
            "-" : null,
            "=" : null, 

            //numeric row + shift
            "!" : null,
            "@" : null,
            "#" : null,
            "$" : null,
            "%" : null,
            "^" : null,
            "&" : null,
            "*" : null,
            "(" : null,
            ")" : null,
            "_" : null,
            "+" : null,
            
            //symbols within keyboard letters
            ";" : null,
            ":" : null,
            "'" : null,
            "\"" : null,
            "[" : null,
            "{" : null,
            "]" : null,
            "}" : null,
            "/" : null,
            "?" : null,
            "." : null,
            ">" : null,
            "," : null,
            "<" : null,
            "\\" : null,
            "|" : null,
            "`" : null, //backtick (beside 1)
            "~" : null,

            //mathematical symbols
            "÷" : null,

            //symbols
            "©" : null,
            "®" : null,

            //accents
            "ç" : null,          
            "â" : null,
            "à" : null,
            "é" : null,              
            "è" : null,
            "ê" : null,
            "ë" : null,
            "î" : null,
            "ï" : null,
            "ô" : null,
            "û" : null,
            "ù" : null,
            "ü" : null,
            //there exists more accent than these
            
        }


    }



}

export class RenderBox3D 
{
    constructor(bottomLeftPnt, width, height)
    {
        this.pos = bottomLeftPnt;
        this.width = width;
        this.height = height;
        this._calculatePoints();
    }

    _calculatePoints()
    {
        this._BR = vec3.fromValues(this.pos[0] + this.width, this.pos[1],               this.pos[2]);
        this._TR = vec3.fromValues(this.pos[0] + this.width, this.pos[1] + this.height, this.pos[2]);
        this._TL = vec3.fromValues(this.pos[0],              this.pos[1] + this.height, this.pos[2]);
    }

    toLines()
    {
        return [
            [vec3.clone(this.pos), vec3.clone(this._BR)], //bottom line
            [vec3.clone(this.pos), vec3.clone(this._TL)], //left line
            [vec3.clone(this._TL), vec3.clone(this._TR)], //top line
            [vec3.clone(this._BR), vec3.clone(this._TR)], //right line
        ];
    }
}