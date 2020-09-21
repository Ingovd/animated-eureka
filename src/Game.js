class Game extends PIXI.Application {
    constructor(appOptions) {
        super(appOptions);
        this.animations = [];
        this.load();
        
        this.scale = 1.0;
        this.w = window.innerWidth * this.scale;
        this.h = window.innerHeight * this.scale;
        this.dim = [this.w, this.h];
        const xPixel = -0.5 / this.w;
        const yPixel = -0.5 / this.h;
        this.geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition', // the attribute name
            [0, 0, // x, y
                this.w, 0, // x, y
                this.w, this.h,
                0, this.h], // x, y
            2) // the size of the attribute
        .addAttribute('aUvs', // the attribute name
            [xPixel, yPixel, // u, v
                1 + xPixel, yPixel, // u, v
                1 + xPixel, 1 + yPixel,
                xPixel, 1 + yPixel], // u, v
            2) // the size of the attribute
        .addIndex([0, 1, 2, 0, 2, 3]);

        const options = {resolution: 0.1, width: this.w, height: this.h};
        this.lightBufferA = PIXI.RenderTexture.create(options);
        this.lightBufferB = PIXI.RenderTexture.create(options);
    }

    load() {
        this.loader.add('particles', "assets/sprites/particles.png")
                   .add('items', "assets/sprites/item_map.png")
                   .add('chest', "assets/sprites/chest_map.png")
                   .add('wall_color', "assets/wall/wall_baseColor.jpg")
                   .add('wall_normal', "assets/wall/wall_normal.jpg")
                   .add('wall_roughness', "assets/wall/wall_roughness.jpg")
                   .add('wall_ambient', "assets/wall/wall_ambientOcclusion.jpg")
                   .add('wall_height', "assets/wall/wall_height.png");
        this.loader.load((loader, resources) => {
            G.particles = resources.particles.texture;
            G.itemLights = resources.items.texture;
            G.chest = resources.chest.texture;
            G.wall_color = resources.wall_color.texture;
            G.wall_color.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
            G.wall_normal = resources.wall_normal.texture;
            G.wall_normal.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
            G.wall_roughness = resources.wall_roughness.texture;
            G.wall_roughness.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
            G.wall_ambient = resources.wall_ambient.texture;
            G.wall_ambient.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
            G.wall_height = resources.wall_height.texture;
            G.wall_height.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
        });
        this.loader.onComplete.add(this.init.bind(this));
    }

    init() {
        const self = this;
        this.background = new Wall(0.2);
        this.stage.addChild(this.background);

        this.list = new ListLayout(500, 0);
        this.list.blendMode = PIXI.BLEND_MODES.ADD;
        this.list.scale.set(0.8);
        this.stage.addChild(this.list);

        this.setupScene();

        this.list.center();
        this.ticker.add(this.update.bind(this));
        this.ticker.maxFPS = 40;
        this.resizeRenderer();
    }

    setupScene() {
        const self = this;
        const properties = {position: true, uvs: true};
        this.nrParticles = 10000;
        this.particleIndex = 0;
        this.particleContainer = new PIXI.ParticleContainer(this.nrParticles, properties);
        this.particleContainer.blendMode = PIXI.BLEND_MODES.ADD;
        this.particlePool = [];
        for(let i = 0; i < this.nrParticles; i++) {
            var particle = new Particle();
            this.particlePool[i] = particle;
            this.particleContainer.addChild(particle.sprite);
        }
        this.stage.addChild(this.particleContainer);

        this.items = [];
        this.chests = [];
        for(let i = 0; i < 3; i++) {
            let container = new ListLayout(0, 550);
            this.items[i] = new NeonItems();
            container.add(this.items[i]);
            this.chests[i] = new NeonChest();
            container.add(this.chests[i]);
            this.list.add(container);
        }

        // Basic cycle animation before a chest is selected
        const abc = new State("A", cycleSix.states, cycleSix.transitions);
        abc.addState("inactive");
        this.teaseCycle = new Cycler(abc, "next", 40);
        this.teaseCycle.start();
        this.items[0].bindStates(abc, {shield: ["A"], sword: ["C"], rupee: ["E"]});
        this.items[1].bindStates(abc, {shield: ["B"], sword: ["D"], rupee: ["F"]});
        this.items[2].bindStates(abc, {shield: ["C"], sword: ["E"], rupee: ["A"]});


        // For each chest, connect its mouse interactivity to the behaviour of the others
        for(let i = 0; i < 3; i++) {
            this.chests[i].dfa.addOnEnter("clicked", function() {
                self.teaseCycle.dfa.enterState("inactive");
                self.itemSequence(i);
            });
            this.chests[i].dfa.addOnEnter("active", function() {
                self.teaseCycle.threshold = 8;
            });
            for(let j = 0; j < 3; j++) {
                if(j == i) continue;
                this.chests[i].dfa.addOnEnter("clicked", function() {
                    self.chests[j].disable();
                });
                this.chests[i].dfa.addOnEnter("selected", function() {
                    self.teaseCycle.threshold = 20;
                    self.chests[j].stopIdle();
                });
                this.chests[i].dfa.addOnEnter("idle", function() {
                    self.teaseCycle.threshold = 40;
                    self.chests[j].startIdle();
                });
            }
        }
    }

    reset() {
        this.teaseCycle.dfa.enterState("A");
        this.chests.forEach(chest => {
            chest.enable();
        });
        this.items.forEach(item => {
            item.switch(false);
        })
    }

    itemSequence(chest) {
        const p = Math.random();
        const item = p<0.2?0:(p<0.5?1:2);
        
        const items = ["shield", "sword", "rupee"];
        const decay = new DecayBlink(items, 200, 100, item);
        this.items[chest].bindStates(decay.dfa, {sword: ["sword"], shield: ["shield"], rupee:["rupee"]});
        decay.start();

        const self = this;
        const fireworks = new DelayedRepeater(200, 5 + 10 * item, function() {
            self.fireWorks(3 - item);
        });
        fireworks.start();

        setTimeout(function() {
            fireworks.stop();
            decay.stop();
            decay.dfa.clear();
            self.reset();
        }, 10000);
    }

    fireWorks(intensity) {
        const x = this.w * Math.random();
        const y = this.h * (Math.random() / 2);
        const color = Math.floor(Math.random() * 10);
        let getColor = function(i) {
            return color;
        };
        if(color < 9) {
            getColor = function(i) {
                return (color + Math.floor(3 * i / nrParticles)) % 9;
            }
        }
        const nrParticles = 400*intensity;
        for(let i = 0; i < nrParticles; i++) {
            let v = {x: Math.sin((i + Math.random()) * Math.PI / 10), y: Math.cos((i + Math.random()) * Math.PI / 10)};
            v.x *= 4 + Math.random() * 2;
            v.y *= 4 + Math.random() * 2;
            G.activateParticle(getColor(i), x, y, v);
        }
    }

    activateParticle(particleID, x, y, v) {
        this.particlePool[this.particleIndex].activate(particleID, x, y, v);
        this.particleIndex += 1;
        this.particleIndex %= this.nrParticles;
    }

    update(delta) {
        let j = 0
        for (let i = 0; i < this.animations.length; i++) {
            this.animations[j] = this.animations[i];
            const active = this.animations[i].update(delta);
            j += active;
        }
        this.animations = this.animations.slice(0, j);

        this.list.filters = [];
        this.renderer.render(this.list, this.lightBufferA);
        this.particleContainer.calculateBounds();
        this.renderer.render(this.particleContainer, this.lightBufferB);
        this.background.illuminate(this.lightBufferA, this.lightBufferB);
        this.list.filters = [new PIXI.filters.BlurFilter(1, 1, 1, 15), new PIXI.Filter(spriteVertex, spriteFragment)];
    }

    resizeRenderer(){
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.renderer.resize(this.w, this.h);
        this.list.position.set(this.w/2, this.h/2);
    }
}

