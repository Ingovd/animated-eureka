class Game extends PIXI.Application {
    constructor(options) {
        super(options);
        this.gameObjects = [];
        this.animations = [];
        this.load();
    }

    load() {
        this.loader.add('closed', "assets/sprites/chest_closed.png")
                   .add('opened', "assets/sprites/chest_open.png")
                   .add('cloud', "assets/sprites/item_cloud.png")
                   .add('leaf', "assets/sprites/item_green_leaf.png")
                   .add('suit', "assets/sprites/item_tanooki_suit.png")
                   .add('star', "assets/sprites/item_star.png")
                   .add('eureka', "assets/neon/eureka_rainbow.png")
                   .add('bar', "assets/neon/bar.png")
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

            G.eureka = resources.eureka.texture;
            G.bar = resources.bar.texture;

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
        // this.stage.filters = [new PIXI.filters.AdvancedBloomFilter()];
        // this.stage.filters= [new PIXI.filters.BlurFilter()];

        this.background = new Wall(window.innerWidth, window.innerHeight);
        this.stage.addChild(this.background);

        this.list = new ListLayout(350);
        this.stage.addChild(this.list);

        

        // for (let i = 0; i < 1; i++) {
        //     this.list.add(new Chest());      
        // }


        // this.test = new Sphere();
        // this.list.add(this.test);

        this.list.add(new Light(0));
        // this.list.add(new Light(Math.PI*2/3));
        // this.list.add(new Light(Math.PI*4/3));

        this.cursor = new Cursor();
        this.stage.addChild(this.cursor);

        this.list.center();
        this.ticker.add(this.update.bind(this));
        this.resizeRenderer();
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

        this.background.update();
    }

    resizeRenderer(){
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.resize(width, height);
        this.list.position.set(window.innerWidth/2, window.innerHeight/2);
    }
}

class ListLayout extends PIXI.Container {
    constructor(space) {
        super();
        this.space = space;
    }

    add(element) {
        element.position.x = this.children.length * this.space;
        this.addChild(element);
    }

    overExpose() {
        this.filters= [new PIXI.filters.BlurFilter(1, 2, 1, 15), new PIXI.Filter(spriteVertex, spriteFragment)];
    }

    center() {
        const rect = this.getLocalBounds();
        this.pivot.set(rect.width/2, rect.height/2);
        this.position.set(window.innerWidth/2, window.innerHeight/2);
        this.transform.updateLocalTransform();
    }
}

class Wall extends PIXI.Container {
    constructor(width, height) {
        super();
        this.w = width;
        this.h = height;
        this.dim = [this.w, this.h];
        console.log(width)
        console.log(this.w)
        const size = 1.5 / Math.min(width, height);
        this.geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition', // the attribute name
            [0, 0, // x, y
                this.w, 0, // x, y
                this.w, this.h,
                0, this.h], // x, y
            2) // the size of the attribute
        .addAttribute('aUvs', // the attribute name
            [0, 0, // u, v
                this.w*size, 0, // u, v
                this.w*size, this.h*size,
                0, this.h*size], // u, v
            2) // the size of the attribute
        .addIndex([0, 1, 2, 0, 2, 3]);

        const options = {width: this.w, height: this.h, scaleMode: PIXI.SCALE_MODES.LINEAR};
        this.bufferA = PIXI.RenderTexture.create(options);
        this.bufferB = PIXI.RenderTexture.create(options);
        this.bufferC = PIXI.RenderTexture.create(options);
        this.bufferD = PIXI.RenderTexture.create(options);
        this.uniforms = {uTexture: G.wall_color,
                          uRoughness: G.wall_roughness,
                          uNormal: G.wall_normal,
                          uAmbient: G.wall_ambient,
                          uHeight: G.wall_height,
                          uLightNear: this.bufferC,
                          uLightFar: this.bufferC,
                          uLightDir: this.bufferB,
                          uX: 0.0, uY: 0.0, dim: this.dim};
        const shader = new PIXI.Shader.from(vertexShader, fragmentNormal, this.uniforms);
        const wallQuad = new PIXI.Mesh(this.geometry, shader);
        this.addChild(wallQuad);
        
        this.positionUniforms = {lightA: this.bufferC, lightB: this.bufferD, dim: this.dim};
        const positionShader = new PIXI.Shader.from(vertexShader, positionFragment, this.positionUniforms);
        this.positionQuad = new PIXI.Mesh(this.geometry, positionShader);
        // this.addChild(this.positionQuad);

