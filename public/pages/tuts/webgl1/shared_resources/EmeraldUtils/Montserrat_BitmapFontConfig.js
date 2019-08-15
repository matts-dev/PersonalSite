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
        this._glyphTable["b"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.806, 0.966), 0.018, 0.02275); 
        this._glyphTable["c"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0122, 0.927), 0.0165, 0.0169); 
        this._glyphTable["d"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.074, 0.927), 0.0182, 0.02275); 
        this._glyphTable["e"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1215, 0.927), 0.0165, 0.0169); 
        this._glyphTable["f"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1420, 0.927), 0.0128, 0.0234); 
        this._glyphTable["g"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.157, 0.921), 0.0174, 0.0234, -0.007); 
        this._glyphTable["h"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1823, 0.927), 0.0167, 0.0234); 
        this._glyphTable["i"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.205, 0.927), 0.006, 0.0234); 
        this._glyphTable["j"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.213, 0.921), 0.010, 0.0287, -0.006); 
        this._glyphTable["k"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.230, 0.927), 0.0167, 0.0230); 
        this._glyphTable["l"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2515, 0.927), 0.004, 0.023); 
        this._glyphTable["m"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.263, 0.927), 0.028, 0.017); 
        this._glyphTable["n"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2985, 0.927), 0.0158, 0.017); 
        this._glyphTable["o"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3205, 0.927), 0.0177, 0.017); 
        this._glyphTable["p"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3443, 0.921), 0.0175, 0.0235, -0.006); 
        this._glyphTable["q"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3667, 0.921), 0.0175, 0.0235, -0.006); 
        this._glyphTable["r"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3922, 0.927), 0.010, 0.017); 
        this._glyphTable["s"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4058, 0.927), 0.014, 0.017); 
        this._glyphTable["t"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.442, 0.927), 0.0115, 0.021); 
        this._glyphTable["u"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4595, 0.927), 0.016, 0.017); 
        this._glyphTable["v"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.481, 0.927), 0.017, 0.017); 
        this._glyphTable["w"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.501, 0.927), 0.0268, 0.017); 
        this._glyphTable["x"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5307, 0.927), 0.016, 0.017); 
        this._glyphTable["y"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5485, 0.921), 0.0184, 0.0287, -0.006); 
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
        this._glyphTable["K"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.329, 0.966), 0.018, 0.0218); 
        this._glyphTable["L"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.353, 0.966), 0.016, 0.0218); 
        this._glyphTable["M"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3745, 0.966), 0.02325, 0.0218); 
        this._glyphTable["N"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4065, 0.966), 0.019, 0.0218); 
        this._glyphTable["O"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.432, 0.966), 0.024, 0.0218); 
        this._glyphTable["P"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4625, 0.966), 0.018, 0.0218); 
        this._glyphTable["Q"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4859, 0.962), 0.024, 0.0260, -0.0042); 
        this._glyphTable["R"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.51625, 0.966), 0.018, 0.0218); 
        this._glyphTable["S"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5395, 0.966), 0.0167, 0.0218); 
        this._glyphTable["T"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5817, 0.966), 0.0185, 0.0218); 
        this._glyphTable["U"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.606, 0.966), 0.0184, 0.0218); 
        this._glyphTable["V"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.6295, 0.966), 0.0221, 0.0218); 
        this._glyphTable["W"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.655, 0.966), 0.0323, 0.0218); 
        this._glyphTable["X"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.691, 0.966), 0.02, 0.0218); 
        this._glyphTable["Y"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7136, 0.966), 0.02, 0.0218); 
        this._glyphTable["Z"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.737, 0.966), 0.019, 0.0218); 
        
        //numeric row
        this._glyphTable["0"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.057, 0.771), 0.019, 0.0218); 
        this._glyphTable["1"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.683, 0.81), 0.0088, 0.0218); 
        this._glyphTable["2"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.698, 0.81), 0.017, 0.0218); 
        this._glyphTable["3"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7182, 0.81), 0.0166, 0.0218); 
        this._glyphTable["4"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7395, 0.81), 0.02, 0.0218); 
        this._glyphTable["5"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7625, 0.81), 0.0165, 0.0218); 
        this._glyphTable["6"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7838, 0.81), 0.017, 0.0218); 
        this._glyphTable["7"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.805, 0.81), 0.017, 0.0218); 
        this._glyphTable["8"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0132, 0.771), 0.0172, 0.0218); 
        this._glyphTable["9"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.0352, 0.771), 0.017, 0.0218); 
        
        this._glyphTable["'"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.08, 0.771), 0.006, 0.0225); 
        this._glyphTable["?"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.09, 0.771), 0.016, 0.0218); 
        this._glyphTable["\""] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.121, 0.771), 0.0105, 0.0225); 
        this._glyphTable["!"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.137, 0.771), 0.005, 0.0218); 
        this._glyphTable["("] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.164, 0.765), 0.008, 0.0285, -0.003);  //dropped
        this._glyphTable["%"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.1764, 0.771), 0.024, 0.0218); 
        this._glyphTable[")"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.204, 0.765), 0.008, 0.0285, -0.003); //dropped
        
        this._glyphTable["["] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.22, 0.765), 0.008, 0.0285, -0.003); //dropped
        this._glyphTable["#"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.23075, 0.771), 0.021, 0.0218); 
        this._glyphTable["]"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.255, 0.765), 0.008, 0.0285, -0.003);//dropped
        this._glyphTable["{"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.269, 0.765), 0.01, 0.0285, -0.003); //dropped
        this._glyphTable["@"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2825, 0.765), 0.0295, 0.0285,-0.006); //dropped
        this._glyphTable["}"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3155, 0.765), 0.0105, 0.0285, -0.003); //dropped

        //start here
        this._glyphTable["/"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3288, 0.768), 0.014, 0.029, -0.003); //slight drop
        this._glyphTable["&"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.343, 0.771), 0.0206, 0.0218); 
        this._glyphTable["\\"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.365, 0.768), 0.014, 0.029, -0.003); //slight drop
        this._glyphTable["<"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.3825, 0.771), 0.015, 0.018); 
        this._glyphTable["-"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4028, 0.771), 0.01, 0.01);         
        this._glyphTable["+"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4185, 0.771), 0.0145, 0.0181); 
        this._glyphTable["÷"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.439, 0.771), 0.0146, 0.0182); 
        this._glyphTable["="] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.4808, 0.771), 0.0145, 0.017); 
        this._glyphTable[">"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.501, 0.771), 0.015, 0.018); 

        this._glyphTable["®"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.521, 0.771), 0.0227, 0.0218); 
        this._glyphTable["©"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.549, 0.771), 0.0224, 0.0218); 
        this._glyphTable["$"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5765, 0.767), 0.0168, 0.0295, -0.0035); //dropped
        this._glyphTable[":"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.693, 0.771), 0.005, 0.017); 
        this._glyphTable[";"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7035, 0.7674), 0.005, 0.02, -0.0037); //dropped
        this._glyphTable[","] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.7135, 0.7674), 0.005, 0.009, -0.0045); //droped
        this._glyphTable["."] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.724, 0.771), 0.005, 0.004); 
        this._glyphTable["*"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.733, 0.771), 0.012, 0.023); 

        this._glyphTable["^"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.424, 0.832), 0.011, 0.006, 0.018); //raised
        this._glyphTable["_"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5817, 0.9852), 0.0185, 0.0218); 
        this._glyphTable["|"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.2595, 0.765), 0.002, 0.0285, -0.003); //drop like []
        this._glyphTable["`"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.059, 0.944), 0.009, 0.006, 0.02); //flip?
        this._glyphTable["~"] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5907, 0.944), 0.012, 0.006, 0.01); //raised
        
        this._glyphTable[" "] = new GlyphRenderer(this.gl, this.shader, this.fontTexture, vec3.fromValues(0.5907, 0.954), 0.012, 0.006); 

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

        //make glyphs self-aware of the charactesr the glyph represents.
        for(let key in this._glyphTable)
        {
            let glyph = this._glyphTable[key]
            if(glyph)
            {
                glyph.symbol = key;
            }
        }
    }

}