class ListLayout extends PIXI.Container {
    constructor(xSpace, ySpace) {
        super();
        this.xSpace = xSpace;
        this.ySpace = ySpace;
    }

    add(element) {
        element.position.x = this.children.length * this.xSpace;
        element.position.y = this.children.length * this.ySpace;
        this.addChild(element);
    }

    center() {
        const rect = this.getLocalBounds();
        this.pivot.set(rect.width/2, rect.height/2);
        this.position.set(G.w/2, G.h/2);
        this.transform.updateLocalTransform();
    }
}

class Particle extends Animation {
    constructor() {
        super();
        this.frame = new PIXI.Rectangle(0,0, 15, 15);
        this.texture = new PIXI.Texture(G.particles, this.frame);
        this.sprite = new PIXI.Sprite.from(this.texture);
        this.sprite.position.x = -6000;
        this.sprite.position.y = -6000;
    }

    activate(particleID, x, y, v) {
        this.frame.y = particleID * 15;
        this.frame.x = 0;
        this.sprite.position.set(x, y);
        this.v = v;
        this.sprite.visible = true;
        this.start();
    }

    animate(delta) {
        this.frame.x = Math.min(Math.floor(this.t / 10), 9) * 15;
        if(this.frame.x >= 150) {
            this.position.x = -1000;
            this.position.y = -1000;
            this.stop();
        }
        this.texture.updateUvs();
        this.sprite.position.x += this.v.x * delta;
        this.sprite.position.y += this.v.y * delta;
        this.v.y += 0.1 * delta;
    }
}

