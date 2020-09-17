class Game extends PIXI.Application {
    constructor(appOptions) {
        super(appOptions);
        this.gameObjects = [];
        this.animations = [];
        this.load();
        
        this.w = window.innerWidth;
        this.h = window.innerHeight;
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

        const options = {resolution: 0.2, width: this.w, height: this.h,
                         scaleMode: PIXI.SCALE_MODES.NEAREST};
        this.lightBufferA = PIXI.RenderTexture.create(options);
        this.lightBufferB = PIXI.RenderTexture.create(options);
    }

    load() {
        this.loader.add('closed', "assets/sprites/chest_closed.png")
                   .add('opened', "assets/sprites/chest_open.png")
                   .add('cloud', "assets/sprites/item_cloud.png")
                   .add('leaf', "assets/sprites/item_green_leaf.png")
                   .add('suit', "assets/sprites/item_tanooki_suit.png")
                   .add('star', "assets/sprites/item_star.png")
                   .add('particles', "assets/sprites/particles.png")
                   .add('eureka', "assets/neon/eureka_rainbow.png")
                   .add('bar', "assets/neon/bar.png")
                   .add('items', "assets/neon/item_map.png")
                   .add('chest', "assets/neon/chest_map.png")
                   .add('wall_color', "assets/wall/wall_baseColor.jpg")
                   .add('wall_normal', "assets/wall/wall_normal.jpg")
                   .add('wall_roughness', "assets/wall/wall_roughness.jpg")
                   .add('wall_ambient', "assets/wall/wall_ambientOcclusion.jpg")
                   .add('wall_height', "assets/wall/wall_height.png");
        this.loader.load((loader, resources) => {
            G.closed = resources.closed.texture;
            G.opened = resources.opened.texture;
            G.cloud = resources.cloud.texture;
            G.leaf = resources.leaf.texture;
            G.suit = resources.suit.texture;
            G.star = resources.star.texture;

            G.particles = resources.particles.texture;

            G.eureka = resources.eureka.texture;
            G.bar = resources.bar.texture;
            G.items = resources.items.texture;
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
        this.background = new Wall(0.2);
        this.stage.addChild(this.background);

        this.list = new ListLayout(500);
        this.list.scale.set(1.0);
        this.stage.addChild(this.list);

        const properties = {position: true, uvs: true};
        this.nrParticles = 10000;
        this.particleIndex = 0;
        this.particleContainer = new PIXI.ParticleContainer(this.nrParticles, properties);
        this.particlePool = [];
        for(let i = 0; i < this.nrParticles; i++) {
            var particle = new Particle();
            this.particlePool[i] = particle;
            this.particleContainer.addChild(particle.sprite);
        }
        this.stage.addChild(this.particleContainer);

        this.list.add(new NeonItems);
        this.list.add(new NeonChest());


        this.cursor = new Cursor();
        this.stage.addChild(this.cursor);

        this.list.center();
        this.ticker.add(this.update.bind(this));
        this.ticker.maxFPS = 40;
        this.resizeRenderer();
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

        this.gameObjects.forEach(element => {
            element.update(delta);
        });

        this.list.filters = [];
        this.renderer.render(this.list, this.lightBufferA);
        this.particleContainer.calculateBounds();
        this.renderer.render(this.particleContainer, this.lightBufferB);
        this.background.illuminate(this.lightBufferA, this.lightBufferB);
        this.list.filters = [new PIXI.filters.BlurFilter(1, 1, 1, 15), new PIXI.Filter(spriteVertex, spriteFragment)];
    }

    resizeRenderer(){
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.resize(width, height);
        this.list.position.set(window.innerWidth/2, window.innerHeight/2);
    }
}

class Particle extends Animation {
    constructor() {
        super();
        this.frame = new PIXI.Rectangle(0,0, 15, 15);
        this.texture = new PIXI.Texture(G.particles, this.frame);
        this.sprite = new PIXI.Sprite.from(this.texture);
        this.position.x = -1000;
        this.position.y = -1000;
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
        this.frame.x = Math.min(Math.floor(this.t / 30), 9) * 15;
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

class Cursor extends GameObject {
    constructor() {
        const sprite = new PIXI.Sprite.from(G.eureka);
        super(sprite);
        sprite.visible = false;
    }

    update() {
        this.position.x = G.renderer.plugins.interaction.mouse.global.x;
        this.position.y = G.renderer.plugins.interaction.mouse.global.y;

        let particle = Math.floor(Math.random() * 10);
        if(G.renderer.plugins.interaction.mouse.buttons == 1)
            for(let i = 0; i < 100; i++) {
                let v = {x: Math.sin((i + Math.random()) * Math.PI / 10), y: Math.cos((i + Math.random()) * Math.PI / 10)};
                v.x *= 4 + Math.random() * 2;
                v.y *= 4 + Math.random() * 2;
                G.activateParticle(9, this.position.x, this.position.y, v);
            }
    }
}

class ListLayout extends PIXI.Container {
    constructor(space) {
        super();
        this.space = space;
        this.scale.set(1.0);
        this.lights = [];
    }

    add(element) {
        element.position.y = this.children.length * this.space;
        this.lights.push(element);
        this.addChild(element);
    }

    center() {
        const rect = this.getLocalBounds();
        this.pivot.set(rect.width/2, rect.height/2);
        this.position.set(window.innerWidth/2, window.innerHeight/2);
        this.transform.updateLocalTransform();
    }
}

class Wall extends PIXI.Container {
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
        
        this.positionUniforms = {lightA: this.bufferC, lightB: this.bufferD, dim: G.dim};
        const positionShader = new PIXI.Shader.from(vertexShader, positionFragment, this.positionUniforms);
        this.positionQuad = new PIXI.Mesh(G.geometry, positionShader);
        // this.addChild(this.positionQuad);

        this.jfaUniforms = {uTexIn: this.bufferA, step: 0.0, dim: G.dim};
        const jfaShader = new PIXI.Shader.from(vertexShader, jfaFragment, this.jfaUniforms);
        this.jfaQuad = new PIXI.Mesh(G.geometry, jfaShader);
        // this.addChild(this.jfaQuad);
        
        this.lightBlendUniforms = {uTextureA: this.bufferA, uTextureB: this.bufferB};
        this.lightBlend = new PIXI.Filter(spriteVertex, expBlend, this.lightBlendUniforms);
        this.smallBlur = new PIXI.filters.KawaseBlurFilter(4, 5, true);
        this.smallBlur.pixelSize = [4,4];
        // this.smallBlur = new PIXI.filters.BlurFilter(10, 2, 1, 5);
        this.smallBlur.blendMode = PIXI.BLEND_MODES.ADD;
        this.largeBlur = new PIXI.filters.BlurFilter(300,2,1,15);
        this.largeBlur.repeatEdgePixels = true;
        this.largeBlur.blendMode = PIXI.BLEND_MODES.ADD;

        this.voronoiUniforms = {uNN: this.bufferA, uLights: this.bufferC, dim: G.dim};
        this.voronoiShaderA = voronoiShader("rg", 400.0, this.voronoiUniforms);
        this.voronoiShaderB = voronoiShader("ba", 100.0, this.voronoiUniforms);
        this.voronoiQuad = new PIXI.Mesh(G.geometry, this.voronoiShaderA);
        this.voronoiQuad.filters = [this.smallBlur];
        // this.addChild(this.voronoiQuad);

        this.blurSprite = new PIXI.Sprite.from(this.bufferC);
        this.blurSprite.filters = [this.largeBlur];
        // this.addChild(this.blurSprite);
    }

    illuminate(lightsA, lightsB) {
        // Render the XY-positions of each pixel light source
        // from two light layers
        this.positionUniforms.lightA = lightsA;
        this.positionUniforms.lightB = lightsB;
        G.renderer.render(this.positionQuad, this.bufferA);
        // return;

        // Perform JFA to generate a Nearest Neighbour map
        let inBuffer = this.bufferA;
        let outBuffer = this.bufferB;
        for(let i = 7; i >= 0; i--) {
            this.jfaUniforms.uTexIn = inBuffer;
            this.jfaUniforms.step = Math.pow(2, i) / this.lightRes;
            G.renderer.render(this.jfaQuad, outBuffer);
            [inBuffer, outBuffer] = [outBuffer, inBuffer];
        }
        this.bufferA = inBuffer; // Holds NN map
        this.bufferB = outBuffer; // Reusable
        // return;

        // Colour the NN map by the nearest light source
        this.voronoiUniforms.uNN = this.bufferA;
        this.voronoiUniforms.uLights = lightsA;
        this.voronoiQuad.shader = this.voronoiShaderA;
        G.renderer.render(this.voronoiQuad, this.bufferB); // B holds blurred near-lightA
        // return;

        // Smooth the coloured NN map to simulate light blending at a distance
        this.blurSprite.texture = this.bufferB;
        this.blurSprite.filters  = [this.largeBlur];
        G.renderer.render(this.blurSprite, this.bufferC); // C holds blurred far-lightA
        // return;

        // Blend the near and far light colours
        this.lightBlendUniforms.uTextureA = this.bufferB;
        this.lightBlendUniforms.uTextureB = this.bufferC;
        this.blurSprite.filters = [this.lightBlend];
        G.renderer.render(this.blurSprite, this.bufferD); // D holds lightA
        // return;

        this.voronoiUniforms.uLights = lightsB;
        this.voronoiQuad.shader = this.voronoiShaderB;
        G.renderer.render(this.voronoiQuad, this.bufferC); // C holds blurred near-lightB
        // return;

        // Smooth out the NN map for smoother light directions
        this.blurSprite.texture = this.bufferA;
        this.blurSprite.filters  = [this.smallBlur];
        G.renderer.render(this.blurSprite, this.bufferE);
        // return;

        // Set the textures for rendering the background
        this.uniforms.uLightDir = this.bufferE;
        this.uniforms.uLightA = this.bufferD;
        this.uniforms.uLightB = this.bufferC;
    }
}

class NeonChest extends InteractiveObject {
    constructor() {
        super();
        this.color = {r:1.0, g:0.5, b:0.1};
        this.base = new NeonLight(G.chest, 0, 7, this.color);
        this.base.setOnStates(this.dfa, ["idle", "selected", "active"]);
        this.addChild(this.base);
        this.closeLid = new NeonLight(G.chest, 1, 3, this.color);
        this.closeLid.setOnStates(this.dfa, ["idle"]);
        this.addChild(this.closeLid);
        this.peekLid = new NeonLight(G.chest, 2, 7, this.color);
        this.peekLid.setOnStates(this.dfa, ["selected"]);
        this.addChild(this.peekLid);
        this.openLid = new NeonLight(G.chest, 3, 4, this.color);
        this.openLid.setOnStates(this.dfa, ["active"]);
        this.addChild(this.openLid);
        this.dfa.enterState("idle");
        this.hitArea = this.base.getLocalBounds();
        this.scale.set(0.8);
    }
}

class NeonItems extends InteractiveObject {
    constructor() {
        super();
        this.lights = new PIXI.Container();
        this.shield = new NeonLight(G.items, 0, 7, {r: 1.0, g: 0.0, b: 0.0});
        this.shield.setOnStates(this.dfa, ["idle"]);
        this.lights.addChild(this.shield);
        this.sword = new NeonLight(G.items, 1, 7, {r: 0.0, g: 1.0, b: 0.0});
        this.sword.setOnStates(this.dfa, ["selected"]);
        this.lights.addChild(this.sword);
        this.rupee = new NeonLight(G.items, 2, 4, {r: 0.0, g: 0.0, b: 1.0});
        this.rupee.setOnStates(this.dfa, ["active"]);
        this.lights.addChild(this.rupee);
        this.dfa.enterState("idle");
        this.hitArea = this.lights.getLocalBounds();
        this.addChild(this.lights);
    }
}

class Chest extends InteractiveObject {
    constructor() {
        const sprite = new PIXI.Sprite.from(G.closed);
        sprite.anchor.set(0.5);
        super(sprite);

        const idleOscillate = new ScaleAnimation(new Oscillation(0.05, 0.05, 1.05));
        const hoverGrow = new ScaleAnimation(new Interpolate(30, 1, 2, .2));
        const selectAnimation = new TransitionAnimation(this.dfa, {idle: idleOscillate, selected: hoverGrow, active: hoverGrow});
        this.addAnimation(selectAnimation);

        const activeWiggle = new RotationAnimation(new Oscillation(0.5, 0.1, 0));
        const activeAnimation = new TransitionAnimation(this.dfa, {active: activeWiggle});
        this.addAnimation(activeAnimation);

        var self = this;
        this.dfa.addOnEnter("active", function() {
            for (let i = 0; i < 100; i++) {
                self.addChild(self.generateItem());
            }
            self.timer = setTimeout(self.action.bind(self), 1000);
        });
        this.dfa.addOnExit("active", function() {
            clearTimeout(self.timer);
        });
    }
}