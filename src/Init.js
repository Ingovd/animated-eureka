//the canvas to draw on
const canvas = document.getElementById('gameCanvas');
//prevent right-click from opening contextmenu
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });
// disable dragging
window.ondragstart = function() { return false; };

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

var G = new Game({
    view: canvas,
    backgroundColor: 0x000000,
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    sharedTicker: true,
    sharedLoader: true
});
window.addEventListener('resize', G.resizeRenderer.bind(G));