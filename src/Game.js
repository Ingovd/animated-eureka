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
            this.list.add(new Chest);      
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

class GameObject extends PIXI.Container {
    constructor(texture) {
        super();
        this.sprite = new PIXI.Sprite.from(texture);
        this.sprite.anchor.set(0.5, 0.5);
        this.addChild(this.sprite);

        G.gameObjects.push(this);
    }

    update() {
    }
}

class InteractiveObject extends GameObject {
    constructor(texture) {
        super(texture);

        this.interactive = true;
        this.buttonMode = true;
        this.hitArea = this.sprite.getLocalBounds();
        this.select = false;
        this.active = false;
    }

    onSelect() {
    }

    onDeselect () {
    }

    onActivate () {
    }

    onDeactivate () {
    }

    mouseover() {
        this.select = true;
        this.onSelect();
    }

    mouseout() {
        if (!this.active) {
            this.onDeselect();
        }
    }

    mousedown() {
        this.active = true;
        this.onActivate();
    }

    mouseup() {
        if(this.active) {
            this.active = false;
            this.onDeactivate();
        }
    }

    mouseupoutside() {
        if(this.active) {
            this.mouseout();
            this.mouseup();
        }
    }
}

class Chest extends InteractiveObject {
    constructor() {
        super(G.closed);
        this.activationThreshold = 10;
        this.resetAnimation = new ExpandAnimation(20, 1, 0, 1);
        this.selectAnimation = new ExpandAnimation(30, 1, 1.4, 0.5);
        this.chargeAnimation = new Oscillation(0.1, 0.4);
    }

    update(delta) {
        if(this.select)
            this.sprite.scale.set(this.selectAnimation.value());
        if(this.active)
            this.sprite.rotation = this.chargeAnimation.value();
        else
            this.sprite.rotation = 0;
    }

    onSelect() {
        this.selectAnimation.restart(this.sprite.transform.scale.x, 1.2);
    }

    onDeselect() {
        this.selectAnimation.restart(this.sprite.transform.scale.x, 1);
    }

    onActivate() {
        this.chargeAnimation.start();
    }

    onDeactivate() {
        this.chargeAnimation.stop();
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