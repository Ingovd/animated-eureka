class Animation extends PIXI.Container{
    constructor() {
        super();
        this.t = 0;
        this.active = 0;
    }

    update(delta) {
        this.t += delta;
        this.animate();
        this.transform.updateLocalTransform();
        return this.active;
    }

    start() {
        this.t = 0;
        if(this.active != 1) {
            G.animations.push(this);
            this.active = 1;
        }
    }

    stop() {
        this.active = 0;
    }
}

class RotationAnimation extends Animation {
    constructor(parametric) {
        super();
        this.parametric = parametric;
    }

    animate() {
        this.transform.rotation = this.parametric.calculate(this.t);
    }
}

class ScaleAnimation extends Animation {
    constructor(parametric) {
        super();
        this.parametric = parametric;
    }

    animate() {
        this.transform.scale.set(this.parametric.calculate(this.t));
    }
}

class TransitionAnimation extends Animation {
    constructor(dfa, animations, current) {
        super();
        this.transTime = 10;
        this.prevTransform = PIXI.Transform.IDENTITY;
        this.dfa = dfa;
        this.animations = animations;
        for (const state in animations) {
            if (animations.hasOwnProperty(state)) {
                dfa.addOnEnter(state, this.stateChange.bind(this));
            }
        }

        this.stateChange(null, current);
        
        this.animate = this.animateIdle.bind(this);
    }

    stateChange(current, next) {
        if(this.animations.hasOwnProperty(next)) {
            this.prevTransform.setFromMatrix(this.localTransform);
            this.currentAnimation = this.animations[next];
            this.currentAnimation.start();
            this.prevTime = this.t;
            this.animate = this.animateInterpolate.bind(this);
        }
    }

    animateInterpolate() {
        const delta = this.t - this.prevTime;
        if(delta >= this.transTime) {
            this.animate = this.animateIdle.bind(this);
            return this.animate();
        }

        const A = this.prevTransform;
        this.currentAnimation.animate();
        const B = this.currentAnimation.transform;
        const d = delta / this.transTime;

        this.position.set(this.lerp(d, A.position.x, B.position.x), this.lerp(d, A.position.y, B.position.y));
        this.rotation = this.lerp(d, A.rotation, B.rotation);
        this.scale.set(this.lerp(d, A.scale.x, B.scale.x), this.lerp(d, A.scale.y, B.scale.y));
    }

    lerp(d, a, b) {
        return (1-d) * a + d*b;
    }

    animateIdle() {
        this.transform.setFromMatrix(this.currentAnimation.localTransform);
    }
}