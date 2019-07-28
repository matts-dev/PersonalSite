import * as EmeraldUtils from "../shared_resources/EmeraldUtils/emerald-opengl-utils.js"
import * as key from "../shared_resources/EmeraldUtils/browser_key_codes.js"
import {Camera} from "../shared_resources/EmeraldUtils/emerald-opengl-utils.js"
import {vec2, vec3, vec4, mat4} from "../shared_resources/gl-matrix_esm/index.js"
import {RenderBox3D, GlyphRenderer} from "../shared_resources/EmeraldUtils/BitmapFontRendering.js"
import * as BMF from "../shared_resources/EmeraldUtils/BitmapFontRendering.js"
import { Montserrat_BMF } from "../shared_resources/EmeraldUtils/Montserrat_BitmapFontConfig.js";



//////////////////////////////////////////////////////
//module level statics
//////////////////////////////////////////////////////
var game = null;


//////////////////////////////////////////////////////
// Shaders
//////////////////////////////////////////////////////
const basicVertSrc =
`
    attribute vec4 vertPos;
    attribute vec3 vertNormal;
    attribute vec2 texUVCoord;

    uniform mat4 model;
    uniform mat4 view_model;
    uniform mat4 normalMatrix; //the inverse transpose of the view_model matrix
    uniform mat4 projection;

    //notice the use of highp instead of lowp
    varying highp vec2 uvCoord; //this is like an out variable in opengl3.3+
    varying highp vec3 lightingColor;

    void main(){
        gl_Position = projection * view_model * vertPos;
        uvCoord = texUVCoord;

        highp vec3 ambient = vec3(0.3,0.3,0.3);
        highp vec3 dirLightColor = vec3(1,1,1);
        highp vec3 dirLight_dir = normalize(vec3(0.85, 0.8, 0.75));
        highp vec4 transformedNormal = normalize(normalMatrix * vec4(vertNormal, 1.0));

        highp float directionalIntensity = max(dot(transformedNormal.xyz, dirLight_dir), 0.0);
        lightingColor = ambient + (dirLightColor * directionalIntensity);
    }
`;

const basicFragSrc = `
    varying highp vec2 uvCoord;
    varying highp vec3 lightingColor;
    
    uniform sampler2D diffuseTexSampler;

    void main(){
        highp vec4 textureColor = texture2D(diffuseTexSampler, uvCoord);
        gl_FragColor = vec4(textureColor.rgb * lightingColor, textureColor.a);
    }
`;

const quad2DVertSrc = 
`
    attribute vec2 vertPos;
    attribute vec2 texUVCoord;

    uniform mat4 model;

    varying highp vec2 uvCoord; //this is like an out variable in opengl3.3+

    void main(){
        gl_Position = model * vec4(vertPos, 0, 1);
        uvCoord = texUVCoord;
    }
`;
const quad2DFragSrc = 
`
    varying highp vec2 uvCoord;
    
    uniform sampler2D diffuseTexSampler;

    void main(){
        gl_FragColor = texture2D(diffuseTexSampler, uvCoord);
    }
`;

const quad3DVertSrc =
`
    attribute vec4 vertPos;
    attribute vec2 texUVCoord;

    uniform mat4 model;
    uniform mat4 view_model;
    uniform mat4 projection;

    varying highp vec2 uvCoord;

    void main(){
        gl_Position = projection * view_model * vertPos;
        uvCoord = texUVCoord;
    }
`;

const quad3DFragSrc = `
    uniform sampler2D diffuseTexSampler;
    varying highp vec2 uvCoord;

    void main(){
        gl_FragColor = texture2D(diffuseTexSampler, uvCoord);
        if(gl_FragColor.a == 0.0) {
            discard;
        }
    }
`;

