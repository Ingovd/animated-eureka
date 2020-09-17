const tubeState = {
    states: ["on", "off", "broken"],
    transitions: [{start: "on", target: "off", symbol: "switchOff"},
                  {start: "off", target: "on", symbol: "switchOn"},
                  {start: "on", target: "broken", symbol: "break"},
                  {start: "off", target: "broken", symbol: "break"}]
};

const lightState = {

}

class NeonLight extends GameObject {
    constructor(texture, row, nrTubes, color) {
        super();
        this.tubes = [];
        this.speed = Math.random() * 0.1;
        for(let i = 1; i <= nrTubes; i++) {
            const tube = new NeonTube(texture, i, row, color);
            tube.speed = this.speed;
            this.tubes.push(tube);
            this.addChild(tube);
        }
        this.switch(true);
    }

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

    switch(on) {
        this.tubes.forEach(tube => {
            tube.state.transition(on?"switchOn":"switchOff");
        });
    }
}

class NeonTube extends GameObject {
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
        this.filters = [this.matrixFilter];
        
        this.state = new State("off", tubeState.states, tubeState.transitions);
        let self = this;
        this.state.addOnEnter("on", function() {
            self.brighten(1.0);
        });
        this.state.addOnEnter("off", function() {
            self.brighten(0.0);
        });
        this.state.addOnState("broken", function() {
            
        });
    }

    brighten(b) {
        this.matrixFilter.matrix = this.colorMatrix;
        this.matrixFilter.brightness(b, true);
    }
}