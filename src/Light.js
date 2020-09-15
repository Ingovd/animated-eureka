class Light extends InteractiveObject {
    constructor(t) {
        const sprite = new PIXI.Sprite.from(G.eureka);
        sprite.anchor.set(0.5);
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

class NeonTube extends GameObject {
    constructor(sprite) {
        super(sprite);
        this.t = 0;

        this.colorMatrix = [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ];

        this.matrixFilter = new PIXI.filters.ColorMatrixFilter();
        this.matrixFilter.matrix = this.colorMatrix;
        this.matrixFilter.brightness(1, false);

        this.lightMode();
    }

    brighten(b, multiply = false) {
        this.matrixFilter.brightness(b, multiply);
    }

    lightMode() {
        this.filters = [this.matrixFilter];
    }

    spriteMode() {
        this.filters = [];
    }

    update() {
        
    }
}