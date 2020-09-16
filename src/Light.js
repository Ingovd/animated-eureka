class Light extends InteractiveObject {
    constructor(t) {
        const sprite = new PIXI.Sprite.from(G.eureka);
        sprite.anchor.set(0.5);
        super(sprite);
        this.uniforms = {delta: 0};
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

class NeonLight extends GameObject {
    constructor(row, nrTubes, color) {
        super();
        this.tubes = [];
        for(let i = 1; i <= nrTubes; i++) {
            const tube = new NeonTube(i, row, color);
            this.tubes.push(tube);
            this.addChild(tube);
        }
    }

    prepareLights() {
        this.tubes.forEach(tube => {
            tube.sprite.visible = false;
            tube.lightSprite.visible = true;
        });
    }

    prepareSprites() {
        this.tubes.forEach(tube => {
            tube.sprite.visible = true;
            tube.lightSprite.visible = false;
        });
    }
}

class NeonTube extends GameObject {
    constructor(x, y, c) {
        super();
        const size = 250;
        const rect = new PIXI.Rectangle(size * x, size * y, size, size);
        this.sprite = new PIXI.Sprite.from(new PIXI.Texture(G.items, rect));
        this.addChild(this.sprite);
        this.lightSprite = new PIXI.Sprite.from(new PIXI.Texture(G.item_lights, rect));
        this.addChild(this.lightSprite);
        this.t = 0;
        this.speed = Math.random() * 0.05;

        this.colorMatrix = [
            c.r, 0, 0, 0, 0,
            0, c.g, 0, 0, 0,
            0, 0, c.b, 0, 0,
            0, 0, 0, 1, 0
        ];

        this.matrixFilter = new PIXI.filters.ColorMatrixFilter();
        this.filters = [this.matrixFilter];

        this.brighten(1.0);
    }

    brighten(b) {
        this.matrixFilter.matrix = this.colorMatrix;
        this.matrixFilter.brightness(b, true);
    }

    update() {
        this.t += this.speed;
        this.brighten(Math.round((Math.sin(this.t))));
    }
}