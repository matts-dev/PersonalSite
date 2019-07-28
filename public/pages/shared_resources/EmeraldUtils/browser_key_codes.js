
/**
    usage: import all of these under key;
    import * as key from "/browser_key_codes.js"


    then you can use code like:
    handleKeyDown(event)
    {
        if(event.keyCode == key.up)
        { 
            this.up_pressed = true;
        }
    }
 
*/

/*
--PROBLEMS--
    This isn't perfect for non-english US keyboard layouts.
    https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode shows that different layouts may change the keycode for a button

    While keys can be corrected for the browser, correcting for the keyboard layout seems to be much harder.
    According to below, it may not be possible to read the current keyboard layout.
    https://stackoverflow.com/questions/8892238/detect-keyboard-layout-with-javascript

    An interactive tool may can be used to make the correct; that is, have the user press a key that is different
    on keyboard layouts to determine which keybaord layout they have and correct the keys in response.

    Alternatively, perhaps just allow the user to re-key map keys.

    Perhaps the best option is to have a place for the user to go if they're seeing wrong keys. Then ask them to presee
    controversial keys and infer the layout from their responses. Once they're layout has been deduced, update all keys
*/



/* 
    Duck typing to determine browser courtesy of Rob W from stackoverflow
    https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser


*/
//below detected chrome as firefox... so going with another solution.
// export const isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0; // Opera 8.0+
// export const isFirefox = typeof InstallTrigger !== 'undefined'; // Firefox 1.0+
// // export const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification)); // Safari 3.0+ "[object HTMLElementConstructor]" 
// export const isIE = /*@cc_on!@*/false || !!document.documentMode; // Internet Explorer 6-11
// export const isEdge = !isIE && !!window.StyleMedia; // Edge 20+
// export const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime); // Chrome 1 - 71
// export const isBlink = (isChrome || isOpera) && !!window.CSS; // Blink engine detection
// export const isSafari =!isOpera && !isFirefox && !isIE && !isEdge && !isChrome && !isBlink;


///////////////////////////////////////////////////////////////////////////////////////////////////////////
/* snippets code from MIT is.js library: 
    repo: https://github.com/arasatasaygin/is.js
    code: https://github.com/arasatasaygin/is.js/blob/master/is.js

    I should probably just set this up as a dependency.
*/

let userAgent = (navigator && navigator.userAgent || '').toLowerCase();
var vendor = (navigator && navigator.vendor || '').toLowerCase();

// build a 'comparator' object for various comparison checks
var comparator = {
    '<': function(a, b) { return a < b; },
    '<=': function(a, b) { return a <= b; },
    '>': function(a, b) { return a > b; },
    '>=': function(a, b) { return a >= b; }
};

// helper function which compares a version to a range
function compareVersion(version, range) {
    var string = (range + '');
    var n = +(string.match(/\d+/) || NaN);
    var op = string.match(/^[<>]=?|/)[0];
    return comparator[op] ? comparator[op](version, n) : (version == n || n !== n);
}

