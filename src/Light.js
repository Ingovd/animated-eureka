const tubeState = {
    states: ["on", "off"],
    transitions: [{start: "on", target: "off", symbol: "switchOff"},
                  {start: "off", target: "on", symbol: "switchOn"}]
};

class NeonChest extends InteractiveObject {
    constructor() {
        super();
        this.dfa.addState("off");

        this.color = {r:1.0, g:0.5, b:0.1};
        this.base = new NeonLight(G.chest, 0, 7, this.color);
        this.base.setOnStates(this.dfa, ["idle", "selected", "active", "clicked"]);
        this.addChild(this.base);
        this.closeLid = new NeonLight(G.chest, 1, 3, this.color);
        this.addChild(this.closeLid);
        this.peekLid = new NeonLight(G.chest, 2, 7, this.color);
        this.addChild(this.peekLid);
        this.openLid = new NeonLight(G.chest, 3, 4, this.color);
        this.openLid.setOnStates(this.dfa, ["active", "clicked"]);
        this.addChild(this.openLid);
        this.dfa.enterState("idle");
        this.hitArea = this.base.getLocalBounds();
        this.scale.set(0.8);

        this.setIdleAnimation();
    }


    disable() {
        this.dfa.enterState("off");
        this.idleAnimation.dfa.enterState("notIdle");
    }


    enable() {
        this.dfa.enterState("idle");
        this.idleAnimation.dfa.enterState("A");
    }

    setIdleAnimation() {
        const lidState = new State("A", cycleTwo.states, cycleTwo.transitions);
        this.idleAnimation = new Cycler(lidState, "next");
        this.idleAnimation.threshold = 50;
        lidState.addState("notIdle");
        this.closeLid.setOnStates(lidState, ["A"]);
        this.peekLid.setOnStates(lidState, ["B"]);

        const self = this;
        this.dfa.addOnEnter("idle", function() {
            lidState.enterState("A");
            self.idleAnimation.threshold = 50;
        });
        this.dfa.addOnEnter("selected", function() {
            lidState.enterState("A");
            self.idleAnimation.threshold = 10;
        });
        this.dfa.addOnEnter("active", function () {
            lidState.enterState("notIdle");
        });
        this.idleAnimation.dfa.enterState("A");
        this.idleAnimation.start();
    }

    /**
     * Disable the idle animation and visuals connected to mouse interaction
     */
    stopIdle() {
        this.idleAnimation.dfa.transition("tryA");
        this.idleAnimation.pause();
    }

    /**
     * Restart the idle animation and mouse interaction
     */
    startIdle() {
        this.idleAnimation.dfa.transition("tryA");
        this.idleAnimation.play();
    }
}

class NeonItems extends PIXI.Container {
    constructor() {
        super();
        this.lights = {};
        this.lights.shield = new NeonLight(G.itemLights, 0, 7, {r: 1.0, g: 0.0, b: 0.0});
        this.addChild(this.lights.shield);
        this.lights.sword = new NeonLight(G.itemLights, 1, 7, {r: 0.0, g: 1.0, b: 0.0});
        this.addChild(this.lights.sword);
        this.lights.rupee = new NeonLight(G.itemLights, 2, 4, {r: 0.0, g: 0.0, b: 1.0});
        this.addChild(this.lights.rupee);
        this.hitArea = this.getLocalBounds();
    }

    switch(on) {
        for (const key in this.lights) {
            this.lights[key].switch(on);
        }
    }

    bindStates(dfa, map) {
        for (const key in map) {
            this.lights[key].setOnStates(dfa, map[key]);
        }
    }
}

/** @class NeonLight Collection of Neon tubes that have the same behaviour.
 * A NeonLight instance can be bound to DFA states.
 */
class NeonLight extends PIXI.Container {
    constructor(texture, row, nrTubes, color) {
        super();
        this.tubes = [];
        for(let i = 1; i <= nrTubes; i++) {
            const tube = new NeonTube(texture, i, row, color);
            tube.speed = this.speed;
            this.tubes.push(tube);
            this.addChild(tube);
        }
    }

    /**
     * 
     * @param {State} dfa The DFA to bind the lights to
     * @param {[string]} states The states for which this light needs to shine.
     */
    setOnStates(dfa, states) {
        const self = this;
        states.forEach(state => {
            dfa.addOnEnter(state, function() {
                self.switch(true);
            })
            dfa.addOnExit(state, function() {
                self.switch(false);
            })
        });
    }

    /**
     * 
     * @param {boolean} on Convenience method for switching all lights on (true) or off (false).
     */
    switch(on) {
        this.tubes.forEach(tube => {
            tube.state.transition(on?"switchOn":"switchOff");
        });
    }
}

/** @class NeonTube Smallest possible neon light.
 * Will take a sprite and a color as input, and can be brightened dynamically.
 */
class NeonTube extends PIXI.Container {
    constructor(texture, x, y, c) {
        super();
        const size = 500;
        const rect = new PIXI.Rectangle(size * x, size * y, size, size);
        this.sprite = new PIXI.Sprite.from(new PIXI.Texture(texture, rect));
        this.addChild(this.sprite);

        this.colorMatrix = [
            c.r, 0, 0, 0, 0,
            0, c.g, 0, 0, 0,
            0, 0, c.b, 0, 0,
            0, 0, 0, 1, 0
        ];
        this.matrixFilter = new PIXI.filters.ColorMatrixFilter();
        this.brighten(0.0);
        this.filters = [this.matrixFilter];
        
        this.state = new State("off", tubeState.states, tubeState.transitions);
        let self = this;
        this.state.addOnEnter("on", function() {
            self.brighten(1.0);
        });
        this.state.addOnEnter("off", function() {
            self.brighten(0.0);
        });
    }

    brighten(b) {
        this.matrixFilter.matrix = this.colorMatrix;
        this.matrixFilter.brightness(b, true);
    }
}