/** @class Wall containing all logic for rendering the background */
class Wall extends PIXI.Container {
    /**
     * 
     * @param {number} resolution The resolution as fraction of renderer
     * to be used for the render buffers.
     */
    constructor(resolution) {
        super();
        this.lightRes = resolution;

        const options = {resolution: resolution, width: G.w, height: G.h,
            scaleMode: PIXI.SCALE_MODES.NEAREST,
            type: PIXI.TYPES.FLOAT};
        this.bufferA = PIXI.RenderTexture.create(options);
        this.bufferB = PIXI.RenderTexture.create(options);
        options.scaleMode = PIXI.SCALE_MODES.LINEAR;
        this.bufferC = PIXI.RenderTexture.create(options);
        this.bufferD = PIXI.RenderTexture.create(options);
        this.bufferE = PIXI.RenderTexture.create(options);

        this.uniforms = {uTexture: G.wall_color,
                          uRoughness: G.wall_roughness,
                          uNormal: G.wall_normal,
                          uAmbient: G.wall_ambient,
                          uHeight: G.wall_height,
                          uLightNear: this.bufferC,
                          uLightFar: this.bufferC,
                          uLightDir: this.bufferB,
                          uX: 0.0, uY: 0.0, dim: G.dim};
        const shader = new PIXI.Shader.from(vertexShader, fragmentNormal, this.uniforms);
        const wallQuad = new PIXI.Mesh(G.geometry, shader);
        this.addChild(wallQuad);
        
        // For rendering all pixels with a light source
        this.positionUniforms = {lightA: this.bufferC, lightB: this.bufferD, dim: G.dim};
        const positionShader = new PIXI.Shader.from(vertexShader, positionFragment, this.positionUniforms);
        this.positionQuad = new PIXI.Mesh(G.geometry, positionShader);

        // For rendering the NN map (aka voronoi diagram)
        this.jfaUniforms = {uTexIn: this.bufferA, step: 0.0, dim: G.dim};
        const jfaShader = new PIXI.Shader.from(vertexShader, jfaFragment, this.jfaUniforms);
        this.jfaQuad = new PIXI.Mesh(G.geometry, jfaShader);
        
        this.lightBlendUniforms = {uTextureA: this.bufferA, uTextureB: this.bufferB};
        this.lightBlend = new PIXI.Filter(spriteVertex, expBlend, this.lightBlendUniforms);
        this.smallBlur = new PIXI.filters.KawaseBlurFilter(4, 5, true);
        this.smallBlur.pixelSize = [4,4];
        this.smallBlur.blendMode = PIXI.BLEND_MODES.ADD;
        this.largeBlur = new PIXI.filters.BlurFilter(300,2,1,15);
        this.largeBlur.repeatEdgePixels = true;
        this.largeBlur.blendMode = PIXI.BLEND_MODES.ADD;

        // For colouring the NN map
        this.voronoiUniforms = {uNN: this.bufferA, uLights: this.bufferC, dim: G.dim};
        this.voronoiShaderA = voronoiShader("rg", 400.0, this.voronoiUniforms);
        this.voronoiShaderB = voronoiShader("ba", 100.0, this.voronoiUniforms);
        this.voronoiQuad = new PIXI.Mesh(G.geometry, this.voronoiShaderA);
        this.voronoiQuad.filters = [this.smallBlur];

        // For rendering the blur passes
        this.blurSprite = new PIXI.Sprite.from(this.bufferC);
        this.blurSprite.filters = [this.largeBlur];
    }