        this.jfaUniforms = {uTexIn: this.bufferA, step: 0.0, dim: this.dim};
        const jfaShader = new PIXI.Shader.from(vertexShader, jfaFragment, this.jfaUniforms);
        this.jfaQuad = new PIXI.Mesh(this.geometry, jfaShader);
        // this.addChild(this.jfaQuad);
        
        this.lightBlendUniforms = {uTextureA: this.bufferA, uTextureB: this.bufferB};
        this.lightBlend = new PIXI.Filter(spriteVertex, expBlend, this.lightBlendUniforms);
        this.lightBlur = new PIXI.filters.BlurFilter(10,1,0.2,5);
        this.smallBlur = new PIXI.filters.KawaseBlurFilter(4, 5, true);
        this.smallBlur.pixelSize = [2,2];
        // this.smallBlur = new PIXI.filters.BlurFilter(10, 2, 0.5, 5);
        this.smallBlur.blendMode = PIXI.BLEND_MODES.ADD;
        this.largeBlur = new PIXI.filters.BlurFilter(200,2,0.01,15);
        this.largeBlur.repeatEdgePixels = false;
        this.largeBlur.blendMode = PIXI.BLEND_MODES.ADD;

        this.voronoiUniforms = {uNN: this.bufferA, uLights: this.bufferC, dim: this.dim};
        this.voronoiShaderA = voronoiShader("rg", 500.0, this.voronoiUniforms);
        this.voronoiShaderB = voronoiShader("ba", 100.0, this.voronoiUniforms);
        this.voronoiQuad = new PIXI.Mesh(this.geometry, this.voronoiShaderA);
        this.voronoiQuad.filters = [this.smallBlur];
        // this.addChild(this.voronoiQuad);

        this.blurSprite = new PIXI.Sprite.from(this.bufferC);
        this.blurSprite.filters = [this.largeBlur];
        // this.addChild(this.blurSprite);
    }

    update() {
        this.uniforms.uValue = 1.0;
        this.uniforms.uX = G.renderer.plugins.interaction.mouse.global.x;
        this.uniforms.uY = G.renderer.plugins.interaction.mouse.global.y;

        // Render the XY-positions of each pixel light source
        // from two light layers
        G.renderer.render(G.list, this.bufferC);
        G.renderer.render(G.cursor, this.bufferD);
        this.positionUniforms.lightA = this.bufferC;
        this.positionUniforms.lightB = this.bufferD;
        G.renderer.render(this.positionQuad, this.bufferA);

        // Perform JFA to generate a Nearest Neighbour map
        let inBuffer = this.bufferA;
        let outBuffer = this.bufferB;
        for(let i = 10; i >= 0; i--) {
            this.jfaUniforms.uTexIn = inBuffer;
            this.jfaUniforms.step = Math.pow(2, i);
            G.renderer.render(this.jfaQuad, outBuffer);
            [inBuffer, outBuffer] = [outBuffer, inBuffer];
        }
        this.bufferA = inBuffer; // Holds NN map
        this.bufferB = outBuffer; // Reusable

        // Colour the NN map by the nearest light source
        
        G.list.filters = [this.lightBlur];
        G.renderer.render(G.list, this.bufferC);
        G.list.filters = [];
        this.voronoiUniforms.uNN = this.bufferA;
        this.voronoiUniforms.uLights = this.bufferC;
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

        G.cursor.filters = [this.lightBlur];
        G.renderer.render(G.cursor, this.bufferB);
        G.cursor.filters = [];
        this.voronoiUniforms.uLights = this.bufferB;
        this.voronoiQuad.shader = this.voronoiShaderB;
        G.renderer.render(this.voronoiQuad, this.bufferC); // C holds blurred near-lightB

        // // Smooth the coloured NN map to simulate light blending at a distance
        // this.blurSprite.texture = this.bufferC;
        // this.blurSprite.filters  = [this.largeBlur];
        // G.renderer.render(this.blurSprite, this.bufferB); // B holds blurred far-lightB

        // // Blend the near and far light colours
        // this.lightBlendUniforms.uTextureA = this.bufferC;
        // this.lightBlendUniforms.uTextureB = this.bufferB;
        // this.blurSprite.filters = [this.lightBlend];
        // G.renderer.render(this.blurSprite, this.bufferD); // D holds lightA

        // Smooth out the NN map for smoother light directions
        this.blurSprite.texture = this.bufferA;
        this.blurSprite.filters  = [this.smallBlur];
        G.renderer.render(this.blurSprite, this.bufferB);

        // Set the textures for rendering the background
        this.uniforms.uLightDir = this.bufferB;
        this.uniforms.uLightA = this.bufferD;
        this.uniforms.uLightB = this.bufferC;

        G.list.overExpose();
    }
}

