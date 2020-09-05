class Game extends PIXI.Application {
    constructor(options) {
        super(options);
        this.closed = new PIXI.Texture.from("assets/sprites/chest_closed.png");
        this.opened = new PIXI.Texture.from("assets/sprites/chest_open.png");
        this.cloud = new PIXI.Texture.from("assets/sprites/item_cloud.png");
        this.leaf = new PIXI.Texture.from("assets/sprites/item_green_leaf.png");
        this.suit = new PIXI.Texture.from("assets/sprites/item_tanooki_suit.png");
        this.animations = [];
    }

    init() {
        this.list = new ListLayout(100);
        this.stage.addChild(this.list);

        for (let i = 0; i < 3; i++) {
            this.list.add(new Chest);      
        }
        this.list.center();
        this.ticker.add(this.update.bind(this));
        this.resizeRenderer();
    }

    update(delta) {
        this.animations.forEach(element => {
            element.animate(delta);
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
    }
}

class Chest extends PIXI.Container {
    constructor() {
        super();
        this.sprite = new PIXI.Sprite();
        this.sprite.texture = G.closed;
        this.sprite.anchor.set(0.5, 0.5);
        this.addChild(this.sprite);

        this.interactive = true;
        this.hitArea = new PIXI.Circle(0,0,30);

        this.clicked = false;
    }

    mousedown(mouseData) {
        this.clicked = true;
    }

    mouseupoutside(mouseData) {
        this.clicked = false;
    }

    mouseup(mouseData) {
        if(this.clicked) {
            this.addChild(new Item());
        }
    }

    mouseover(mouseData) {
        this.sprite.texture = G.opened;
    }

    mouseout(mouseData) {
        this.sprite.texture = G.closed;
    }
}

class Item extends PIXI.Container {
    constructor() {
        super();
        this.sprite = new PIXI.Sprite();
        this.addChild(this.sprite);
        const p = Math.random();
        if(p < .5)
            this.sprite.texture = G.cloud;
        else if (p < 0.8)
            this.sprite.texture = G.leaf;
        else
            this.sprite.texture = G.suit;
        this.sprite.anchor.set(.5, .5);
        this.t = 0;
        G.animations.push(this);
    }

    animate(delta) {
        this.t += delta;
        this.position.y = -this.t;
    }
}