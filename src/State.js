class State {
    constructor(initial, states, transitions) {
        this.current = initial;
        this.states = {};
        states.forEach(state => {
            this.states[state] = {onEnter: [], onExit: [], transitions: {}};
        });
        transitions.forEach(transition => {
            this.states[transition.start].transitions[transition.symbol] = transition.target;
        });
    }

    transition(symbol) {
        const s = this.states[this.current];
        const next = s.transitions[symbol];
        if(!next)
            return;

        s.onExit.forEach(callback => {callback(this.current, next)});
        this.states[next].onEnter.forEach(callback => {callback(this.current, next)});

        this.current = next;
    }

    addOnEnter(state, callback) {
        this.states[state].onEnter.push(callback);
    }

    removeOnEnter(state, callback) {
        this.states[state].onEnter = this.states[state].onEnter.filter(item => item !== callback);
    }

    addOnExit(state, callback) {
        this.states[state].onExit.push(callback);
    }

    removeOnEnter(state, callback) {
        this.states[state].onExit = this.states[state].onExit.filter(item => item !== callback);
    }
}