// ModelView Matrix: defines where the square is positioned in the 3D coordinate system relative to the camera
// Projection Matrix: required by the shader to convert the 3D space into the 2D space of the viewport. 
var projectionMatrix, modelViewMatrix;

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These are constant during a rendering cycle, such as lights position.
// Varyings: Used for passing data from the vertex shader to the fragment shader.
var vertexShaderSource =
    
    "    attribute vec3 vertexPos;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "    }\n";

var fragmentShaderSource = 
    "    void main(void) {\n" +
    "    // Return the pixel color: always output white\n" +
    "    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n" +
    "}\n";

var shaderProgram, shaderVertexPositionAttribute, shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

// Initializes the context for use with WebGL
function initWebGL(canvas) 
{

    var gl = null;
    var msg = "Your browser does not support WebGL, or it is not enabled by default.";

    try 
    {
        // The getContext method can take one of the following context id strings:
        // "2d" for a 2d canvas context, "webgl" for a WebGL context, or "experimental-webgl" to get a xontext for earlier-version browsers.
        // Use of "experimental-webgl" is recommended to get a context for all WebGL capable browsers.
        gl = canvas.getContext("experimental-webgl");
    } 
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;        
}

// The viewport is the rectangular bounds of where to draw. 
// In this case, the viewport will take up the entire contents of the canvas' display area.
function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initShader(gl)
{
    // load and compile the fragment and vertex shader
    var fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    var vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Obtain handles to each of the variables defined in the GLSL shader code so that they can be initialized
    // gl.getAttribLocation(program, name);
    // program  A webgl program containing the attribute variable
    // name     A domString specifying the name of the attribute variable whose location to get
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);
    
    // gl.getUniformLocation(program, name);
    // program  A webgl program containing the attribute variable
    // name     A domString specifying the name of the uniform variable whose location to get
    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function initGL(gl, canvas)
{
    // clear the background (with black)
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clears the color buffer; the area in GPU memory used to render the bits on screen.
    // There are several buffers, including the color, and depth buffers.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Create a model view matrix with object at 0, 0, -3.333
    modelViewMatrix = mat4.create();
    // translate(out, a, v) → {mat4}
    // out	mat4	the receiving matrix
    // a	mat4	the matrix to translate
    // v	vec3	vector to translate by
    mat4.identity(modelViewMatrix);

    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    // perspective(out, fovy, aspect, near, far) → {mat4}
    // out	    mat4	mat4 frustum matrix will be written into
    // fovy	    number	Vertical field of view in radians
    // aspect	number	Aspect ratio. typically viewport width/height
    // near	    number	Near bound of the frustum
    // far	    number	Far bound of the frustum
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 10000);
}

// Helper function that uses WebGL methods to compile the vertex and fragments shaders from a source.
function createShader(gl, str, type)
{
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function draw(gl, obj) 
{
    // set the shader to use
    gl.useProgram(shaderProgram);

    // connect up the shader parameters: vertex position and projection/model matrices
    // set the vertex buffer to be drawn
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);

    // Specifies the memory layout of the vertex buffer object. It must be called once for each vertex attribute.
    // gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
    // index: A GLuint specifying the index of the vertex attribute that is to be modified.
    // size: A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
    // type: A GLenum specifying the data type of each component in the array.
    // normalized: A GLboolean specifying whether integer data values should be normalized into a certain range when being casted to a float.
    // stride: A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes.
    // offset: A GLintptr specifying an offset in bytes of the first component in the vertex attribute array
    gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

    // WebGLRenderingContext.uniformMatrix4fv(location, transpose, value); 
    // location: A WebGLUniformLocation object containing the location of the uniform attribute to modify. The location is obtained using getAttribLocation().
    // transpose: A GLboolean specifying whether to transpose the matrix.
    // value: A Float32Array or sequence of GLfloat values.
    gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
    gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, modelViewMatrix);

    // draw the object
    gl.drawArrays(obj.primtype, 0, obj.nVerts);
}

