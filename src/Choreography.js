const cycleSix = {
    states: ["A", "B", "C", "D", "E", "F"],
    transitions: [{start: "A", target: "B", symbol: "next"},
                  {start: "B", target: "C", symbol: "next"},
                  {start: "C", target: "D", symbol: "next"},
                  {start: "D", target: "E", symbol: "next"},
                  {start: "E", target: "F", symbol: "next"},
                  {start: "F", target: "A", symbol: "next"}]
};

const cycleTwo = {
    states: ["A", "B"],
    transitions: [{start: "A", target: "B", symbol: "next"},
                  {start: "B", target: "A", symbol: "next"},
                  {start: "B", target: "A", symbol: "tryA"}]
}

/** @class Cycler Basic animation that cycles through a DFA */
class Cycler extends Animation {
    constructor(dfa, symbol, threshold = 30) {
        super();
        this.dfa = dfa;
        this.symbol = symbol;
        this.threshold = threshold;
    }

    animate() {
        if(this.t > this.threshold) {
            this.t %= this.threshold;
            this.dfa.transition(this.symbol);
        }
    }
}

/** @class DecayBlink Complex animation that starts alternating between states after a delay,
 * and then stops animating altogether.
 */
class DecayBlink extends Animation {
    constructor(states, duration, start, target) {
        super();
        states.push("none");
        this.dfa = new State(states[0], states, []);
        this.states = states;
        this.duration = duration;
        this.a = start;
        this.b = target;
    }

    animate() {
        var state;
        if(this.t < this.duration) {
            state = (Math.floor(this.a + Math.pow(this.t/this.duration, 0.1) * (this.b - this.a))) % this.states.length;
            this.dfa.enterState(this.states[state]);
        }
        else if(this.t < 2 * this.duration) {
            if(Math.floor((this.t / 10) % 2) == 1)
                this.dfa.enterState(this.states[this.b]);
            else
            this.dfa.enterState("none");
        } else {
            this.dfa.enterState(this.states[this.b]);
        }
    }
}

/** @class DelayedRepeater Complex animation that will repeatedly signal a callback
 * after some delay.
 */
class DelayedRepeater extends Animation {
    /**
     * 
     * @param {number} delay Time without signalling @param callback
     * @param {number} interval Period of signalling @param callback
     * @param {functtion} callback Callback to be signalled
     */
    constructor(delay, interval, callback) {
        super();
        this.delay = delay;
        this.interval = interval;
        this.callback = callback;
        this.previous = 0;
    }

    animate() {
        if(this.t > this.delay) {
            const next = Math.floor(this.t / this.interval) % 2;
            if(next != this.previous) {
                this.callback();
                this.previous = next;
            }
        }
    }
}