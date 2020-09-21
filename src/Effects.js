const spriteVertex = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat3 projectionMatrix;
    varying vec2 vTextureCoord;
    void main(void)
    {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
    }
`;

const spriteFragment = `
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void)
    {
        vec4 color = texture2D(uSampler, vTextureCoord);
        gl_FragColor = color;
        gl_FragColor.rgb += vec3(color.r + color.b + color.g);
        gl_FragColor.rgb += vec3(0.02, 0.02, 0.02);
        gl_FragColor.rgb *= gl_FragColor.a * 2.0;
        gl_FragColor.a *= 0.1;
}`;

const expBlend = `
    varying vec2 vTextureCoord;

    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;

    void main(void) {
        vec4 colorA = texture2D(uTextureA, vTextureCoord);
        vec4 colorB = texture2D(uTextureB, vTextureCoord);
        float lumInv = 1.0 / (colorA.r + colorA.r + colorA.b + colorA.g + colorA.g + colorA.g + 0.001);
        gl_FragColor = vec4(mix(colorA, colorB, pow(colorA.a * lumInv, 0.2)).rgb, colorA.a);
    }
`;

const vertexShader = `
    precision mediump float;
    attribute vec2 aVertexPosition;
    attribute vec2 aUvs;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying vec2 vVertexPosition;
    varying vec2 vUvs;

    void main() {
        vUvs = aUvs;
        vVertexPosition = aVertexPosition;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    }`;


const positionFragment = `
    varying vec2 vUvs;

    uniform sampler2D lightA;
    uniform sampler2D lightB;

    void main(void) {
        vec4 light = texture2D(lightA, vUvs);
        if(light.r + light.g + light.b > 0.0) {
            gl_FragColor.rg = vUvs;
        } else {
            gl_FragColor.rg = vec2(-1000.0, -10000.0);
        }
        light = texture2D(lightB, vUvs);
        if(light.r + light.g + light.b > 0.0) {
            gl_FragColor.ba = vUvs;
        } else {
            gl_FragColor.ba = vec2(-1000.0, -10000.0);
        }
    }
`;

const jfaFragment =`
    varying vec2 vVertexPosition;
    varying vec2 vUvs;

    uniform sampler2D uTexIn;
    uniform float step;
    uniform vec2 dim;

    vec2 closest(in vec2 p, in vec2 q) {
        float d_p = length((p - vUvs) * dim);
        float d_q = length((q - vUvs) * dim);
        if(p.x == 0.0) {
            d_p = 100000.0;
        }
        if(q.x == 0.0) {
            d_q = 100000.0;
        }
        if(d_p < d_q) {
            return p;
        } else {
            return q;
        }
    }

    void main() {
        vec4 sample = texture2D(uTexIn, vUvs);
        vec2 currentA = sample.xy;
        vec2 currentB = sample.zw;
        vec2 offset = vec2(0.0, 0.0);
        vec4 offsetSample;
        for(float i = 0.0; i < 9.0; i++) {
            offset = vec2(mod(i, 3.0) - 1.0, floor(i/3.0) - 1.0) * step / dim;
            offsetSample = texture2D(uTexIn, vUvs + offset);
            currentA = closest(currentA, offsetSample.xy);
            currentB = closest(currentB, offsetSample.zw);
        }
        gl_FragColor = vec4(currentA, currentB);
    }
`;

const fragmentVoronoi = `
    precision mediump float;    

    varying vec2 vVertexPosition;
    varying vec2 vUvs;

    uniform sampler2D uNN;
    uniform sampler2D uLights;
    uniform vec2 dim;

    float max3(in vec3 v) {
        return max(max(v.x, v.y), v.z);
    }

    void main(void) {
        vec2 nn = texture2D(uNN, vUvs).SOURCE;
        gl_FragColor = texture2D(uLights, nn);
        gl_FragColor.rgb /= gl_FragColor.a;
        gl_FragColor.a = length((nn -vUvs) * dim) * RADIUS;
    }
`;

const fragmentNormal = `
    precision mediump float;

    varying vec2 vVertexPosition;
    varying vec2 vUvs;

    uniform sampler2D uTexture;
    uniform sampler2D uRoughness;
    uniform sampler2D uNormal;
    uniform sampler2D uAmbient;
    uniform sampler2D uHeight;
    uniform sampler2D uLightA;
    uniform sampler2D uLightB;
    uniform sampler2D uLightDir;
    
    uniform float uX;
    uniform float uY;
    uniform vec2 dim;

    float max3(in vec3 v) {
        return max(max(v.x, v.y), v.z);
    }

    vec2 ccjg(in vec2 c) {
        return vec2(c.x, -c.y);
    }

    vec2 cmul(in vec2 a, in vec2 b) {
        return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
    }

    vec2 rotate(vec2 v, float a) {
        float s = sin(a);
        float c = cos(a);
        mat2 m = mat2(c, -s, s, c);
        return m * v;
    }

    void main(void) {
        vec2 uv = vVertexPosition / dim * (dim / min(dim.x, dim.y)) * 1.25;
        vec3 N = normalize(texture2D(uNormal, uv).xyz * 2.0 - 1.0); // Normal vector
        vec2 nnA = texture2D(uLightDir, vUvs).xy;
        vec2 nnB = texture2D(uLightDir, vUvs).zw;

        vec3 vertexPos = vec3(vVertexPosition, 0.0);
        vec3 lightPosA = vec3(nnA * dim, 250.0);
        vec3 lightPosB = vec3(nnB * dim, 250.0);
        
        vec3 LA = normalize(lightPosA - vertexPos); // LightA direction
        vec3 LB = normalize(lightPosB - vertexPos); // LightA direction
        
        float shininess = (texture2D(uRoughness, uv).r) * 100.0;
        float specularA = pow(max(reflect(-LA, N).z, 0.0), shininess);
        float specularB = pow(max(reflect(-LB, N).z, 0.0), shininess);

        vec4 lightColorA = texture2D(uLightA, vUvs);
        float influenceA = 1.0 - lightColorA.a;
        lightColorA *= influenceA * influenceA * 2.0;

        vec4 lightColorB = texture2D(uLightB, vUvs);
        float influenceB = 1.0 - lightColorB.a;
        lightColorB *= influenceB * influenceB * 2.0;

        gl_FragColor = vec4((0.2 +
                                mix(dot(LA, N) * lightColorA.rgb, specularA * lightColorA.rgb, 0.5) +
                                mix(dot(LB, N) * lightColorB.rgb, specularB * lightColorB.rgb, 0.8)
                            )
                            * texture2D(uTexture,uv).rgb * texture2D(uAmbient, uv).r, 1.0);
    }`;

/** @function voronoiShader Convenience method for building the parametrized program. */
function voronoiShader(source, radius, uniforms) {
    const voronoiProgram = fragmentVoronoi
                            .replace(/SOURCE/g, source)
                            .replace(/RADIUS/g, (1/radius).toFixed(20));
    return new PIXI.Shader.from(vertexShader, voronoiProgram, uniforms);
}