// TO DO: Create functions needed to generate the vertex data for the different figures.
function createSquare(gl) 
{
    //Este código lo vimos en clase
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var verts = [
        .5,  .5,  0.0,
        -.5,  .5,  0.0,
        .5, -.5,  0.0,
        -.5, -.5,  0.0
    ];
    // void gl.bufferData(target, ArrayBufferView srcData, usage, srcOffset, length);
    // target = gl.ARRAY_BUFFER: Buffer containing vertex attributes, such as vertex coordinates, texture coordinate data, or vertex color data.
    // srcData = This is a new data type introduced into web browsers for use with WebGL. Float32Array is a type of ArrayBuffer, also known as a typed array. This is a JavaScript type that stores compact binary data. 
    // usage = A GLenum specifying the usage pattern of the data store. gl.STATIC_DRAW: Contents of the buffer are likely to be used often and not change often. Contents are written to the buffer, but not read.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // The resulting object contains the vertexbuffer, the size of the vertex structure (3 floats, x, y, z), the number of vertices to be drawn, the the primitive to draw.    

    var square = {buffer:vertexBuffer, vertSize:3, nVerts:4, primtype:gl.TRIANGLE_STRIP};
    return square;
}

function createTriangle(gl)
{
    //Este código lo vimos en clase
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var verts = [
        0.0, 0.5, 0.0,
        .5, -.5,  0.0,
        -.5, -.5,  0.0
    ];
    // void gl.bufferData(target, ArrayBufferView srcData, usage, srcOffset, length);
    // target = gl.ARRAY_BUFFER: Buffer containing vertex attributes, such as vertex coordinates, texture coordinate data, or vertex color data.
    // srcData = This is a new data type introduced into web browsers for use with WebGL. Float32Array is a type of ArrayBuffer, also known as a typed array. This is a JavaScript type that stores compact binary data. 
    // usage = A GLenum specifying the usage pattern of the data store. gl.STATIC_DRAW: Contents of the buffer are likely to be used often and not change often. Contents are written to the buffer, but not read.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // The resulting object contains the vertexbuffer, the size of the vertex structure (3 floats, x, y, z), the number of vertices to be drawn, the the primitive to draw.
   
    var triangle = {buffer:vertexBuffer, vertSize:3, nVerts:3, primtype:gl.TRIANGLES};
    return triangle;
}

function createRhombus(gl)
{
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var verts = [
        0.5, 0.0, 0.0,
        0.0, 0.5, 0.0,
        0.0, -0.5, 0.0,
        -0.5, 0.0, 0.0
    ]; 

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    var rhombus = {buffer:vertexBuffer, vertSize:3, nVerts:4, primtype:gl.TRIANGLE_STRIP};

    return rhombus;
}

