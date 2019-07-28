import {vec3} from "../gl-matrix_esm/index.js"
import {vec4} from "../gl-matrix_esm/index.js"
import {quat} from "../gl-matrix_esm/index.js"
import {mat4} from "../gl-matrix_esm/index.js"
import * as key from "../EmeraldUtils/browser_key_codes.js";
import * as EmeraldUtils from "./emerald-opengl-utils.js"


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Cube
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export class UnitCube3D{
    constructor(gl, shaderVertSrc, shaderFragSrc, uniformList)
    {
        ////////////////////////////////////////
        // buffers
        ////////////////////////////////////////
        const unitCube_PosVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitCube_PosVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.unitCubePositions), gl.STATIC_DRAW);

        const unitCube_NormalsVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitCube_NormalsVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.unitCubeNormals), gl.STATIC_DRAW);

        const unitCube_UVsVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitCube_UVsVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.unitCubeUVs), gl.STATIC_DRAW);

        const unitCube_EBO = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, unitCube_EBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(EmeraldUtils.unitCubeIndices), gl.STATIC_DRAW);

        ///////////////////////////////////////////
        // shaders
        ///////////////////////////////////////////
        let cubeShader = EmeraldUtils.initShaderProgram(gl, shaderVertSrc, shaderFragSrc);

        /////////////////////////////////////////////
        //fields
        /////////////////////////////////////////////
        this.shader = {
            program : cubeShader,
            attribs : {
                pos: gl.getAttribLocation(cubeShader, "vertPos"),
                uv: gl.getAttribLocation(cubeShader, "texUVCoord"),
                normal: gl.getAttribLocation(cubeShader, "vertNormal"),
            },
            uniforms : {
                //populate from list
            }
        }
        //cache all provided uniform locations
        this._populateUniforms(gl, uniformList);

        this.buffers =  {
            posVBO : unitCube_PosVBO,
            normalVBO : unitCube_NormalsVBO,
            uvVBO : unitCube_UVsVBO,
            EBO : unitCube_EBO,
        };
        this.gl = gl;
    }

    _populateUniforms(gl, uniformList)
    {
        for(let uniform of uniformList)
        {
            this.shader.uniforms[uniform] = gl.getUniformLocation(this.shader.program, uniform);
        }
    }

    bindBuffers()
    {
        let gl = this.gl;

        //all shaders are expected to have this attribute, so no if checking to see if shader found its location
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.posVBO);
        gl.vertexAttribPointer(this.shader.attribs.pos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attribs.pos);

        //see above vertex attribute to understand what parameters are
        if(this.shader.attribs.uv >= 0)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uvVBO);
            gl.vertexAttribPointer(this.shader.attribs.uv, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shader.attribs.uv);
        }
    
        //enable normal attribute
        if(this.shader.attribs.normal >= 0)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normalVBO);
            gl.vertexAttribPointer(this.shader.attribs.normal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shader.attribs.normal);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.EBO);
        
    }

    /*
        @param GL_TEXTURE_NUM : eg "gl.TEXTURE0"
    */
    bindTexture(GL_TEXTURE_NUM /*= this.gl.TEXTURE0*/, glTextureId, shaderUniformName, )
    {
        this.gl.useProgram(this.shader.program);
        this.gl.activeTexture(GL_TEXTURE_NUM);
        this.gl.bindTexture(this.gl.TEXTURE_2D, glTextureId);
        this.gl.uniform1i(this.shader.uniforms[shaderUniformName], GL_TEXTURE_NUM - this.gl.TEXTURE0/*0 corresponds to gl.TEXTURE0*/);
    }

    /* This method assumes you have aquired this cube's shader and configured its uniforms*/
    render()
    {
        let gl = this.gl;
        gl.drawElements(gl.TRIANGLES, /*vertexCount*/ 36, gl.UNSIGNED_SHORT, /*offset*/0);
    }

    deleteBuffers()
    {
        let gl = this.gl;

        gl.deleteBuffers(this.buffers.posVBO);
        gl.deleteBuffers(this.buffers.normalVBO);
        gl.deleteBuffers(this.buffers.uvVBO);
        gl.deleteBuffers(this.buffers.EBO);
    }
}


//////////////////////////////
// Unit cube that projects out of origin
//////////////////////////////


export const unitCubePositionsPivot = [
    // Front face
     0.0,  0.0,  -1.0,
     1.0,  0.0,  -1.0,
     1.0,  -1.0,  -1.0,
     0.0,  -1.0,  -1.0,
    
    // Back face
     0.0,  0.0,  0.0,
     0.0,  -1.0,  0.0,
     1.0,  -1.0,  0.0,
     1.0,  0.0,  0.0,
    
    // Top face
     0.0,  -1.0,  0.0,
     0.0,  -1.0,  -1.0,
     1.0,  -1.0,  -1.0,
     1.0,  -1.0,  0.0,
    
    // Bottom face
     0.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  -1.0,
     0.0,  0.0,  -1.0,
    
    // Right face
     1.0,  0.0,  0.0,
     1.0,  -1.0,  0.0,
     1.0,  -1.0,  -1.0,
     1.0,  0.0,  -1.0,
    
    // Left face
     0.0,  0.0,  0.0,
     0.0,  0.0,  -1.0,
     0.0,  -1.0,  -1.0,
     0.0,  -1.0,  0.0,
  ];

