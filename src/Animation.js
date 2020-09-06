class BaseAnimation {
    constructor() {
        this.t = 0;
        this.active = 0;
    }

    start() {
        this.t = 0;
        this.active = 1;
        this.value = this.calculate;
        G.animations.push(this);
    }

    stop() {
        this.active = 0;
        const v = this.calculate();
        this.value = () => {return v;};
    }

    calculate() {
        return undefined;
    }

    update(delta) {
        this.t += delta;
        return this.active;
    }
}

class FiniteAnimation extends BaseAnimation {
    constructor(lifetime) {
        super();
        this.lifetime = lifetime;
    }

    update(delta) {
        this.t += delta;
        if (this.t > this.lifetime) {
            this.t = this.lifetime;
            this.stop();
        }
        return this.active;
    }
}

/**
 * Function that interpolates from 1 to @factor over a duration of @lifetime
 * using the function 
 */
class ExpandAnimation extends FiniteAnimation {
    constructor(lifetime, start, target, eccentricity) {
        super(lifetime);
        this.a = start
        this.b = target;
        this.eccentricity = eccentricity;
        this.value = () => {return this.a;};
    }

    restart(start, target) {
        this.t = 0;
        this.a = start;
        this.b = target;
        if(this.active != 1) {
            this.start();
        }
    }

    calculate() {
        return this.a + Math.pow(this.t/this.lifetime, this.eccentricity) * (this.b - this.a);
    }
}

class Oscillation extends BaseAnimation {
    constructor(speed, max) {
        super();
        this.max = max;
        this.speed = speed;
        this.value = () => {return 0};
    }

    calculate() {
        return Math.sin(this.speed * this.t) * this.max;
    }
}