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
    constructor(texture) {
        super();
        this.sprite = new PIXI.Sprite.from(texture);
        this.sprite.anchor.set(0.5, 0.5);
        this.addChild(this.sprite);

        G.gameObjects.push(this);
    }

    addAnimation(animation) {
        this.sprite.parent.addChild(animation);
        animation.addChild(this.sprite);
    }

    update() {
        this.updateTransform();
    }
}

class InteractiveObject extends GameObject{
    constructor(texture) {
        super(texture);
        this.dfa = new State("idle", interactive.states, interactive.transitions);

        this.interactive = true;
        this.buttonMode = true;
        this.hitArea = this.sprite.getLocalBounds();
    }

    mouseover() {
        this.dfa.transition("select");
    }

    mouseout() {
        this.dfa.transition("deselect");
    }

    mousedown() {
        this.dfa.transition("activate");
    }

    mouseup() {
        this.dfa.transition("deactivate");
    }

    mouseupoutside() {
        this.dfa.transition("release");
    }
}