//range parametesr are optional
export function isOpera(range) {
    var match = userAgent.match(/(?:^opera.+?version|opr)\/(\d+)/);
    return match !== null && compareVersion(match[1], range);
}
export function isChrome(range) {
    var match = /google inc/.test(vendor) ? userAgent.match(/(?:chrome|crios)\/(\d+)/) : null;
    return match !== null && !isOpera() && compareVersion(match[1], range);
}
export function isSafari(range) {
    var match = userAgent.match(/version\/(\d+).+?safari/);
    return match !== null && compareVersion(match[1], range);
}
export function isFirefox(range) {
    var match = userAgent.match(/(?:firefox|fxios)\/(\d+)/);
    return match !== null && compareVersion(match[1], range);
}
export function isEdge(range) {
    var match = userAgent.match(/edge\/(\d+)/);
    return match !== null && compareVersion(match[1], range);
}
export function isIE(range) {
    var match = userAgent.match(/(?:msie |trident.+?; rv:)(\d+)/);
    return match !== null && compareVersion(match[1], range);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////




/*
    keydown/keyup event.keyCode                    
    Opera   MSIE  Firefox  Safari  Chrome    Key pressed
    _________________________________________________________

    8       8       8       8       8      Backspace
    9       9       9       9       9      Tab
    13      13      13      13      13      Enter
    16      16      16      16      16      Shift
    17      17      17      17      17      Ctrl
    18      18      18      18      18      Alt
    19      19      19      19      19      Pause, Break
    20      20      20      20      20      CapsLock
    27      27      27      27      27      Esc
    32      32      32      32      32      Space
    33      33      33      33      33      Page Up
    34      34      34      34      34      Page Down
    35      35      35      35      35      End
    36      36      36      36      36      Home
    37      37      37      37      37      Left arrow
    38      38      38      38      38      Up arrow
    39      39      39      39      39      Right arrow
    40      40      40      40      40      Down arrow
            44      44      44      44      PrntScrn (see below†)
    45      45      45      45      45      Insert
    46      46      46      46      46      Delete
    48-57   48-57   48-57   48-57   48-57   0 to 9
    65-90   65-90   65-90   65-90   65-90   A to Z  
    91      91      91      91      91      WIN Key (Start) 
    93      93      93      93      93      WIN Menu
    112-123 112-123 112-123 112-123 112-123  F1 to F12 
    144     144     144     144     144      NumLock
    145     145     145     145     145      ScrollLock
    188     188     188     188     188      , <
    190     190     190     190     190      . >
    191     191     191     191     191      / ?
    192     192     192     192     192      ` ~
    219     219     219     219     219      [ { (see below‡)
    220     220     220     220     220      \ |
    221     221     221     221     221      ] }
    222     222     222     222     222      ' "

    †In most browsers, pressing the PrntScrn key fires keyup events only. 
    ‡Key code 219 also corresponds to the Win Key (Start) in older versions of Opera.
*/

export const backspace                      =  8     ;                            
export const tab                            =  9     ;                                
export const enter                          = 13     ;                                  
export const shift                          = 16     ;                                  
export const ctrl                           = 17     ;                                 
export const alt                            = 18     ;                                
export const pause_break                    = 19     ;                                        
export const capslock                       = 20     ;                                     
export const esc                            = 27     ;                                
export const space                          = 32     ;                                  
export const page_up                        = 33     ;                                    
export const page_down                      = 34     ;                                      
export const end                            = 35     ;                                
export const home                           = 36     ;                                 
export const left_arrow                     = 37     ;                                       
export const up_arrow                       = 38     ;                                     
export const right_arrow                    = 39     ;                                        
export const down_arrow                     = 40     ;                                       
export const prntscrn_special               = 44     ;                                              
export const insert                         = 45     ;                                   
export const delete_                        = 46     ;                                   
export const digit_0                        = 48     ;              
export const digit_1                        = 49     ;              
export const digit_2                        = 50     ;              
export const digit_3                        = 51     ;              
export const digit_4                        = 52     ;              
export const digit_5                        = 53     ;              
export const digit_6                        = 54     ;              
export const digit_7                        = 55     ;              
export const digit_8                        = 56     ;              
export const digit_9                        = 57     ;              
export const a                              = 65     ;                                  
export const b                              = 66     ;                                  
export const c                              = 67     ;              
export const d                              = 68     ;              
export const e                              = 69     ;              
export const f                              = 70     ;              
export const g                              = 71     ;              
export const h                              = 72     ;              
export const i                              = 73     ;              
export const j                              = 74     ;              
export const k                              = 75     ;              
export const l                              = 76     ;              
export const m                              = 77     ;              
export const n                              = 78     ;              
export const o                              = 79     ;              
export const p                              = 80     ;              
export const q                              = 81     ;              
export const r                              = 82     ;              
export const s                              = 83     ;              
export const t                              = 84     ;              
export const u                              = 85     ;                                  
export const v                              = 86     ;                                  
export const w                              = 87     ;              
export const x                              = 88     ;              
export const y                              = 89     ;              
export const z                              = 90     ;              
export const win_key                        = 91     ;                                             
export const win_menu                       = 93     ;                                     
export const f1                             = 112    ;                                   
export const f2                             = 113    ;              
export const f3                             = 114    ;              
export const f4                             = 115    ;              
export const f5                             = 116    ;              
export const f6                             = 117    ;              
export const f7                             = 118    ;              
export const f8                             = 119    ;              
export const f9                             = 120    ;              
export const f10                            = 121    ;              
export const f11                            = 122    ;              
export const f12                            = 123    ;              
export const numlock                        = 144    ;                                    
export const scrolllock                     = 145    ;                                                             
export const comma_lessthan                 = 188    ;                                            
export const period_greaterthan             = 190    ;                                               
export const forwardslash_questionmark      = 191    ;                                                       
export const backtick_tilde                 = 192    ;                                            
export const bracket_open                   = 219    ;                                          
export const backslash_pipe                 = 220    ;                                           
export const bracket_close                  = 221    ;                                          
export const quote_doublequote              = 222    ;                                                                             



/*
        keydown/keyup event.keyCode                    
    Opera   MSIE  Firefox  Safari  Chrome    Key pressed
    _________________________________________________________ 

    173     173     181     173     173      Mute On|Off         
    174     174     182     174     174      Volume Down         
    175     175     183     175     175      Volume Up           
    186     186      59     186     186      ; :                 
    187     187      61     187     187      = +                 
    189     189     173     189     189      - _           
*/

export let mute_toggle         = null;       
export let volume_down         = null;
export let volume_up           = null;
export let semicolon_colon     = null; 
export let equals_plus         = null;    
export let minus_underscore    = null;


if(isFirefox())             
{
    console.log("KEY_CODE: detected firefox");
    mute_toggle         = 181 ;       
    volume_down         = 182 ;
    volume_up           = 183 ;
    semicolon_colon     =  59 ; 
    equals_plus         =  61 ;    
    minus_underscore    = 173 ;
}
else if(isChrome()) 
{
    console.log("KEY_CODE: detected chrome");
    mute_toggle         = 173 ;       
    volume_down         = 174 ;
    volume_up           = 175 ;
    semicolon_colon     = 186 ; 
    equals_plus         = 187 ;    
    minus_underscore    = 189 ;
   
}
else if (isEdge())
{
    console.log("KEY_CODE: detected edge");
    mute_toggle         =  173  ;       
    volume_down         =  174  ;
    volume_up           =  175  ;
    semicolon_colon     =  186  ; 
    equals_plus         =  187  ;    
    minus_underscore    =  189  ;

}
else if (isIE())
{
    console.log("KEY_CODE: detected msie");
    mute_toggle         = 173  ;      
    volume_down         = 174  ;
    volume_up           = 175  ;
    semicolon_colon     = 186  ;
    equals_plus         = 187  ;   
    minus_underscore    = 189  ;

}
else if (isSafari())
{
    console.log("KEY_CODE: detected safari");
    mute_toggle         = 173;       
    volume_down         = 174;
    volume_up           = 175;
    semicolon_colon     = 186; 
    equals_plus         = 187;    
    minus_underscore    = 189;

}
else if (isOpera())
{
    console.log("KEY_CODE: detected opera");
    mute_toggle         = 173 ;       
    volume_down         = 174 ;
    volume_up           = 175 ;
    semicolon_colon     = 186 ; 
    equals_plus         = 187 ;    
    minus_underscore    = 189 ;
}
else
{
    console.log("KEY_CODE: NO BROWSER DETECTED");
    mute_toggle         = 173 ;       
    volume_down         = 174 ;
    volume_up           = 175 ;
    semicolon_colon     = 186 ; 
    equals_plus         = 187 ;    
    minus_underscore    = 189 ;
}


/*
    numlock_state (on/off)
    96/45                           Numpad 0 Ins     
    97/35                           Numpad 1 End     
    98/40                           Numpad 2 Down    
    99/34                           Numpad 3 Pg Down 
    100/37                           Numpad 4 Left    
    101/12                           Numpad 5         
    102/39                           Numpad 6 Right   
    103/36                           Numpad 7 Home    
    104/38                           Numpad 8 Up      
    105/33                           Numpad 9 Pg Up   
    106/106                          Numpad *         
    107/107                          Numpad +         
    109/109                          Numpad -         
    110/46                           Numpad . Del     
    111/111                          Numpad /
*/


export const numpad_lock_on_0_ins        =      96   ;        
export const numpad_lock_on_1_end        =      97   ;        
export const numpad_lock_on_2_down       =      98   ;        
export const numpad_lock_on_3_pgdown     =      99   ;       
export const numpad_lock_on_4_left       =      100  ;        
export const numpad_lock_on_5            =      101  ;        
export const numpad_lock_on_6_right      =      102  ;        
export const numpad_lock_on_7_home       =      103  ;        
export const numpad_lock_on_8_up         =      104  ;        
export const numpad_lock_on_9_pgup       =      105  ;       
export const numpad_lock_on_asterisk     =      106  ;      
export const numpad_lock_on_plus         =      107  ;  
export const numpad_lock_on_minus        =      109  ;            
export const numpad_lock_on_period_del   =      110  ;             
export const numpad_lock_on_forwardslash =      111  ;


export const numpad_lock_off_0_ins        =      45   ;        
export const numpad_lock_off_1_end        =      35   ;        
export const numpad_lock_off_2_down       =      40   ;        
export const numpad_lock_off_3_pgdown     =      34   ;       
export const numpad_lock_off_4_left       =      37   ;        
export const numpad_lock_off_5            =      12   ;        
export const numpad_lock_off_6_right      =      39   ;        
export const numpad_lock_off_7_home       =      36   ;        
export const numpad_lock_off_8_up         =      38   ;        
export const numpad_lock_off_9_pgup       =      33   ;       
export const numpad_lock_off_asterisk     =      106  ;      
export const numpad_lock_off_plus         =      107  ;  
export const numpad_lock_off_minus        =      109  ;            
export const numpad_lock_off_period_del   =      46   ;             
export const numpad_lock_off_forwardslash =      111  ;          



//alias
export const up = numpad_lock_off_8_up;
export const down = numpad_lock_off_2_down;
export const left = numpad_lock_off_4_left;
export const right = numpad_lock_off_6_right;



export class InputMonitor 
{
    constructor()
    {
        this.pressedStateArray = this.initPressedArray();

        this._bindCallbacks();
    }

    initPressedArray()
    {
        let pressedStateArray = new Array(500);

        let key = 0;
        for(key = 0; key < pressedStateArray.length; ++key)
        {
            pressedStateArray[key] = false;
        }
        return pressedStateArray;
    }

    _bindCallbacks()
    {
        document.addEventListener('keydown', this.handleKeyDown.bind(this), /*useCapture*/ false);
        document.addEventListener('keyup', this.handleKeyUp.bind(this), /*useCapture*/ false);
    }

    isValidCode(idx)
    {
        return idx >= 0 && idx < this.pressedStateArray.length -1;
    }

    handleKeyDown(event)
    {
        if(this.isValidCode(event.keyCode))
        {
            this.pressedStateArray[event.keyCode] = true;
        }
        else
        {
            console.log("InputMonitor: invalid keycode detected");
        }

    }

    handleKeyUp(event)
    {
        if(this.isValidCode(event.keyCode))
        {
            this.pressedStateArray[event.keyCode] = false;
        }
        else
        {
            console.log("InputMonitor: invalid keycode detected");
        }
    }
}