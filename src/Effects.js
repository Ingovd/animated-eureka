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

    uniform float delta;

    void main(void)
    {
        vec4 color = texture2D(uSampler, vTextureCoord );
        // if (color.a != 0.0){
        //     color.r += delta;
        //     color.g -= delta;
        //     color.b -= delta;
        // }
        gl_FragColor = color;
        gl_FragColor.rgb += + vec3(0.2, 0.2, 0.2);
        // gl_FragColor.g = 1.0;
        // gl_FragColor.rg = vTextureCoord;
        gl_FragColor *= color.a * 2.0;
}`;

const expBlend = `
    varying vec2 vTextureCoord;

    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;

    void main(void) {
        vec4 colorA = texture2D(uTextureA, vTextureCoord);
        vec4 colorB = texture2D(uTextureB, vTextureCoord);
        // colorB /= max(max(colorB.r, colorB.g), colorB.b);
        // float lum = (colorA.r + colorA.r + colorA.r + colorA.b + colorA.g + colorA.g + colorA.g + colorA.g) / 8.0;
        gl_FragColor = vec4(mix(colorA, colorB, pow(colorA.a, 0.3)).rgb, colorA.a);
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

const testShader = `
    precision mediump float;

    varying vec2 vVertexPosition;
    varying vec2 vUvs;

    uniform sampler2D uSampler;//The image data
    uniform float uValue;
    uniform float uX;
    uniform float uY;

    void main(void) {
        vec2 p = vec2(uX - 0.5, uY - 0.5) * 2.0; 
        vec2 q = vec2(vUvs.x - 0.5, vUvs.y - 0.5) * 2.0;
        if(pow(q.x, 2.0) + pow(q.y, 2.0) < 1.0) {
            vec3 a = vec3(p.x, p.y, pow(1.0 - pow(p.x, 2.0) - pow(p.y, 2.0), 0.5));
            vec3 b = vec3(q.x, q.y, pow(1.0 - pow(q.x, 2.0) - pow(q.y, 2.0), 0.5));
            float d = acos(dot(a, b));
            if(d < 0.5) {
                gl_FragColor.a = pow(1.0 - pow(q.x, 2.0) - pow(q.y, 2.0), 0.5) * (0.5-d);
                gl_FragColor.b = 1.0;
            } else {
                gl_FragColor.b = 0.0;
                gl_FragColor.a = 0.0;
            }
            gl_FragColor.r = uValue;
            gl_FragColor.rgb *= gl_FragColor.a;
        }
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
            gl_FragColor.rg = vec2(0.0, 0.0);
        }
        light = texture2D(lightB, vUvs);
        if(light.r + light.g + light.b > 0.0) {
            gl_FragColor.ba = vUvs;
        } else {
            gl_FragColor.ba = vec2(0.0, 0.0);
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
        vec2 uv = vVertexPosition / dim * (dim / min(dim.x, dim.y)) * 1.5;
        vec3 N = normalize(texture2D(uNormal, uv).xyz * 2.0 - 1.0); // Normal vector
        vec2 nnA = texture2D(uLightDir, vUvs).xy;
        vec2 nnB = texture2D(uLightDir, vUvs).zw;

        vec3 vertexPos = vec3(vVertexPosition, 0.0);
        vec3 lightPosA = vec3(nnA * dim, 250.0);
        vec3 lightPosB = vec3(nnB * dim, 250.0);
        
        vec3 LA = normalize(lightPosA - vertexPos); // LightA direction
        vec3 LB = normalize(lightPosB - vertexPos); // LightA direction
        
        float shininess = (texture2D(uRoughness, uv).r) * 150.0;
        float specularA = pow(max(reflect(-LA, N).z, 0.0), shininess);
        float specularB = pow(max(reflect(-LB, N).z, 0.0), shininess);

        // For more complicated scenes.
        // float lambertian = max(dot(L, N), 0.0);
        // if(lambertian > 0.0) {
        //     vec3 R = reflect(-L, N);      // Reflected light vector
        //     vec3 V = normalize(vec3(dim*0.5, 2000.0)-vertexPos); // Vector to viewer
        //     float specAngle = max(dot(R, V), 0.0);
        //     specular = pow(specAngle, shininess);
        // }

        vec4 lightColorA = texture2D(uLightA, vUvs);
        float influenceA = 1.0 - lightColorA.a;
        lightColorA *= influenceA;

        vec4 lightColorB = texture2D(uLightB, vUvs);
        float influenceB = 1.0 - lightColorB.a;
        lightColorB *= influenceB;

        gl_FragColor = vec4(mix(
                                mix(dot(LA, N) * mix(texture2D(uTexture,uv).rgb, lightColorA.rgb, 0.7),
                                    specularA * lightColorA.rgb, 0.3) * influenceA,
                                mix(dot(LB, N) * mix(texture2D(uTexture,uv).rgb, lightColorB.rgb, 0.6),
                                    specularB * lightColorB.rgb, 0.8) * influenceB * 2.0,
                                0.5
                            )
                            * pow(texture2D(uAmbient, uv).r, 1.5) * 2.0, 1.0);
    }`;


    const old = `
    float sampleLum(vec2 dir, float radius) {
        vec4 c = texture2D(uLight, (vVertexPosition + dir*radius) / vec2(uW, uH));
        return c.r + c.b + c.g;
        return (c.r + c.r + c.r + c.b + c.g + c.g + c.g + c.g);
    }
    
    vec2 lightDir() {
        float r = 20.0;
        float sqrt3over2 = pow(3.0, 0.5)/2.0;
        vec2 b = vec2(1.0, 0.0);
        vec2 c = vec2(-0.5, sqrt3over2);
        vec2 a = vec2(-0.5, -sqrt3over2);
        float v1 = sampleLum(a, r);
        float v2 = sampleLum(b, r);
        float v3 = sampleLum(c, r);
    
        vec2 p = a;
        vec2 q = b;
        if(v1 < min(v2, v3)) {
            p = b;
            q = c;
        }
        if(v2 < min(v1, v3)) {
            p = a;
            q = c;
        }
    
        vec2 s;
        float v_s;
        float v_p = sampleLum(p, r);
        float v_q = sampleLum(q, r);
        for(int i = 0; i < 16; i++) {
            s = normalize(p + q);
            v_s = sampleLum(s, r);
            v_p = sampleLum(p, r);
            v_q = sampleLum(q, r);
            if(v_p < v_s && v_q < v_s) {
                p = normalize(mix(s, p, v_p/v_s));
                q = normalize(mix(s, q, v_q/v_s));
                continue;
            }
            if(v_p < v_s) {
                p = normalize(mix(s, p, v_p/v_s));
                continue;
            }
            if(v_q < v_s) {
                q = normalize(mix(s, q, v_q/v_s));
                continue;
            }
            vec2 ps = normalize(mix(p, s, v_s/v_p));
            vec2 qs = normalize(mix(q, s, v_s/v_q));
            p = cmul(ccjg(cmul(p, -ps)), ps);
            p = cmul(ccjg(cmul(q, -qs)), qs);
            r *= 2.0;
            continue;
            
            if(sampleLum(p, r) < sampleLum(q, r)) {
                p = s;
            } else {
                q = s;
            }
        }
        return s;
    }
    `;

function voronoiShader(source, radius, uniforms) {
    return new PIXI.Shader.from(vertexShader, fragmentVoronoi.replace(/SOURCE/g, source).replace(/RADIUS/g, (1/radius).toFixed(20)), uniforms);
}