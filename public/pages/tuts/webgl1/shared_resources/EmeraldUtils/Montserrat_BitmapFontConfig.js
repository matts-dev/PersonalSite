// import * as BMF from "./BitmapFontRendering.js"
import {BitmapFont, GlyphRenderer} from "./BitmapFontRendering.js";
import {vec3} from "../gl-matrix_esm/index.js";

export class Montserrat_BMF extends BitmapFont
{
    constructor(glContext, textureURL)
    {
        super(glContext, textureURL);

        this._configureGlyphTable();
        this._configured = false;
    }

    _configureGlyphTable()
    {
        if(this._configured)
        {
            console.log("_configureGlyphTable called, but table already configured" );
            return;
        }
        this._configured = true;

        //steps to mapping characters:
        //1. align bottom left corner
        //2. align width
        //3. align height
        //4. align baseline offset (for letters like g, p, q, where part of letter goes below baseline)
        //starting point: new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.78, 0.965), 0.025, 0.025); 

        //this method should only ever be called once
        this._glyphTable["a"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7835, 0.966), 0.0155, 0.0169); 
        this._glyphTable["b"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.806, 0.966), 0.0182, 0.02275); 
        this._glyphTable["c"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0122, 0.927), 0.0165, 0.0169); 
        this._glyphTable["d"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.074, 0.927), 0.0182, 0.02275); 
        this._glyphTable["e"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1215, 0.927), 0.0165, 0.0169); 
        this._glyphTable["f"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1420, 0.927), 0.0128, 0.0234); 
        this._glyphTable["g"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.157, 0.921), 0.0174, 0.0234); 
        this._glyphTable["h"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1823, 0.927), 0.0167, 0.0234); 
        this._glyphTable["i"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.205, 0.927), 0.006, 0.0234); 
        this._glyphTable["j"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.213, 0.921), 0.010, 0.0287); 
        this._glyphTable["k"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.230, 0.927), 0.0167, 0.0230); 
        this._glyphTable["l"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2515, 0.927), 0.004, 0.023); 
        this._glyphTable["m"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.263, 0.927), 0.028, 0.017); 
        this._glyphTable["n"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2985, 0.927), 0.0158, 0.017); 
        this._glyphTable["o"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3205, 0.927), 0.0177, 0.017); 
        this._glyphTable["p"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3443, 0.921), 0.0175, 0.0235); 
        this._glyphTable["q"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3667, 0.921), 0.0175, 0.0235); 
        this._glyphTable["r"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3922, 0.927), 0.010, 0.017); 
        this._glyphTable["s"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4058, 0.927), 0.014, 0.017); 
        this._glyphTable["t"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.442, 0.927), 0.0115, 0.021); 
        this._glyphTable["u"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4595, 0.927), 0.016, 0.017); 
        this._glyphTable["v"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.481, 0.927), 0.017, 0.017); 
        this._glyphTable["w"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.501, 0.927), 0.0268, 0.017); 
        this._glyphTable["x"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5307, 0.927), 0.016, 0.017); 
        this._glyphTable["y"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5485, 0.921), 0.0184, 0.0287); 
        this._glyphTable["z"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5707, 0.927), 0.014, 0.017); 
        this._glyphTable["A"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.01125, 0.966), 0.0227, 0.0215); 
        this._glyphTable["B"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0395, 0.966), 0.0195, 0.0215); 
        this._glyphTable["C"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0641, 0.966), 0.0195, 0.02155); 
        this._glyphTable["D"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.14125, 0.966), 0.0205, 0.02155); 
        this._glyphTable["E"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1965, 0.966), 0.017, 0.0218); 
        this._glyphTable["F"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2202, 0.966), 0.017, 0.0218); 
        this._glyphTable["G"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.241, 0.966), 0.0205, 0.0218); 
        this._glyphTable["H"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.27, 0.966), 0.0185, 0.0218); 
        this._glyphTable["I"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2975, 0.966), 0.0038, 0.0218); 
        this._glyphTable["J"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3065, 0.966), 0.0134, 0.0218); 
        this._glyphTable["K"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3365, 0.966), 0.0234, 0.0218); 
        this._glyphTable["L"] = null;
        this._glyphTable["M"] = null;
        this._glyphTable["N"] = null;
        this._glyphTable["O"] = null;
        this._glyphTable["P"] = null;
        this._glyphTable["Q"] = null;
        this._glyphTable["R"] = null;
        this._glyphTable["S"] = null;
        this._glyphTable["T"] = null;
        this._glyphTable["U"] = null;
        this._glyphTable["V"] = null;
        this._glyphTable["W"] = null;
        this._glyphTable["X"] = null;
        this._glyphTable["Y"] = null;
        this._glyphTable["Z"] = null;
        
        //numeric row
        this._glyphTable["0"] = null;
        this._glyphTable["1"] = null;
        this._glyphTable["2"] = null;
        this._glyphTable["3"] = null;
        this._glyphTable["4"] = null;
        this._glyphTable["5"] = null;
        this._glyphTable["6"] = null;
        this._glyphTable["7"] = null;
        this._glyphTable["8"] = null;
        this._glyphTable["9"] = null;
        this._glyphTable["-"] = null;
        this._glyphTable["="] = null; 

        //numeric row + shift
        this._glyphTable["!"] = null;
        this._glyphTable["@"] = null;
        this._glyphTable["#"] = null;
        this._glyphTable["$"] = null;
        this._glyphTable["%"] = null;
        this._glyphTable["^"] = null;
        this._glyphTable["&"] = null;
        this._glyphTable["*"] = null;
        this._glyphTable["("] = null;
        this._glyphTable[")"] = null;
        this._glyphTable["_"] = null;
        this._glyphTable["+"] = null;
        
        //symbols within keyboard letters
        this._glyphTable[";"] = null;
        this._glyphTable[":"] = null;
        this._glyphTable["'"] = null;
        this._glyphTable["\""] = null;
        this._glyphTable["["] = null;
        this._glyphTable["{"] = null;
        this._glyphTable["]"] = null;
        this._glyphTable["}"] = null;
        this._glyphTable["/"] = null;
        this._glyphTable["?"] = null;
        this._glyphTable["."] = null;
        this._glyphTable[">"] = null;
        this._glyphTable[","] = null;
        this._glyphTable["<"] = null;
        this._glyphTable["\\"] = null;
        this._glyphTable["|"] =  null;
        this._glyphTable["`"] =  null; //backtick (beside 1)
        this._glyphTable["~"] =  null;

        //mathematical symbols
        this._glyphTable["÷"] = null;

        //symbols
        this._glyphTable["©"] =  null;
        this._glyphTable["®"] =  null;

        //accents
        this._glyphTable["ç"] = null;
        this._glyphTable["â"] = null;
        this._glyphTable["à"] = null;
        this._glyphTable["é"] = null;
        this._glyphTable["è"] = null;
        this._glyphTable["ê"] = null;
        this._glyphTable["ë"] = null;
        this._glyphTable["î"] = null;
        this._glyphTable["ï"] = null;
        this._glyphTable["ô"] = null;
        this._glyphTable["û"] = null;
        this._glyphTable["ù"] = null;
        this._glyphTable["ü"] = null;
        //there exists more accent than these
    }

}