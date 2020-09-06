class Animation {
    constructor() {
        this.t = 0;
        this.active = 0;
    }

    start() {
        this.t = 0;
        this.active = 1;
    }

    stop() {
        this.t = 0;
        this.active = 0;
    }

    play() {
        this.active = 1;
    }

    pause() {
        this.active = 0;
    }

    update(delta) {
        this.t += adjustedDelta = delta * active;
    }
}

class ExpandAnimation extends Animation {
    constructor(factor, duration, eccentricity) {
        super();
        this.factor = factor;
        this.duration = duration;
        this.eccentricity = eccentricity;
    }
}