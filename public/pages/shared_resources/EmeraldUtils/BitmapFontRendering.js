import {vec3} from "../gl-matrix_esm/index.js"
import {initShaderProgram, Texture} from "./emerald-opengl-utils.js"


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
    varying highp vec2 uvCoord;

    void main(){
        gl_FragColor = texture2D(texture0, uvCoord);
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

export class GlyphRenderer
{
    /**
     * 
     * @param {*} gl 
     * @param {*} glyphShader 
     * @param {*} fonTextureObj 
     * @param {*} uvPos 
     * @param {*} width 
     * @param {*} height 
     */
    constructor(gl, glyphShader, fonTextureObj, uvPos, width, height)
    {
        this.gl = gl;
        this.glyphShader = glyphShader;
        this.fontTextureObj = fonTextureObj;
        this.uvPos = uvPos;
        this.width = width;
        this.height = height;

        this.buffers = this._createBuffers(gl)
    }

    _createBuffers(gl)
    {
        const posVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad3DPositions_idx), gl.STATIC_DRAW);

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
        //TODO support color override via uniform
        let gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.posVBO);
        gl.vertexAttribPointer(this.glyphShader.attribs.pos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.glyphShader.attribs.pos);

        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uvVBO);
        gl.vertexAttribPointer(this.glyphShader.attribs.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.glyphShader.attribs.uv);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.ebo);
        
        // //generic matrices
        gl.useProgram(this.glyphShader.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fontTextureObj.glTextureId);
        gl.uniform1i(this.glyphShader.uniforms.texSampler, 0/*0 corresponds to gl.TEXTURE0*/);

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

    render(text)
    {
        //TODO
        let gl = this.gl;
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