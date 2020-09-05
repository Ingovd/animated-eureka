//the canvas to draw on
const canvas = document.getElementById('gameCanvas');
//prevent right-click from opening contextmenu
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });
// disable dragging
window.ondragstart = function() { return false; };

var G = new Game({
    view: canvas,
    backgroundColor: 0x1099bb,
    width: window.innerWidth,
    height: window.innerHeight,
    resolution: window.devicePixelRatio,
    autoDensity: true,
    antialias: true,
    sharedTicker: true,
    sharedLoader: true
});
window.addEventListener('resize', G.resizeRenderer.bind(G));

document.addEventListener("DOMContentLoaded", G.init.bind(G), false);