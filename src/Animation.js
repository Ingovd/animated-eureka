class Animation extends PIXI.Container{
    constructor() {
        super();
        this.t = 0;
        this.active = 0;
        this.playing = 0;
    }

    update(delta) {
        this.t += delta * this.playing;
        this.animate(delta);
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