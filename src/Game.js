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
                   .add('large', "assets/sprites/large.png");
        this.loader.load((loader, resources) => {
            G.closed = resources.closed.texture;
            G.opened = resources.opened.texture;
            G.cloud = resources.cloud.texture;
            G.leaf = resources.leaf.texture;
            G.suit = resources.suit.texture;
            G.star = resources.star.texture;
            G.large = resources.large.texture;
        });
        this.loader.onComplete.add(this.init.bind(this));
    }

    init() {
        this.list = new ListLayout(100);
        this.stage.addChild(this.list);

        // for (let i = 0; i < 3; i++) {
        //     this.list.add(new Chest());      
        // }


        this.test = new Sphere();
        this.list.add(this.test);
        // this.stage.addChild(this.test);

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
        const gridTexture = PIXI.RenderTexture.create(size, size);
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