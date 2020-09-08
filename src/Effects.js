const testShader = `
    precision mediump float;

    varying vec2 vTextureCoord;//The coordinates of the current pixel
    uniform sampler2D uSampler;//The image data
    uniform float uValue;
    uniform float uX;
    uniform float uY;

    void main(void) {
        // gl_FragColor = texture2D(uSampler, vTextureCoord);
        gl_FragColor.r = uValue;
        if(pow(vTextureCoord.x - uX, 2.0) + pow(vTextureCoord.y - uY, 2.0) < 0.01) {
        // if(abs(vTextureCoord.x - uX) < 0.25 && abs(vTextureCoord.y - uY) < 0.25) {
            gl_FragColor.b = 1.0;
        } else {
            gl_FragColor.b = 0.0;
        }
        gl_FragColor.g = uX;
        gl_FragColor.a = 1.0;
        gl_FragColor.rg = vTextureCoord;
        if(pow(vTextureCoord.x - 0.5, 2.0) + pow(vTextureCoord.y - 0.5, 2.0) < 0.01) {
            gl_FragColor.g = 1.0;
        }
        // gl_FragColor.rgb *= gl_FragColor.a;
    }`;