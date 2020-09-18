const interactive = {
    states: ["idle", "selected", "active", "clicked"],
    transitions: [{start: "idle", target: "selected", symbol: "select"},
                  {start: "selected", target: "idle", symbol: "deselect"},
                  {start: "selected", target: "idle", symbol: "release"},
                  {start: "selected", target: "active", symbol: "activate"},
                  {start: "active", target: "clicked", symbol: "deactivate"},
                  {start: "active", target: "idle", symbol: "deselect"},
                  {start: "active", target: "idle", symbol: "release"}]
};

class InteractiveObject extends PIXI.Container{
    constructor() {
        super();
        this.dfa = new State("idle", interactive.states, interactive.transitions);

        this.mouse = null;
        this.interactive = true;
        this.buttonMode = true;
        this.hitArea = this.getLocalBounds();

        G.ticker.add(this.update.bind(this));
    }

    update() {
        this.dfa.runCurrentState();
    }

    mousemove(event) {
        this.mouse = event.data.originalEvent;
    }

    mouseover(event) {
        this.mouse = event.data.originalEvent;
        this.dfa.transition("select");
    }

    mouseout(event) {
        this.mouse = event.data.originalEvent;
        this.dfa.transition("deselect");
    }

    mousedown(event) {
        this.mouse = event.data.originalEvent;
        this.dfa.transition("activate");
    }

    mouseup(event) {
        this.mouse = event.data.originalEvent;
        this.dfa.transition("deactivate");
    }

    mouseupoutside(event) {
        this.mouse = event.data.originalEvent;
        this.dfa.transition("release");
    }
}