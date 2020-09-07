/**
 * Function that interpolates from 1 to @factor over a duration of @lifetime
 * using the function 
 */
class Interpolate {
    constructor(duration, start, target, eccentricity) {
        this.a = start
        this.b = target;
        this.duration = duration;
        this.eccentricity = eccentricity;
    }

    calculate(t) {
        if(this.duration <= t)
            return this.b;
        return this.a + Math.pow(t/this.duration, this.eccentricity) * (this.b - this.a);
    }
}

class Oscillation {
    constructor(speed, max, offset) {
        this.max = max;
        this.speed = speed;
        this.offset = offset;
    }

    calculate(t) {
        return Math.sin(this.speed * t) * this.max + this.offset;
    }
}