export class PivotUnitCube3D extends UnitCube3D {
    constructor(gl, shaderVertSrc, shaderFragSrc, uniformList)
    {
        super(gl, shaderVertSrc, shaderFragSrc, uniformList);
        gl.deleteBuffer(this.buffers.posVBO);

        const pivotPos_VBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pivotPos_VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unitCubePositionsPivot), gl.STATIC_DRAW);

        //update new attrib
        this.buffers.posVBO = pivotPos_VBO;
        this.shader.attribs.pos = gl.getAttribLocation(this.shader.program, "vertPos");

        this._populateUniforms(gl, uniformList);
    }
}


/////////////////////////////////////////////////////////////////////////////////////
// textured cube factory
////////////////////////////////////////////////////////////////////////////////////

const simpleTexturedShapeShader_vs =
`
    attribute vec4 vertPos;
    attribute vec3 vertNormal;
    attribute vec2 texUVCoord;

    uniform mat4 model;
    uniform mat4 view_model;
    uniform mat4 normalMatrix; //the inverse transpose of the view_model matrix
    uniform mat4 projection;

    varying highp vec2 uvCoord; //this is like an out variable in opengl3.3+

    void main(){
        gl_Position = projection * view_model * vertPos;
        uvCoord = texUVCoord;
    }
`;

const simpleTexturedShapeShader_fs = `
    varying highp vec2 uvCoord;
    uniform sampler2D texSampler;

    void main(){
        gl_FragColor = texture2D(texSampler, uvCoord);
    }
`;
export function texturedCubeFactory(gl)
{
    let texturedCube = new UnitCube3D(gl,
        simpleTexturedShapeShader_vs, simpleTexturedShapeShader_fs,
        ["projection", "view_model", "normalMatrix", "texSampler"]);

    texturedCube.updateShader = function(cubePosition, viewMat, projectionMat){
        let gl = this.gl;

        gl.useProgram(this.shader.program);
        let modelMat = mat4.create();
        mat4.translate(modelMat, modelMat, cubePosition);
        
        let view_model = mat4.multiply(mat4.create(), viewMat, modelMat)
        gl.uniformMatrix4fv(this.shader.uniforms.view_model, false, view_model);
        
        let normMatrix = mat4.invert(mat4.create(), modelMat);
        mat4.transpose(normMatrix, normMatrix);
        gl.uniformMatrix4fv(this.shader.uniforms.normalMatrix, false, normMatrix);

        //this step shouldn't be done for every cube
        gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
    }

    return texturedCube;
}

//example usage
/*
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let perspectiveMat = this.camera.getPerspective(aspect);
        let viewMat = this.camera.getView();

        this.texturedCubeTest.bindBuffers();
        this.texturedCubeTest.bindTexture(gl.TEXTURE0, this.textures.grass.glTextureId, this.texturedCubeTest.shader.uniforms.texSampler);
        this.texturedCubeTest.updateShader(vec3.fromValues(1, 1, -9), viewMat, perspectiveMat);
        this.texturedCubeTest.render();

*/

/////////////////////////////////////////////////////////////////////////////////////
// colored cube factory
////////////////////////////////////////////////////////////////////////////////////

const simpleColoredCube_vs =
`
    attribute vec4 vertPos;
    attribute vec3 vertNormal;
    attribute vec2 texUVCoord;

    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;

    void main(){
        gl_Position = projection * view * model * vertPos;
    }
`;

const simpleColoredCube_fs = `
    varying highp vec2 uvCoord;

    uniform highp vec3 color;

    void main(){
        gl_FragColor = vec4(color, 1.0);
    }
`;
export function coloredCubeFactory(gl)
{
    let colorCube = new UnitCube3D(gl,
        simpleColoredCube_vs, simpleColoredCube_fs,
        ["projection", "view", "model", "normalMatrix", "color"]);

    colorCube.updateShader = function(modelMat, viewMat, projectionMat, color){
        let gl = this.gl;

        gl.useProgram(this.shader.program);
        
        gl.uniform3f(this.shader.uniforms.color, color[0], color[1], color[2]);
        gl.uniformMatrix4fv(this.shader.uniforms.model, false, modelMat);
        gl.uniformMatrix4fv(this.shader.uniforms.view, false, viewMat);
        gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
    }

    return colorCube;
}

export function coloredCubeFactory_pivoted(gl)
{
    let colorCube = new PivotUnitCube3D(gl,
        simpleColoredCube_vs, simpleColoredCube_fs,
        ["projection", "view", "model", "normalMatrix", "color"]);

    colorCube.updateShader = function(modelMat, viewMat, projectionMat, color){
        let gl = this.gl;

        gl.useProgram(this.shader.program);
        
        gl.uniform3f(this.shader.uniforms.color, color[0], color[1], color[2]);
        gl.uniformMatrix4fv(this.shader.uniforms.model, false, modelMat);
        gl.uniformMatrix4fv(this.shader.uniforms.view, false, viewMat);
        gl.uniformMatrix4fv(this.shader.uniforms.projection, false, projectionMat);
    }

    return colorCube;
}

//eample usage
/*
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let perspectiveMat = this.camera.getPerspective(aspect);
        let viewMat = this.camera.getView();

        let coloredCubeModel = mat4.create();
        mat4.translate(coloredCubeModel, coloredCubeModel, vec3.fromValues(-1, 1, -7));
        let cubeColor = vec3.fromValues(1,0,0);

        this.coloredCube.bindBuffers();
        this.coloredCube.updateShader(coloredCubeModel, viewMat, perspectiveMat, cubeColor);
        this.coloredCube.render();
*/
