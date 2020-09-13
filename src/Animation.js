class Animation extends PIXI.Container{
    constructor() {
        super();
        this.t = 0;
        this.active = 0;
        this.playing = 0;
    }

    update(delta) {
        this.t += delta * this.playing;
        this.animate();
        this.transform.updateLocalTransform();
        return this.active;
    }

    play() {
        this.playing = 1;
    }

    pause() {
        this.playing = 0;
    }

    start() {
        this.t = 0;
        if(this.active != 1) {
            G.animations.push(this);
            this.active = 1;
        }
        this.play();
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
    constructor(dfa, animations) {
        super();
        this.dfa = dfa;
        this.animations = animations;
        this.transTime = 20;
        
        this.prevTransform = PIXI.Transform.IDENTITY;
        for (const state in animations) {
            dfa.addOnEnter(state, this.enter.bind(this));
            dfa.addOnExit(state, this.exit.bind(this));
        }

        this.defaultAnimation = new Animation();
        this.defaultAnimation.start = () => {};
        this.defaultAnimation.animate = () => {};
        this.currentAnimation = this.defaultAnimation;
        this.enter(null, dfa.current);
    }

    exit(current, next) {
        if(this.animations[current] === this.animations[next])
            return;
        if(this.animations.hasOwnProperty(current)) {
            this.currentAnimation.stop();
            this.currentAnimation = this.defaultAnimation;
        }
    }

    enter(current, next) {
        if(this.animations[current] === this.animations[next])
            return;
        if(this.animations.hasOwnProperty(next)) {
            this.currentAnimation = this.animations[next];
            this.currentAnimation.start();
        }
        this.start();
    }

    start() {
        super.start();
        this.prevTransform.setFromMatrix(this.localTransform);
        this.animate = this.animateInterpolate.bind(this);
    }

    animateInterpolate() {
        if(this.t >= this.transTime) {
            this.animate = this.animateIdle.bind(this);
            return this.animate();
        }

        const A = this.prevTransform;
        const B = this.currentAnimation.transform;
        const d = this.t / this.transTime;

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