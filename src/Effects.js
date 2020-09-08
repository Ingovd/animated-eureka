const vertexShader = `

    precision mediump float;
    attribute vec2 aVertexPosition;
    attribute vec2 aUvs;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying vec2 vUvs;

    void main() {
        vUvs = aUvs;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    }`;

const testShader = `
    precision mediump float;

    varying vec2 vUvs;

    uniform sampler2D uSampler;//The image data
    uniform float uValue;
    uniform float uX;
    uniform float uY;

    void main(void) {
        vec2 p = vec2(uX - 0.5, uY - 0.5) * 2.0; 
        vec2 q = vec2(vUvs.x - 0.5, vUvs.y - 0.5) * 2.0;
        if(pow(q.x, 2.0) + pow(q.y, 2.0) < 1.0) {
            // float d = acos((a.x * b.x + a.y * b.y + a.z + b.z)/);
            if(pow(q.x - p.x, 2.0) + pow(q.y - p.y, 2.0) < 0.01) {
                gl_FragColor.b = pow(pow(0.5, 2.0) - pow(q.x, 2.0) - pow(q.y, 2.0), 0.5);
                gl_FragColor.a = 1.0;
            } else {
                gl_FragColor.b = 0.0;
                // gl_FragColor.a = 0.0;
            }
            // gl_FragColor.r = uValue;
            gl_FragColor.rgb *= gl_FragColor.a;
        }
    }`;