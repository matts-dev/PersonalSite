import * as mm from './my_module.js';
// import * as vl from  '../shared_resources/gl-matrix.js';
// import {vec3} from '../shared_resources/gl-matrix.js';
// import {vec3} from 'vec3'

let vec3 = vector3;

main();

function main()
{
    console.log("Main started");

    mm.my_exported_function();

    var eye = vector3.fromValues(1.5, 1.5, 0);
    var test = vec3.fromValues(1.5, 1.5, 0);
    console.log(test);
}