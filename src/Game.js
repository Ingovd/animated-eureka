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
        this.background = new Wall(window.innerWidth, window.innerHeight);
        this.stage.addChild(this.background);

        this.list = new ListLayout(400);
        this.stage.addChild(this.list);

        

        // for (let i = 0; i < 3; i++) {
        //     this.list.add(new Chest());      
        // }


        this.test = new Sphere();
        // this.list.add(this.test);

        this.list.add(new Light(0));
        this.list.add(new Light(Math.PI));

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

        this.renderer.render(this.list, this.background.lightLayer);
        this.background.jfaUniforms.uTexIn = this.background.lightLayer;
        this.background.jfaUniforms.step = 0.0;
        this.renderer.render(this.background.jfaQuad, this.background.bufferA);
        let inBuffer = this.background.bufferA;
        let outBuffer = this.background.bufferB;
        for(let i = 10; i >= 0; i--) {
            this.background.jfaUniforms.uTexIn = inBuffer;
            this.background.jfaUniforms.step = Math.pow(2, i);
            this.renderer.render(this.background.jfaQuad, outBuffer);
            [inBuffer, outBuffer] = [outBuffer, inBuffer];
        }

        this.list.filters = [new PIXI.filters.BlurFilter(15,4,1,5)];
        this.renderer.render(this.list, this.background.lightLayer);
        this.list.filters = [];

        this.background.voronoiUniforms.uNN = inBuffer;
        this.renderer.render(this.background.voronoiQuad, outBuffer);

        this.background.lightDir.texture = inBuffer;
        this.renderer.render(this.background.lightDir, this.background.lightLayer);

        this.background.uniforms.uNN = inBuffer;
        this.background.uniforms.uLightDir = this.background.lightLayer;
        this.background.uniforms.uLight = outBuffer;
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
        this.width = width;
        this.height = height;
        const dim = 1.5 / Math.min(width, height);
        this.geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition', // the attribute name
            [0, 0, // x, y
                width, 0, // x, y
                width, height,
                0, height], // x, y
            2) // the size of the attribute
        .addAttribute('aUvs', // the attribute name
            [0, 0, // u, v
                width*dim, 0, // u, v
                width*dim, height*dim,
                0, height*dim], // u, v
            2) // the size of the attribute
        .addIndex([0, 1, 2, 0, 2, 3]);

        const options = {width: width, height: height, scaleMode: PIXI.SCALE_MODES.LINEAR};
        this.lightLayer = PIXI.RenderTexture.create(options);
        this.bufferA = PIXI.RenderTexture.create(options);
        this.bufferB = PIXI.RenderTexture.create(options);
        this.uniforms = {uTexture: G.wall_color,
                          uRoughness: G.wall_roughness,
                          uNormal: G.wall_normal,
                          uAmbient: G.wall_ambient,
                          uHeight: G.wall_height,
                          uLight: this.lightLayer,
                          uLightDir: this.bufferB,
                          uNN: this.bufferA,
                          uX: 0.0, uY: 0.0, dim: [width, height]};
        const shader = new PIXI.Shader.from(vertexShader, fragmentNormal, this.uniforms);
        const wallQuad = new PIXI.Mesh(this.geometry, shader);
        this.addChild(wallQuad);
        
        this.jfaUniforms = {uTexIn: this.bufferA, step: 0.0, dim: [width, height]};
        const jfaShader = new PIXI.Shader.from(vertexShader, jfaFragment, this.jfaUniforms);
        this.jfaQuad = new PIXI.Mesh(this.geometry, jfaShader);
        
        this.voronoiUniforms = {uNN: this.bufferA, uLights: this.lightLayer, dim: [width, height]};
        const voronoiShader = new PIXI.Shader.from(vertexShader, fragmentVoronoi, this.voronoiUniforms);
        this.voronoiQuad = new PIXI.Mesh(this.geometry, voronoiShader);
        this.voronoiQuad.filters = [new PIXI.filters.BlurFilter(25,4,0.25,15)
                                   ,new PIXI.filters.BlurFilter(125,4,0.25,15)];
        // this.addChild(this.voronoiQuad);

        this.lightDir = new PIXI.Sprite.from(this.lightLayer);
        this.lightDir.filters = [new PIXI.filters.BlurFilter(10,4,1,15)];
    }

    update() {
        this.uniforms.uValue = 1.0;
        this.uniforms.uX = G.renderer.plugins.interaction.mouse.global.x;
        this.uniforms.uY = G.renderer.plugins.interaction.mouse.global.y;
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
        sprite.anchor.set(0.5);
        super(sprite);
        this.uniforms = {delta: 0};
        const filter = new PIXI.Filter(spriteVertex, spriteFragment, this.uniforms);
        this.displayObject.filters = [filter];
        this.t = t;

        const activeWiggle = new RotationAnimation(new Oscillation(0.1, 1.0, 0));
        const activeAnimation = new TransitionAnimation(this.dfa, {active: activeWiggle});
        this.addAnimation(activeAnimation);
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

        // var self = this;
        // this.dfa.addOnEnter("active", function() {
        //     self.timer = setTimeout(self.action.bind(self), 1000);
        // });
        // this.dfa.addOnExit("active", function() {
        //     clearTimeout(self.timer);
        // });
    }

    action() {
        this.sprite.texture = G.opened;
        this.addChild(this.generateItem());
    }

    generateItem() {
        const p = Math.random();
        let texture = G.suit;
        if(p < .5)
            texture = G.cloud;
        else if (p < .8)
            texture = G.leaf;
        return new Item(texture);
    }
}

class Item extends InteractiveObject {
    constructor(texture) {
        super(texture);
    }
}