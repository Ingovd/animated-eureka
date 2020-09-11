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

const fragmentNeon = `
    precision mediump float;

    varying vec2 vVertexPosition;
    varying vec2 vUvs;

    uniform sampler2D uSampler;//The image data
    main {

    }`;

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
    
    uniform float uX;
    uniform float uY;
    uniform float uW;
    uniform float uH;

    void main(void) {
        vec2 uv = vUvs;//fract(vUvs);
        vec3 vertexPos = vec3(vVertexPosition, 0.0);
        vec3 lightPos = vec3(uX, uY, 500.0);
        float shininess = (texture2D(uRoughness, uv).r) * 100.0;

        vec3 L = normalize(lightPos - vertexPos);
        vec3 N = normalize(texture2D(uNormal, uv).xyz * 2.0 - 1.0);
        float lambertian = max(dot(L, N), 0.0);
        float specular = 0.0;
        if(lambertian > 0.0) {
            vec3 R = reflect(-L, N);      // Reflected light vector
            vec3 V = normalize(vec3(uW*0.5, uH*0.5, 1000000000.0)-vertexPos); // Vector to viewer
            // vec3 V = vec3(0.0, 0.0, -1.0);
            // Compute the specular term
            float specAngle = max(dot(R, V), 0.0);
            specular = pow(specAngle, shininess);
        }
        gl_FragColor = vec4((0.6 * lambertian * texture2D(uTexture,uv).rgb +
                            0.1 * specular * vec3(1.0, 1.0, 1.0))
                            * pow(texture2D(uAmbient, uv).r, 0.5), 1.0);
        
        gl_FragColor.rgb += texture2D(uLight, vVertexPosition / vec2(uW, uH)).rgb;
        // gl_FragColor.rgb = specular * vec3(1.0, 1.0, 1.0);
        // gl_FragColor.rgb = texture2D(uHeight, uv).rgb;
        // if(distance(vVertexPosition, vec2(uX, uY)) < 100.0) {
        //     gl_FragColor.r = uv.x;
        //     gl_FragColor.g = uv.y;
        // }
    }`;