    /**
     * 
     * @param {PIXI.Texture} lightsA Neon light source
     * @param {PIXI.Texture} lightsB Particle light source
     */
    illuminate(lightsA, lightsB) {
        // Render the XY-positions of each pixel light source
        // from two light layers
        this.positionUniforms.lightA = lightsA;
        this.positionUniforms.lightB = lightsB;
        G.renderer.render(this.positionQuad, this.bufferA);

        // Perform JFA to generate a Nearest Neighbour map
        let inBuffer = this.bufferA;
        let outBuffer = this.bufferB;
        for(let i = 5; i >= 0; i--) {
            this.jfaUniforms.uTexIn = inBuffer;
            this.jfaUniforms.step = Math.pow(2, i) / this.lightRes;
            G.renderer.render(this.jfaQuad, outBuffer);
            [inBuffer, outBuffer] = [outBuffer, inBuffer];
        }
        this.bufferA = inBuffer; // Holds NN map
        this.bufferB = outBuffer; // Reusable

        // Colour the NN map by the nearest lightA source
        this.voronoiUniforms.uNN = this.bufferA;
        this.voronoiUniforms.uLights = lightsA;
        this.voronoiQuad.shader = this.voronoiShaderA;
        G.renderer.render(this.voronoiQuad, this.bufferB); // B holds blurred near-lightA

        // Smooth the coloured NN map to simulate light blending at a distance
        this.blurSprite.texture = this.bufferB;
        this.blurSprite.filters  = [this.largeBlur];
        G.renderer.render(this.blurSprite, this.bufferC); // C holds blurred far-lightA

        // Blend the near and far light colours
        this.lightBlendUniforms.uTextureA = this.bufferB;
        this.lightBlendUniforms.uTextureB = this.bufferC;
        this.blurSprite.filters = [this.lightBlend];
        G.renderer.render(this.blurSprite, this.bufferD); // D holds lightA

        // Colour the lightB NN map
        this.voronoiUniforms.uLights = lightsB;
        this.voronoiQuad.shader = this.voronoiShaderB;
        G.renderer.render(this.voronoiQuad, this.bufferC); // C holds blurred near-lightB

        // Smooth out the NN map for smoother light directions
        this.blurSprite.texture = this.bufferA;
        this.blurSprite.filters  = [this.smallBlur];
        G.renderer.render(this.blurSprite, this.bufferE);

        // Set the textures for rendering the background
        this.uniforms.uLightDir = this.bufferE;
        this.uniforms.uLightA = this.bufferD;
        this.uniforms.uLightB = this.bufferC;
    }
}