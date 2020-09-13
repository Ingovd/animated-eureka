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
        if (color.a != 0.0){
            color.r = delta;
            color.g -= delta;
            color.b -= delta;
        }
        gl_FragColor = color;
        // gl_FragColor.g = 1.0;
        // gl_FragColor.rg = vTextureCoord;
        gl_FragColor *= color.a;
}`;

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
        vec2 nn = texture2D(uNN, vVertexPosition/dim).rg;
        gl_FragColor = vec4(nn, vec2(1.0));
        // return;

        gl_FragColor = texture2D(uLights, nn);
        gl_FragColor.a = 1.0;
        // return;

        float d = 1.0 - min(1.0, floor(distance(vVertexPosition, nn * dim) / 50.0));
        gl_FragColor *= d;
        gl_FragColor /= max3(gl_FragColor.rgb);
    }
`;

const jfaFragment =`
    precision mediump float;

    varying vec2 vVertexPosition;
    varying vec2 vUvs;

    uniform sampler2D uTexIn;

    uniform float step;
    uniform vec2 dim;

    vec4 closest(in vec4 p, in vec4 q) {
        float d_p = distance(p.xy * dim, vVertexPosition);
        float d_q = distance(q.xy * dim, vVertexPosition);
        if(p.a == 0.0) {
            d_p = 10.0 * (dim.x + dim.y);
        }
        if(q.a == 0.0) {
            d_q = 10.0 * (dim.x + dim.y);
        }
        if(d_p < d_q) {
            return p;
        } else {
            return q;
        }
    }

    void main() {
        if(step < 0.1) {
            vec4 light = texture2D(uTexIn, vVertexPosition / dim);
            if(light.r + light.g + light.b > 0.0) {
                gl_FragColor = vec4(vVertexPosition / dim, 0.0, 1.0);
            } else {
                gl_FragColor = vec4(0.0, 1.0, 0.0, 0.0);
            }
            return;
        }

        vec4 current = texture2D(uTexIn, vVertexPosition / dim);
        vec2 offset = vec2(0.0, 0.0);
        for(float i = 0.0; i < 9.0; i++) {
            offset = vec2(mod(i, 3.0) - 1.0, floor(i/3.0) - 1.0) * step;
            current = closest(current, texture2D(uTexIn, (vVertexPosition + offset) / dim));
        }
        gl_FragColor = current;
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
    uniform sampler2D uLight;
    uniform sampler2D uLightDir;
    uniform sampler2D uNN;
    
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
        vec2 uv = vUvs;
        vec2 nn = texture2D(uNN, vVertexPosition/dim).xy;

        vec3 vertexPos = vec3(vVertexPosition, 0.0);
        float influence = pow(max(1.0 - distance(vVertexPosition, nn * dim) / 400.0, 0.0), 2.0);
        // influence = 1.0;

        vec3 lightPos = vec3(texture2D(uLightDir, vVertexPosition/dim).xy * dim, 150.0);
        float shininess = (texture2D(uRoughness, uv).r) * 100.0;

        vec3 L = normalize(lightPos - vertexPos);
        vec3 N = normalize(texture2D(uNormal, uv).xyz * 2.0 - 1.0);
        float lambertian = max(dot(L, N), 0.0);
        float specular = 0.0;
        if(lambertian > 0.0) {
            vec3 R = reflect(-L, N);      // Reflected light vector
            vec3 V = normalize(vec3(dim*0.5, 1000000000.0)-vertexPos); // Vector to viewer
            float specAngle = max(dot(R, V), 0.0);
            specular = pow(specAngle, shininess);
        }
        vec3 lightColor = texture2D(uLight, vVertexPosition/dim).rgb;
        lightColor /= max3(lightColor);
        // lightColor = vec3(0.0, 1.0, 1.0);
        lightColor *= influence;
        // lightColor = vec3(1.0);
        gl_FragColor = vec4(mix(lambertian * mix(texture2D(uTexture,uv).rgb, lightColor, 0.2),
                                specular * lightColor, 0.2)
                            * pow(texture2D(uAmbient, uv).r, 0.5) * influence, 1.0);
        
        // gl_FragColor.rg =  texture2D(uNN, vVertexPosition/dim).xy;
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