class Cursor extends GameObject {
    constructor() {
        const sprite = new PIXI.Sprite.from(G.leaf);
        super(sprite);
        // sprite.visible = false;
    }

    update() {
        this.position.x = G.renderer.plugins.interaction.mouse.global.x;
        this.position.y = G.renderer.plugins.interaction.mouse.global.y;
    }
}

class Sphere extends InteractiveObject {
    constructor() {
        const size = 500;
        const geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition', // the attribute name
            [0, 0, // x, y
                size, 0, // x, y
                size, size,
                0, size], // x, y
            2) // the size of the attribute
        .addAttribute('aUvs', // the attribute name
            [0, 0, // u, v
                1, 0, // u, v
                1, 1,
                0, 1], // u, v
            2) // the size of the attribute
        .addIndex([0, 1, 2, 0, 2, 3]);
        const uniforms = {uValue: 0.0, uX: 0.0, uY: 0.0};
        const shader = new PIXI.Shader.from(vertexShader, testShader, uniforms);
        const gridQuad = new PIXI.Mesh(geometry, shader);
        gridQuad.pivot.set(size/2);
        super(gridQuad);
        
        this.uniforms = uniforms;
        this.shader = shader;

        this.dfa.addOnEnter("idle", this.off.bind(this));
        this.dfa.addOnState("selected", this.point.bind(this));
    }

    point() {
        this.transform.updateLocalTransform();
        const bounds = this.getLocalBounds();
        const worldPos = new PIXI.Point(this.mouse.x, this.mouse.y);
        const localPos = this.toLocal(worldPos);
        localPos.x = localPos.x/bounds.width + 0.5;
        localPos.y = localPos.y/bounds.width + 0.5;
        this.uniforms.uValue = 1.0;
        this.uniforms.uX = localPos.x;
        this.uniforms.uY = localPos.y;
    }

    off() {
        this.uniforms.uValue = 0.5;
    }
}

class Light extends InteractiveObject {
    constructor(t) {
        const sprite = new PIXI.Sprite.from(G.eureka);
        // sprite.anchor.set(0.5);
        super(sprite);
        this.uniforms = {delta: 0};
        this.overExpose = new PIXI.Filter(spriteVertex, spriteFragment, this.uniforms);
        this.displayObject.filters = [];
        this.t = t;

        const activeWiggle = new RotationAnimation(new Oscillation(0.05, 1.0, 0));
        const activeAnimation = new TransitionAnimation(this.dfa, {active: activeWiggle});
        this.addAnimation(activeAnimation);

        var self = this;
        this.dfa.addOnEnter("selected", function() {
            sprite.visible = false;
        });
        this.dfa.addOnEnter("active", function() {
            sprite.visible = true;
        });
        this.dfa.addOnEnter("idle", function() {
            sprite.visible = true;
        });
    }

    update() {
        this.t += 0.005
        this.uniforms.delta = Math.sin(this.t);
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
            console.log("bla");
            G.cursor.addChild(self.generateItem());
            G.cursor.addChild(self.generateItem());
            G.cursor.addChild(self.generateItem());
            G.cursor.addChild(self.generateItem());
            G.cursor.addChild(self.generateItem());
            G.cursor.addChild(self.generateItem());
            G.cursor.addChild(self.generateItem());
            G.cursor.addChild(self.generateItem());
            self.timer = setTimeout(self.action.bind(self), 1000);
        });
        this.dfa.addOnExit("active", function() {
            clearTimeout(self.timer);
        });
    }

    action() {
        console.log("blabla");
        this.displayObject.texture = G.opened;
        this.addChild(this.generateItem());
    }

    generateItem() {
        const p = Math.random();
        let texture = G.suit;
        if(p < .5)
            texture = G.cloud;
        else if (p < .8)
            texture = G.leaf;
        return new Item(new PIXI.Sprite.from(texture));
    }
}

class Item extends GameObject {
    constructor(displayObject) {
        super(displayObject);

        this.v = {x: Math.random() - 0.5, y: Math.random() - 0.5};
        // this.v = {x: 0.0, y: -1.0};
        const l = Math.pow(this.v.x * this.v.x + this.v.y * this.v.y, 0.5);
        this.v.x *= 20 / l;
        this.v.y *= 20 / l;
    }

    update() {
        this.position.x += this.v.x;
        this.position.y += this.v.y;
        this.v.y += 0.5;
    }
}