function createSphere(gl, radius)
{
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var verts = [0,0,0,0.3535533905932738,0.35355339059327373,0,0.3473291852294987,0.35966990016932554,0,0.34099918003124924,0.36567685080958523,0,0.3345653031794292,0.37157241273869707,0,0.3280295144952537,0.37735479011138595,0,0.3213938048432697,0.383022221559489,0,0.3146601955249188,0.3885729807284854,0,0.30783073766282915,0.39400537680336095,0,0.3009075115760242,0.3993177550236464,0,0.2938926261462366,0.40450849718747367,0,0.2867882181755231,0.40957602214449584,0,0.27959645173537345,0.4145187862775208,0,0.2723195175075136,0.41933528397271197,0,0.26495963211660245,0.424024048078213,0,0.2575190374550272,0.42858365035105606,0,0.25000000000000006,0.4330127018922193,0,0.24240481012316858,0.43730985356969787,0,0.23473578139294543,0.44147379642946344,0,0.2269952498697734,0.4455032620941839,0,0.2191855733945387,0.4493970231495835,0,0.21130913087034972,0.45315389351832497,0,0.20336832153790008,0.45677272882130043,0,0.19536556424463694,0.46025242672622013,0,0.18730329670795598,0.4635919272833937,0,0.1791839747726502,0.46679021324860087,0,0.1710100716628344,0.46984631039295416,0,0.16278407722857838,0.47275928779965837,0,0.15450849718747373,0.47552825814757677,0,0.14618585236136838,0.4781523779815177,0,0.13781867790849958,0.48063084796915945,0,0.12940952255126037,0.48296291314453416,0,0.12096094779983395,0.48514786313799824,0,0.11247552717193246,0.4871850323926176,0,0.10395584540887973,0.4890738003669028,0,0.09540449768827246,0.490813591723832,0,0.08682408883346521,0.492403876506104,0,0.07821723252011546,0.4938441702975689,0,0.06958655048003284,0.4951340343707851,0,0.06093467170257374,0.496273075820661,0,0.05226423163382672,0.49726094768413664,0,0.04357787137382906,0.4980973490458728,0,0.03487823687206273,0.4987820251299121,0,0.026167978121471983,0.4993147673772869,0,0.01744974835125054,0.4996954135095479,0,0.008726203218641688,0.49992384757819563,0,3.061616997868383e-17,0.5,0,-0.008726203218641737,0.49992384757819563,0,-0.017449748351250367,0.4996954135095479,0,-0.02616797812147181,0.4993147673772869,0,-0.03487823687206267,0.4987820251299121,0,-0.04357787137382912,0.4980973490458728,0,-0.052264231633826666,0.4972609476841367,0,-0.06093467170257369,0.49627307582066105,0,-0.06958655048003268,0.4951340343707852,0,-0.07821723252011552,0.49384417029756883,0,-0.08682408883346515,0.492403876506104,0,-0.0954044976882724,0.490813591723832,0,-0.10395584540887956,0.48907380036690284,0,-0.1124755271719324,0.4871850323926176,0,-0.12096094779983389,0.48514786313799824,0,-0.12940952255126043,0.48296291314453416,0,-0.13781867790849953,0.48063084796915945,0,-0.14618585236136833,0.4781523779815178,0,-0.15450849718747367,0.4755282581475768,0,-0.1627840772285782,0.4727592877996584,0,-0.17101007166283436,0.4698463103929542,0,-0.17918397477265013,0.46679021324860087,0,-0.18730329670795604,0.4635919272833937,0,-0.1953655642446368,0.4602524267262202,0,-0.20336832153790005,0.4567727288213005,0,-0.21130913087034967,0.453153893518325,0,-0.21918557339453876,0.44939702314958346,0,-0.22699524986977337,0.44550326209418395,0,-0.23473578139294526,0.44147379642946355,0,-0.24240481012316847,0.4373098535696979,0,-0.2499999999999999,0.4330127018922194,0,-0.2575190374550271,0.42858365035105617,0,-0.2649596321166024,0.42402404807821303,0,-0.27231951750751354,0.419335283972712,0,-0.27959645173537334,0.4145187862775209,0,-0.2867882181755229,0.409576022144496,0,-0.2938926261462365,0.4045084971874737,0,-0.3009075115760242,0.3993177550236464,0,-0.3078307376628291,0.394005376803361,0,-0.31466019552491864,0.38857298072848556,0,-0.3213938048432696,0.38302222155948906,0,-0.32802951449525375,0.37735479011138595,0,-0.3345653031794291,0.3715724127386971,0,-0.3409991800312492,0.36567685080958534,0,-0.3473291852294985,0.3596699001693257,0,-0.35355339059327373,0.3535533905932738,0,-0.35966990016932565,0.34732918522949857,0,-0.36567685080958523,0.34099918003124924,0,-0.371572412738697,0.3345653031794292,0,-0.377354790111386,0.32802951449525364,0,-0.38302222155948895,0.32139380484326974,0,-0.38857298072848534,0.31466019552491886,0,-0.39400537680336095,0.3078307376628292,0,-0.39931775502364647,0.3009075115760241,0,-0.40450849718747367,0.2938926261462366,0,-0.40957602214449584,0.2867882181755232,0,-0.4145187862775208,0.27959645173537345,0,-0.4193352839727121,0.27231951750751343,0,-0.424024048078213,0.26495963211660245,0,-0.42858365035105606,0.2575190374550272,0,-0.43301270189221935,0.24999999999999997,0,-0.43730985356969787,0.24240481012316858,0,-0.4414737964294634,0.23473578139294554,0,-0.4455032620941839,0.22699524986977343,0,-0.4493970231495835,0.21918557339453865,0,-0.45315389351832497,0.21130913087034975,0,-0.4567727288213004,0.20336832153790022,0,-0.4602524267262201,0.19536556424463708,0,-0.46359192728339366,0.18730329670795612,0,-0.46679021324860087,0.1791839747726501,0,-0.46984631039295416,0.17101007166283444,0,-0.47275928779965837,0.1627840772285785,0,-0.47552825814757677,0.15450849718747375,0,-0.4781523779815177,0.1461858523613685,0,-0.48063084796915934,0.13781867790849983,0,-0.4829629131445341,0.1294095225512605,0,-0.48514786313799824,0.12096094779983387,0,-0.4871850323926176,0.11247552717193238,0,-0.48907380036690284,0.10395584540887964,0,-0.490813591723832,0.09540449768827249,0,-0.49240387650610407,0.08682408883346512,0,-0.49384417029756883,0.07821723252011549,0,-0.4951340343707851,0.06958655048003287,0,-0.496273075820661,0.06093467170257377,0,-0.49726094768413664,0.05226423163382687,0,-0.4980973490458728,0.04357787137382932,0,-0.4987820251299121,0.03487823687206276,0,-0.4993147673772869,0.026167978121471903,0,-0.4996954135095479,0.01744974835125035,0,-0.49992384757819563,0.008726203218641718,0,-0.5,6.123233995736766e-17,0,-0.49992384757819563,-0.008726203218641596,0,-0.4996954135095479,-0.017449748351250446,0,-0.4993147673772869,-0.02616797812147178,0,-0.49878202512991215,-0.034878236872062415,0,-0.4980973490458728,-0.04357787137382897,0,-0.4972609476841367,-0.05226423163382653,0,-0.496273075820661,-0.06093467170257387,0,-0.4951340343707851,-0.06958655048003276,0,-0.4938441702975689,-0.07821723252011538,0,-0.492403876506104,-0.08682408883346523,0,-0.490813591723832,-0.09540449768827237,0,-0.48907380036690284,-0.10395584540887953,0,-0.4871850323926176,-0.11247552717193249,0,-0.48514786313799824,-0.12096094779983375,0,-0.4829629131445342,-0.12940952255126018,0,-0.48063084796915945,-0.1378186779084995,0,-0.4781523779815178,-0.1461858523613682,0,-0.4755282581475767,-0.15450849718747386,0,-0.47275928779965837,-0.1627840772285784,0,-0.4698463103929542,-0.17101007166283433,0,-0.4667902132486008,-0.17918397477265022,0,-0.4635919272833937,-0.187303296707956,0,-0.4602524267262202,-0.19536556424463677,0,-0.45677272882130054,-0.2033683215378999,0,-0.453153893518325,-0.21130913087034964,0,-0.4493970231495836,-0.21918557339453854,0,-0.44550326209418406,-0.22699524986977315,0,-0.44147379642946344,-0.23473578139294543,0,-0.4373098535696979,-0.24240481012316847,0,-0.4330127018922193,-0.25000000000000006,0,-0.42858365035105617,-0.2575190374550271,0,-0.42402404807821303,-0.2649596321166024,0,-0.419335283972712,-0.27231951750751354,0,-0.4145187862775209,-0.27959645173537334,0,-0.409576022144496,-0.2867882181755229,0,-0.4045084971874737,-0.2938926261462365,0,-0.3993177550236465,-0.300907511576024,0,-0.3940053768033611,-0.3078307376628289,0,-0.3885729807284854,-0.3146601955249188,0,-0.38302222155948906,-0.3213938048432696,0,-0.37735479011138595,-0.32802951449525375,0,-0.3715724127386971,-0.3345653031794291,0,-0.36567685080958534,-0.3409991800312492,0,-0.35966990016932554,-0.3473291852294987,0,-0.35355339059327384,-0.35355339059327373,0,-0.3473291852294988,-0.35966990016932543,0,-0.34099918003124946,-0.36567685080958506,0,-0.33456530317942923,-0.371572412738697,0,-0.32802951449525386,-0.37735479011138584,0,-0.3213938048432698,-0.38302222155948895,0,-0.3146601955249186,-0.38857298072848556,0,-0.3078307376628291,-0.394005376803361,0,-0.30090751157602413,-0.3993177550236464,0,-0.2938926261462366,-0.40450849718747367,0,-0.2867882181755232,-0.4095760221444958,0,-0.2795964517353737,-0.4145187862775207,0,-0.2723195175075135,-0.419335283972712,0,-0.2649596321166025,-0.4240240480782129,0,-0.25751903745502724,-0.42858365035105606,0,-0.2500000000000002,-0.4330127018922192,0,-0.24240481012316842,-0.4373098535696979,0,-0.23473578139294538,-0.4414737964294635,0,-0.22699524986977346,-0.4455032620941839,0,-0.21918557339453887,-0.4493970231495834,0,-0.21130913087034997,-0.45315389351832486,0,-0.20336832153790005,-0.4567727288213005,0,-0.1953655642446369,-0.46025242672622013,0,-0.18730329670795615,-0.46359192728339366,0,-0.17918397477265036,-0.4667902132486008,0,-0.17101007166283466,-0.4698463103929541,0,-0.16278407722857832,-0.4727592877996584,0,-0.15450849718747378,-0.47552825814757677,0,-0.14618585236136852,-0.47815237798151766,0,-0.13781867790849944,-0.4806308479691595,0,-0.12940952255126031,-0.48296291314453416,0,-0.1209609477998339,-0.48514786313799824,0,-0.11247552717193264,-0.48718503239261757,0,-0.10395584540887991,-0.4890738003669028,0,-0.09540449768827274,-0.49081359172383193,0,-0.08682408883346517,-0.492403876506104,0,-0.07821723252011553,-0.49384417029756883,0,-0.06958655048003247,-0.4951340343707852,0,-0.060934671702573585,-0.49627307582066105,0,-0.05226423163382667,-0.4972609476841367,0,-0.043577871373829125,-0.4980973490458728,0,-0.03487823687206279,-0.4987820251299121,0,-0.026167978121472153,-0.4993147673772869,0,-0.01744974835125082,-0.4996954135095478,0,-0.008726203218641749,-0.49992384757819563,0,-9.184850993605148e-17,-0.5,0,0.008726203218641565,-0.49992384757819563,0,0.01744974835125064,-0.4996954135095479,0,0.026167978121471973,-0.4993147673772869,0,0.03487823687206261,-0.49878202512991215,0,0.043577871373828944,-0.4980973490458728,0,0.0522642316338265,-0.4972609476841367,0,0.06093467170257384,-0.496273075820661,0,0.06958655048003272,-0.4951340343707852,0,0.07821723252011534,-0.4938441702975689,0,0.08682408883346499,-0.49240387650610407,0,0.09540449768827211,-0.49081359172383204,0,0.10395584540887928,-0.4890738003669029,0,0.11247552717193245,-0.4871850323926176,0,0.12096094779983371,-0.4851478631379983,0,0.1294095225512606,-0.4829629131445341,0,0.1378186779084997,-0.4806308479691594,0,0.14618585236136838,-0.4781523779815177,0,0.15450849718747361,-0.4755282581475768,0,0.16278407722857816,-0.4727592877996585,0,0.1710100716628341,-0.46984631039295427,0,0.17918397477264977,-0.46679021324860104,0,0.18730329670795598,-0.4635919272833937,0,0.19536556424463675,-0.46025242672622024,0,0.2033683215379003,-0.4567727288213004,0,0.2113091308703498,-0.4531538935183249,0,0.2191855733945387,-0.4493970231495835,0,0.22699524986977332,-0.445503262094184,0,0.2347357813929452,-0.44147379642946355,0,0.24240481012316822,-0.43730985356969804,0,0.25,-0.4330127018922193,0,0.257519037455027,-0.42858365035105617,0,0.26495963211660234,-0.4240240480782131,0,0.2723195175075133,-0.41933528397271214,0,0.2795964517353731,-0.41451878627752103,0,0.286788218175523,-0.4095760221444959,0,0.29389262614623646,-0.4045084971874738,0,0.30090751157602397,-0.3993177550236466,0,0.30783073766282926,-0.3940053768033609,0,0.31466019552491875,-0.3885729807284854,0,0.3213938048432696,-0.38302222155948906,0,0.3280295144952535,-0.3773547901113861,0,0.3345653031794289,-0.37157241273869734,0,0.34099918003124896,-0.3656768508095855,0,0.3473291852294983,-0.3596699001693259,0
    ];
   
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    var sphere = {buffer:vertexBuffer, vertSize:3, nVerts:270, primtype:gl.TRIANGLE_FAN};
    return sphere;
}        