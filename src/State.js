/** @class State Class for representing a Deterministic Finite State Automaton (DFA)
 * Comprises a set of states, where each state can be signalled with a symbol to attempt a transition to another state.
 */
class State {
    constructor(initial, states, transitions) {
        this.current = initial;
        this.states = {};
        states.forEach(state => {
            this.addState(state);
        });
        transitions.forEach(transition => {
            this.states[transition.start].transitions[transition.symbol] = transition.target;
        });
    }

    /**
     * Clears all callbacks
     */
    clear() {
        for (const state in this.states) {
            this.states[state] = {onState: [],
                                  onEnter: [],
                                  onExit: [],
                                  transitions: this.states[state].transitions};
        }
    }

    /**
     * 
     * @param {string} state Convenience method for adding a state to this DFA
     */
    addState(state) {
        if(!this.states[state]) {
            this.states[state] = {onState: [], onEnter: [], onExit: [], transitions: {}};
        }
    }

    /**
     * Run callbacks for current state.
     */
    runCurrentState() {
        this.states[this.current].onState.forEach(callback => {
            callback();
        });
    }

    inState(state) {
        return this.current == state;
    }

    /**
     * 
     * @param {string} next Forcefully enter a new state without using transitions
     */
    enterState(next) {
        if(!next)
            return;
        this.states[this.current].onExit.forEach(callback => {callback(this.current, next)});
        this.states[next].onEnter.forEach(callback => {callback(this.current, next)});
        this.current = next;
    }

    /**
     * 
     * @param {string} symbol Symbol to determine a possible transition out from the current state.
     */
    transition(symbol) {
        this.enterState(this.states[this.current].transitions[symbol]);
    }

    addOnState(state, callback) {
        this.states[state].onState.push(callback);
    }

    removeOnState(state, callback) {
        this.states[state].onState = this.states[state].onState.filter(item => item !== callback);
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