//////////////////////////////////////////////////////
// Base Game Class
//////////////////////////////////////////////////////
class Game
{
    constructor(glCanvasId = "#glCanvas")
    {
        this.glCanvas = document.querySelector(glCanvasId);
        this.gl = this.glCanvas.getContext("webgl");
        this.prevFrameTimestampSec = 0;

        this.inputMonitor = new key.InputMonitor();
        // this.camera = new Camera(vec3.fromValues(1,1,0), vec3.fromValues(0,0,-1));
        this.camera = new Camera(vec3.fromValues(0.5,1.155,-4), vec3.fromValues(0,0,-1));

        this.boundGameLoop = this.gameLoop.bind(this);

        this.buffers = this._createBuffers(this.gl);
        this.textures = this._createTextures(this.gl);
        this.shaders = this._createShaders(this.gl);

        ////////////////////////////////////////////////////////////////////
        //below this are things that are specific to this module and shouldn't be factored into a generic Game class
        this.lineRenderer = new EmeraldUtils.LineRenderer(this.gl);
        this.focusedRenderBox = new RenderBox3D(vec3.fromValues(0.0, 0.8, 0), 0.1, 0.1);
        // this.focusedRenderBox = new RenderBox3D(vec3.fromValues(0.0, 0.0, 0), 1.0, 1.0);
        this.testGlyphRenderer = new GlyphRenderer(
            this.gl, 
            BMF.createGlyphShader(this.gl),
            // this.textures.grass.glTextureId,
            this.textures.montserratFont,
            vec2.fromValues(0.0, 0.8), 0.1, 0.1
            // vec2.fromValues(0.0, 0.0), 1.0, 1.0
            );
        
        this.bitmapFont = new Montserrat_BMF(this.gl, "../shared_resources/Textures/Fonts/Montserrat_ss_alpha_1024x1024_wb.png");
        // this.bitmapFont = new Montserrat_BMF(this.gl, "../shared_resources/Grass2.png");
        this.testGlyphRenderer = this.bitmapFont.getGlyphFor("K");
        
        this.testGlyphs = ["a","b","c","d","e","f","h","g","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","0","1","2","3","4","5","6","7","8","9","-","=","!","@","#","$","%","^","&","*","(",")","_","+",";",":","'","\"","[","{","]","}","/","?",".",">",",","<","\\","|","`","~","÷","©","®","ç","â","à","é","è","ê","ë","î","ï","ô","û","ù","ü",];

        // end this module specific code
        ////////////////////////////////////////////////////////////////////

        this._bindCallbacks();
    }

