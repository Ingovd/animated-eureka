/** @class Animation Base class used in conjunction with
 * @class Game to register and update animations */
class Animation extends PIXI.Container{
    constructor() {
        super();
        this.t = 0;
        this.active = 0;
        this.playing = 0;
    }

    /**
     * 
     * @param {number} delta Delta time (unspecified time unit, probably PIXI frames)
     * Records the delta time.
     * If this animation is not active anymore after this frame, it sends a signal
     * to unregister from the global @class Game instance.
     */
    update(delta) {
        this.t += delta * this.playing;
        this.animate(delta);
        return this.active;
    }

    /**
     * Stops this animation from recording delta tiome
     */
    pause() {
        this.playing = 0;
    }

    /**
     * Resume with recording delta time
     */
    play() {
        this.playing = 1;
    }

    /**
     * Register this animation to the global @class Game instance
     */
    start() {
        this.t = 0;
        if(this.active != 1) {
            G.animations.push(this);
            this.active = 1;
        }
        this.play();
    }

    /**
     * Signal on next possible frame to unregister this animation.
     */
    stop() {
        this.active = 0;
    }
}