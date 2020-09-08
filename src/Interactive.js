const interactive = {
    states: ["idle", "selected", "active"],
    transitions: [{start: "idle", target: "selected", symbol: "select"},
                  {start: "selected", target: "idle", symbol: "deselect"},
                  {start: "selected", target: "idle", symbol: "release"},
                  {start: "selected", target: "active", symbol: "activate"},
                  {start: "active", target: "selected", symbol: "deactivate"},
                  {start: "active", target: "idle", symbol: "release"}]
};

class GameObject extends PIXI.Container {
    constructor(displayObject) {
        super();
        this.displayObject = displayObject;
        this.addChild(displayObject);

        G.gameObjects.push(this);
    }

    addAnimation(animation) {
        this.displayObject.parent.addChild(animation);
        animation.addChild(this.displayObject);
    }

    update() {
        this.updateTransform();
    }
}

class InteractiveObject extends GameObject{
    constructor(texture) {
        super(texture);
        this.dfa = new State("idle", interactive.states, interactive.transitions);

        this.mouse = null;
        this.interactive = true;
        this.buttonMode = true;
        this.hitArea = this.getLocalBounds();
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