class Game extends PIXI.Application {
    constructor(options) {
        super(options);
        this.closed = new PIXI.Texture.from("assets/sprites/chest_closed.png");
        this.opened = new PIXI.Texture.from("assets/sprites/chest_open.png");
        this.cloud = new PIXI.Texture.from("assets/sprites/item_cloud.png");
        this.leaf = new PIXI.Texture.from("assets/sprites/item_green_leaf.png");
        this.suit = new PIXI.Texture.from("assets/sprites/item_tanooki_suit.png");
        this.gameObjects = [];
        this.animations = [];
    }

    init() {
        this.list = new ListLayout(100);
        this.stage.addChild(this.list);

        for (let i = 0; i < 3; i++) {
            this.list.add(new Chest());      
        }
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
        this.transform.scale.set(3);
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

class Chest extends InteractiveObject {
    constructor() {
        super(G.closed);

        const idleOscillate = new ScaleAnimation(new Oscillation(0.1, 0.05, 1.05));
        const hoverGrow = new ScaleAnimation(new Interpolate(40, 1, 1.5, 0.3));
        const selectAnimations = {idle: idleOscillate, selected: hoverGrow};
        const selectAnimation = new TransitionAnimation(this.dfa, selectAnimations, "idle");
        this.addAnimation(selectAnimation);
        selectAnimation.start();
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
        G.animations.push(this);
    }

    animate(delta) {
        console.log(this.active)
        if(!this.active)
            this.position.y -= delta;
    }

    onSelect() {
        this.sprite.scale.set(1.1);
    }

    onDeselect() {
        this.sprite.scale.set(1);
    }
}