    _createBuffers(gl)
    {
        /////////////////////////////////////////////////
        // Unit Cube
        /////////////////////////////////////////////////
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

        /////////////////////////////////////////////////
        // 2D Quad Specified in 3D
        /////////////////////////////////////////////////
        const quad_PosVBOs = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad_PosVBOs);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.quad3DPositions_pivotBottomLeft), gl.STATIC_DRAW)

        const quad_UVsVBOs = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad_UVsVBOs);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.quadFlippedUVs), gl.STATIC_DRAW)

        const quad_NormalsVBOs = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad_NormalsVBOs);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.quad3DNormals), gl.STATIC_DRAW)

        /////////////////////////////////////////////////
        // Lines using shear trick
        ////////////////////////////////////////////////
        const line_posVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, line_posVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(EmeraldUtils.linePointPositions), gl.STATIC_DRAW);


        //bind null so further operations cannot accidently change current buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return {
            unitCube :  {
                posVBO : unitCube_PosVBO,
                normalVBO : unitCube_NormalsVBO,
                uvVBO : unitCube_UVsVBO,
                EBO : unitCube_EBO,
            },   
            quad3D : {
                posVBO : quad_PosVBOs,
                uvVBO : quad_UVsVBOs,
                noramlVBO : quad_NormalsVBOs,
            },
            line3D : {
                posVBO : line_posVBO
            },
        };
    }

    _createTextures(gl){
        return {
            grass : new EmeraldUtils.Texture(gl, "../shared_resources/Grass2.png"),
            montserratFontWhite : new EmeraldUtils.Texture(gl, "../shared_resources/Montserrat_ss_alpha_white_power2.png"),
            montserratFontBlack : new EmeraldUtils.Texture(gl, "../shared_resources/Montserrat_ss_alpha_black_power2.png"),
            montserratFont : new EmeraldUtils.Texture(gl, "../shared_resources/Textures/Fonts/Montserrat_ss_alpha_1024x1024_wb.png"),
        }
    }

    _createShaders(gl){
        let cubeShader = EmeraldUtils.initShaderProgram(gl, basicVertSrc, basicFragSrc);
        let quad2DShader = EmeraldUtils.initShaderProgram(gl, quad2DVertSrc, quad2DFragSrc);
        let quad3DShader = EmeraldUtils.initShaderProgram(gl, quad3DVertSrc, quad3DFragSrc);

        //TODO perhaps a shader class is appropraite for below?
        return {
            cube : { 
                program : cubeShader,
                attribs : {
                    pos: gl.getAttribLocation(cubeShader, "vertPos"),
                    uv: gl.getAttribLocation(cubeShader, "texUVCoord"),
                    normal: gl.getAttribLocation(cubeShader, "vertNormal"),
                },
                uniforms : {
                    projection : gl.getUniformLocation(cubeShader, "projection"),
                    view_model : gl.getUniformLocation(cubeShader, "view_model"),
                    normalMatrix : gl.getUniformLocation(cubeShader, "normalMatrix"),
                    texSampler : gl.getUniformLocation(cubeShader, "diffuseTexSampler"),
                }
            },
            quad2D : {
                program : quad2DShader,
                attribs : {
                    pos : gl.getAttribLocation(quad2DShader, "vertPos"),
                    uv : gl.getAttribLocation(quad2DShader, "texUVCoord"),
                },
                uniforms : {
                    model      : gl.getUniformLocation(quad2DShader, "model"),
                    texSampler : gl.getUniformLocation(quad2DShader, "diffuseTexSampler"),
                },
            },
            quad3D : {
                program : quad3DShader,
                attribs : {
                    pos : gl.getAttribLocation(quad3DShader, "vertPos"),
                    uv : gl.getAttribLocation(quad3DShader, "texUVCoord"),
                },
                uniforms : {
                    projection : gl.getUniformLocation(quad3DShader, "projection"),
                    view_model : gl.getUniformLocation(quad3DShader, "view_model"),
                    texSampler : gl.getUniformLocation(quad3DShader, "diffuseTexSampler"),
                },
            },
        };
    }

    _bindCallbacks()
    {
        document.addEventListener('keydown', this.handleKeyDown.bind(this), /*useCapture*/ false);
        if(EmeraldUtils.supportPointerLock)
        {
            this.glCanvas.addEventListener("click", this.handleCanvasClicked.bind(this), false);
            EmeraldUtils.configureMultiBrowserPointerLock(this.glCanvas);
            EmeraldUtils.addEventListener_pointerlockchange(this.handlePointerLockChange.bind(this));
        }
    }

    handleKeyDown(event)
    {
        if(event.keyCode == key.up)
        {
            console.log("object handler up pressed");
        }
    }

    handleCanvasClicked()
    {
        this.glCanvas.requestPointerLock();
    }

    handlePointerLockChange()
    {
        this.camera.enableMouseFollow = EmeraldUtils.isElementPointerLocked(this.glCanvas);
    }

    run()
    {
        requestAnimationFrame(this.boundGameLoop);
    }



    gameLoop(nowMS)
    {
        let gl = this.gl;

        let nowTimeSec = (nowMS * 0.001);
        let deltaMs = nowTimeSec - this.prevFrameTimestampSec;
        this.prevFrameTimestampSec = nowTimeSec;
        
        gl.enable(gl.DEPTH_TEST); 
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clearColor(0.0, 0.0, 0.0, 1);
        gl.clearDepth(1.0); //value gl.clear() write to depth buffer; is this default value?
        gl.depthFunc(gl.LEQUAL);  //maybe default,?
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        /////////////////////////////////////
        // TICK
        /////////////////////////////////////
        this.camera.tick(deltaMs);

        /////////////////////////////////////
        // RENDER
        /////////////////////////////////////

        //some of these may be appropriate for camera fields
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        let perspectiveMat = this.camera.getPerspective(aspect);
        let viewMat = this.camera.getView();

        let quad3DLoc = vec3.fromValues(0, 0, -5)

        {//render cubes
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.unitCube.posVBO);
            gl.vertexAttribPointer(this.shaders.cube.attribs.pos, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shaders.cube.attribs.pos);
    
            //see above vertex attribute to understand what parameters are
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.unitCube.uvVBO);
            gl.vertexAttribPointer(this.shaders.cube.attribs.uv, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shaders.cube.attribs.uv);
        
            //enable normal attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.unitCube.normalVBO);
            gl.vertexAttribPointer(this.shaders.cube.attribs.normal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shaders.cube.attribs.normal);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.unitCube.EBO);
            
            //generic matrices
            gl.useProgram(this.shaders.cube.program);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.textures.grass.glTextureId);
            gl.uniform1i(this.shaders.cube.uniforms.texSampler, 0/*0 corresponds to gl.TEXTURE0*/);
            gl.uniformMatrix4fv(this.shaders.cube.uniforms.projection, false, perspectiveMat);
            
            //model dependent matrices
            { //render cube 1
                let translation = vec3.fromValues(3, 0, -7);
                let modelMat = mat4.create();
                mat4.translate(modelMat, modelMat, translation);
                
                let view_model = mat4.multiply(mat4.create(), viewMat, modelMat)
                gl.uniformMatrix4fv(this.shaders.cube.uniforms.view_model, false, view_model);
                
                let normMatrix = mat4.invert(mat4.create(), modelMat);
                mat4.transpose(normMatrix, normMatrix);
                gl.uniformMatrix4fv(this.shaders.cube.uniforms.normalMatrix, false, normMatrix);
                
                gl.drawElements(gl.TRIANGLES, /*vertexCount*/ 36, gl.UNSIGNED_SHORT, /*offset*/0);
            }

            { //render cube at quad location that is very small
                let translation = quad3DLoc;
                let scaleSize = 0.1;
                let scale = vec3.fromValues(scaleSize, scaleSize, scaleSize);
                let modelMat = mat4.create();
                mat4.translate(modelMat, modelMat, translation);
                mat4.scale(modelMat, modelMat, scale);

                
                let view_model = mat4.multiply(mat4.create(), viewMat, modelMat)
                gl.uniformMatrix4fv(this.shaders.cube.uniforms.view_model, false, view_model);
                
                let normMatrix = mat4.invert(mat4.create(), modelMat);
                mat4.transpose(normMatrix, normMatrix);
                gl.uniformMatrix4fv(this.shaders.cube.uniforms.normalMatrix, false, normMatrix);
                
                gl.drawElements(gl.TRIANGLES, /*vertexCount*/ 36, gl.UNSIGNED_SHORT, /*offset*/0);
            }
        }

        let modelMat_text = mat4.create();
        { //render 3d quads
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad3D.posVBO);
            gl.vertexAttribPointer(this.shaders.quad3D.attribs.pos, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shaders.quad3D.attribs.pos);
    
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad3D.uvVBO);
            gl.vertexAttribPointer(this.shaders.quad3D.attribs.uv, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.shaders.quad3D.attribs.uv);
    
            gl.useProgram(this.shaders.quad3D.program);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.textures.montserratFont.glTextureId);
            gl.uniform1i(this.shaders.quad3D.uniforms.texSampler, 0/*0 corresponds to gl.TEXTURE0*/);
            gl.uniformMatrix4fv(this.shaders.quad3D.uniforms.projection, false, perspectiveMat);

            {//render quad 1

                let fontTexture = this.textures.montserratFont;
                let width = fontTexture.srcImage.width === 0 ? 1 :  fontTexture.srcImage.width;
                let height = fontTexture.srcImage.height === 0 ? 1 :  fontTexture.srcImage.height; 
                let aspect = width / height;

                let scale = vec3.fromValues(aspect, 1, 1);

                mat4.translate(modelMat_text, modelMat_text, quad3DLoc);
                mat4.scale(modelMat_text, modelMat_text, scale);
                
                let view_model = mat4.multiply(mat4.create(), viewMat, modelMat_text)
                gl.uniformMatrix4fv(this.shaders.quad3D.uniforms.view_model, false, view_model);
                
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        }

        { //render lines
            // let start = quad3DLoc;//vec3.fromValues(3,3,3);
            // let end = vec3.fromValues(3, 0, -7);
            let color = vec3.fromValues(1,0,0);
            
            // this.lineRenderer.renderLine( start, end, color,viewMat, perspectiveMat);

            //re-configure to current glyph
            this.focusedRenderBox.pos[0] = this.testGlyphRenderer.uvPos[0];
            this.focusedRenderBox.pos[1] = this.testGlyphRenderer.uvPos[1];
            this.focusedRenderBox.width = this.testGlyphRenderer.width;
            this.focusedRenderBox.height = this.testGlyphRenderer.height;
            this.focusedRenderBox._calculatePoints();

            let rbLines = this.focusedRenderBox.toLines();
            for(let line of rbLines)
            {
                //offset renderbox to location of quad
                // line[0] = vec3.add(line[0], line[0], quad3DLoc);
                // line[1] = vec3.add(line[1], line[1], quad3DLoc);

                //transform points by the model matrix of the uv quad
                let pntA = vec4.fromValues(line[0][0], line[0][1], line[0][2], 1);
                let pntB = vec4.fromValues(line[1][0], line[1][1], line[1][2], 1);
                
                vec4.transformMat4(pntA, pntA, modelMat_text);
                vec4.transformMat4(pntB, pntB, modelMat_text);

                line[0][0] = pntA[0];
                line[0][1] = pntA[1];
                line[0][2] = pntA[2];

                line[1][0] = pntB[0];
                line[1][1] = pntB[1];
                line[1][2] = pntB[2];

                this.lineRenderer.renderLine( line[0], line[1], color,viewMat, perspectiveMat);
            }

        }

        {//test glyph renderer
            let modelMat = mat4.create();
            mat4.translate(modelMat, modelMat, vec3.fromValues(0,1.1,-6));
            this.testGlyphRenderer.render(viewMat, perspectiveMat, modelMat);
        }


        requestAnimationFrame(this.boundGameLoop);
    }
}

function main()
{
    game = new Game();
    game.run();
}


main()