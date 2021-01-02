function startGame() {
    gameArea.start();
}

var gameArea = {
    canvas : document.getElementById("gameCanvas"),
    start : function() {
        this.canvas.width = 640;
        this.canvas.height = 480;
        this.context = this.canvas.getContext("2d");
        this.interval = setInterval(updateGameArea, 20);
        },
    clear : function() {
        this.context.clearRect(0, 0, 
            this.canvas.width, this.canvas.height);
    }
}

function updateGameArea() {
    myGameArea.clear();
}