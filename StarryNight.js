window.addEventListener('load', () => {
    startGame();
}, false);

function startGame() {
    gameArea.start();
}

function Vector2(x, y) {
    this.x = x;
    this.y = y;
    this.setX = function(x) {
        this.x = x;
    };
    this.setY = function(y) {
        this.y = y;
    };
    this.getX = function() {
        return this.x;
    }
    this.getY = function() {
        return this.y;
    }
}

function SpriteBatch(context) {
    this.context = context;
    this.batch = [];
    this.begin = function(sortMode, blendState) {
        // sortMode is back-to-front
        // blendState is unused
    }
    this.draw = function(texture, position, /*sourceRectangle,*/
        color, rotation, origin, scale, /*effects,*/ layerDepth) {
        this.batch.push({
            "texture": texture,
            "position": position,
            "color": color,
            "rotation": rotation,
            "origin": origin,
            "scale": scale,
            "layerDepth": layerDepth
        });
    }
    this.end = function() {
        this.batch.sort((a, b) => {
            if (equals(a.layerDepth, b.layerDepth))
                return 0;
            if (a.layerDepth < b.layerDepth)
                return 1;
            return -1;
        });

        for (let i = 0; i < this.batch.length; i++) {
            if (this.batch[i].color === "white") {
                // context.translate(
                //     this.batch.origin.getX(),
                //     this.batch.origin.getY()
                // );
                // context.rotate(this.batch.rotatioon);
                // context.translate(
                //     -this.batch.origin.getX(),
                //     -this.batch.origin.getY()
                // );
                context.drawImage(
                    this.batch[i].texture,
                    this.batch[i].position.getX(),
                    this.batch[i].position.getY());
                context.setTransform(1, 0, 0, 1, 0, 0);
            }
        }

        this.batch.length = 0;
    }
}

var gameArea = {
    canvas : document.getElementById("gameCanvas"),

    spriteBatch : -1,

    // layers 0 front, 1 back
    SKY : 1.0,
    STARS : 0.9,
    MOON : 0.8,
    PKMN_TREE_INFRONTOF_MOON : 0.75,
    PKMN_MOON : 0.7,
    LANDSCAPE : 0.6,
    PKMN_TREE_BEHIND_TREE : 0.55,
    TREE : 0.5,
    PKMN_TREE_INFRONTOF_TREE : 0.45,

    // angles
    pkmnMoon_theta : 0,
    pkmnTree_theta : 0,
    moon_theta : 0,
    sun_theta : 0,
    sky_theta : 0,

    // angular velocity
    pkmnMoon_omega : 0,
    pkmnTree_omega : 0,
    moon_omega : 0,
    sun_omega : 0,
    sky_omega : 0,

    // locations
    pkmnMoonLoc : new Vector2(0, 0),
    landscapeLoc : new Vector2(0, 0),
    moonLoc : new Vector2(0, 0),
    sunLoc : new Vector2(0, 0),
    skyLoc : new Vector2(0, 0),
    pkmnTreeLoc : new Vector2(0, 0),
    pkmnTreeGroundLoc : new Vector2(0, 0),
    pkmnTreeOrbitLoc : new Vector2(0, 0),
    treeLoc : new Vector2(0, 0),
    numStars : 0,
    starLocs : -1,

    // current moon center loc
    moonOldCenterLoc : new Vector2(0, 0),

    // center of rotation/scaling (COR)
    pkmnMoonCOR : new Vector2(0, 0),
    landscapeCOR : new Vector2(0, 0),
    moonCOR : new Vector2(0, 0),
    sunCOR : new Vector2(0, 0),
    skyCOR : new Vector2(0, 0),
    pkmnTreeCOR : new Vector2(0, 0),
    pkmnTreeGroundCOR : new Vector2(0, 0),
    pkmnTreeOrbitCOR : new Vector2(0, 0),
    treeCOR : new Vector2(0, 0),
    starCORs : -1,

    pkmnTreeOrbiting : false,
    pkmnTreeScale : 1,
    pkmnTreeDepth : this.PKMN_TREE_INFRONTOF_TREE,

    // textures
    pkmnMoon : new Image(), // charmander
    landscape : new Image(),
    moon : new Image(),
    sun : new Image(),
    sky : new Image(),
    pkmnTree : new Image(),
    tree : new Image(),
    stars : -1,

    savedState : {},
    kbdState : {},
    kbdLogger : function() {
        document.getElementById("gameCanvas").onkeydown = function(e) {
            kbdState[e.code] = true;
        };
        document.getElementById("gameCanvas").onkeyup = function(e) {
            delete kbdState[e.code];
        };
    }(),

    start : function() {
        this.canvas.width = 800;
        this.canvas.height = 800;
        this.context = this.canvas.getContext("2d");
        this.interval = setInterval(updateGameArea, 20);

        // first keyboard state
        gameArea.savedState = gameArea.kbdState;

        // random number of stars
        this.numStars = Math.floor(Math.random() * (1250 - 850) + 850);
        this.stars = new Array(this.numStars);
        this.starLocs = new Array(this.numStars);
        this.starCORs = new Array(this.numStars);

        var locs = new Array(this.starLocs.length);
        for (let i = 0; i < locs.length; i++)
            locs[i] = new Array(2); //x,y pairs
        for (let i = 0; i < locs.length; i++) {
            //x
            locs[i][0] = Math.random * 1475 - 337.5;
            //y
            locs[i][1] = Math.random * 687.5 - 117.5;
        }

        for (let i = 0; i < this.starCORs.length; i++) {
            this.starCORs[i] = new Vector2(
                395 - locs[i][0], 615 - locs[i][1]
            );
            this.starLocs[i] = new Vector2(
                locs[i][0]/* + this.starCORs[i].getX()*/,
                locs[i][1]/* + this.starCORs[i].getY()*/
            );
        }
        
        this.pkmnTreeScale = 1;
        this.pkmnTreeOrbiting = false;
        this.pkmnTreeDepth = this.PKMN_TREE_INFRONTOF_TREE;

        initializeCORs();
        initializeLocs();

        //initial angles and angular velocities
        pkmnMoon_theta = pkmnTree_theta = moon_theta = sun_theta = sky_theta = 0;
        pkmnMoon_omega = Math.PI / 15;
        pkmnTree_omega = Math.PI / 150;
        moon_omega = sun_omega = Math.PI / 150;
        sky_omega = Math.PI / 15;

        loadContent();
        },
    clear : function() {
        this.context.clearRect(0, 0, 
            this.canvas.width, this.canvas.height);
    }
}

function initializeCORs() {
    gameArea.skyCOR = new Vector2(737.5, 737.5);
    gameArea.moonCOR = new Vector2(-448, 0);
    gameArea.sunCOR = new Vector2(608, 0);
    //starCORs initialized randomly
    gameArea.landscapeCOR = new Vector2(0, 0);
    gameArea.treeCOR = gameArea.landscapeCOR;
    gameArea.pkmnMoonCOR = new Vector2(57.5, 52.5);

    //pkmnTree changes COR
    gameArea.pkmnTreeGroundCOR = new Vector2(50.5, 35);
    gameArea.pkmnTreeOrbitCOR = new Vector2(50.5, 52);
    gameArea.pkmnTreeCOR = gameArea.pkmnTreeGroundCOR;
}

function initializeLocs() {
    gameArea.skyLoc = new Vector2(
        -337.5 + gameArea.skyCOR.getX(),
        -117.5 + gameArea.skyCOR.getY()
    );
    gameArea.moonLoc = new Vector2(
        848 + gameArea.moonCOR.getX(),
        620 + gameArea.moonCOR.getY()
    );
    gameArea.moonOldCenterLoc = moonCenterPosition();
    gameArea.sunLoc = new Vector2(
        -208 + gameArea.sunCOR.getX(),
        620 + gameArea.sunCOR.getY()
    );
    //starLocs initialized randomly
    gameArea.landscapeLoc = new Vector2(
        0 + gameArea.landscapeCOR.getX(),
        0 + gameArea.landscapeCOR.getY()
    );
    gameArea.treeLoc = new Vector2(
        250 + gameArea.treeCOR.getX(),
        310 + gameArea.treeCOR.getY()
    );
    gameArea.pkmnMoonLoc = new Vector2(
        1000 + gameArea.pkmnMoonCOR.getX(),
        647 + gameArea.pkmnMoonCOR.getY()
    );

    gameArea.pkmnTreeGroundLoc = new Vector2(
        395 + gameArea.pkmnTreeCOR.getX(),
        595 + gameArea.pkmnTreeCOR.getY()
    );
    gameArea.pkmnTreeOrbitLoc = moonCenterPosition();
    gameArea.pkmnTreeLoc = gameArea.pkmnTreeGroundLoc;
}

function moonCenterPosition() {
    return new Vector2(
        528 * Math.cos(gameArea.moon_theta) + 400,
        528 * Math.sin(gameArea.moon_theta) + 700
    );
}

function pkmnMoonCenterPosition() {
    let moonCenter = moonCenterPosition();
    return new Vector2(
        moonCenter.getX() + 137.5 * Math.cos(10 * gameArea.moon_theta),
        moonCenter.getY() + 137.5 * Math.sin(10 + gameArea.moon_theta)
    );
}

function pkmnTreeBottomEdgeYValue() {
    return gameArea.pkmnTreeLoc.getY() - gameArea.pkmnTreeCOR.getY() +
        gameArea.pkmnTree.height * gameArea.pkmnTreeScale;
}

function treeBottomEdgeYValue() {
    return gameArea.treeLoc.Y + gameArea.tree.height;
}

function equals(theta1, theta2, epsilon = 0.0005) {
    return Math.abs(theta2 - theta1) < epsilon;
}

function loadContent() {
    gameArea.spriteBatch = new SpriteBatch(gameArea.context);

    // satellites and pseudosatellites
    gameArea.sky.src = "img/StarryNight/Sky.png";
    gameArea.moon.src = "img/StarryNight/Moon.png";
    gameArea.sun.src = "img/StarryNight/Sun.png";
    console.log(gameArea.stars);
    for (let i = 0; i < gameArea.stars.length; i++) {
        gameArea.stars[i] = new Image();
        gameArea.stars[i].src = "img/StarryNight/Star.png";
    }
    // stationary objects
    gameArea.landscape.src = "img/StarryNight/Landscape.png";
    gameArea.tree.src = "img/StarryNight/Tree.png";
    // rotating and scaled objects
    gameArea.pkmnMoon.src = "img/StarryNight/Charmander.png";
    gameArea.pkmnTree.src = "img/StarryNight/Squirtle.png";

    // let the images load asynchronously
    setTimeout(async () => {
        gameArea.sky = await createImageBitmap(gameArea.sky);
        gameArea.moon = await createImageBitmap(gameArea.moon);
        gameArea.sun = await createImageBitmap(gameArea.sun);
        for (let i = 0; i < gameArea.stars.length; i++)
            gameArea.stars[i] = await createImageBitmap(gameArea.stars[i]);
        gameArea.landscape = await createImageBitmap(gameArea.landscape);
        gameArea.tree = await createImageBitmap(gameArea.tree);    
        gameArea.pkmnMoon = await createImageBitmap(gameArea.pkmnMoon);
        gameArea.pkmnTree = await createImageBitmap(gameArea.pkmnTree);
    }, 500);
}

function updateGameArea() {
    gameArea.clear();

    gameArea.pkmnTreeOrbitLoc = moonCenterPosition();

    gameArea.moon_theta += gameArea.moon_omega;
    gameArea.sun_theta += gameArea.sun_omega;
    gameArea.pkmnMoon_theta += gameArea.pkmnMoon_omega

    if (equals(gameArea.moon_theta % (2*Math.PI), 0)
        && gameArea.moon_theta > (2*Math.PI))
        gameArea.moon_theta %= (2*Math.PI);

    if ("Space" in gameArea.kbdState && !("Space" in gameArea.savedState)) {
        if (((4 * Math.PI / 3) < gameArea.moon_theta && gameArea.moon_theta < (5 * Math.PI / 3))
            || (2*Math.PI + 4 * Math.PI / 3) < gameArea.moon_theta && gameArea.moon_theta < (2*Math.PI + 5 * Math.PI / 3)) {
            gameArea.pkmnTreeOrbiting = !gameArea.pkmnTreeOrbiting;

            if (gameArea.pkmnTreeOrbiting) {
                gameArea.pkmnTreeCOR = gameArea.pkmnTreeOrbitCOR;
                gameArea.pkmnTreeScale = 1;
                gameArea.pkmnTreeDepth = PKMN_TREE_INFRONTOF_MOON;
            } else {
                gameArea.pkmnTreeCOR = gameArea.pkmnTreeGroundCOR;
                gameArea.pkmnTreeLoc = gameArea.pkmnTreeGroundLoc;
                gameArea.pkmnTreeDepth = PKMN_TREE_INFRONTOF_TREE;
            }
        }
    }

    if (gameArea.pkmnTreeOrbiting) {
        gameArea.pkmnTreeLoc = moonCenterPosition();
    } else {
        if ("ArrowUp" in gameArea.kbdState)
            gameArea.pkmnTreeScale -= 0.05;
        if ("ArrowDown" in gameArea.kbdState)
            gameArea.pkmnTreeScale += 0.05;
        if ("ArrowLeft" in gameArea.kbdState)
            gameArea.pkmnTreeLoc.setX(gameArea.pkmnTreeLoc.getX() - 5);
        if ("ArrowRight" in gameArea.kbdState)
            gameArea.pkmnTreeLoc.setX(gameArea.pkmnTreeLoc.getX() + 5);

        if (pkmnTreeBottomEdgeYValue() > treeBottomEdgeYValue())
            gameArea.pkmnTreeDepth = gameArea.PKMN_TREE_INFRONTOF_TREE;
        else if (pkmnTreeBottomEdgeYValue < treeBottomEdgeYValue())
            gameArea.pkmnTreeDepth = gameArea.PKMN_TREE_BEHIND_TREE;
        else
            gameArea.pkmnTreeDepth = gameArea.TREE;
    }
    
    gameArea.savedState = gameArea.kbdState;
    draw(gameArea.spriteBatch);
}

function draw(spriteBatch) {
    spriteBatch.begin("back-to-front", null);
    
    // texture, position, --sourceRectangle--, color, rotation, origin, scale, --effects--, layerDepth
    spriteBatch.draw(gameArea.sky, gameArea.skyLoc, "white", gameArea.sky_theta, gameArea.skyCOR, 1, gameArea.SKY);
    spriteBatch.draw(gameArea.moon, gameArea.moonLoc, "white", gameArea.moon_theta, gameArea.moonCOR, 1, gameArea.MOON);
    spriteBatch.draw(gameArea.sun, gameArea.sunLoc, "white", gameArea.sun_theta, gameArea.sunCOR, 1, gameArea.MOON);
    
    for (let i = 0; i < gameArea.stars.Length; i++)
        spriteBatch.draw(gameArea.stars[i], gameArea.starLocs[i], GetColor(), gameArea.sky_theta, gameArea.starCORs[i], 1, gameArea.STARS);

    //stationary
    spriteBatch.draw(gameArea.landscape, gameArea.landscapeLoc, "white", 0, gameArea.landscapeCOR, 1, gameArea.LANDSCAPE);
    spriteBatch.draw(gameArea.tree, gameArea.treeLoc, "white", 0, gameArea.treeCOR, 1, gameArea.TREE);

    // rotating and scaled objects
    spriteBatch.draw(gameArea.pkmnMoon, pkmnMoonCenterPosition(), "white", gameArea.pkmnMoon_theta, gameArea.pkmnMoonCOR, 1, gameArea.PKMN_MOON);
    spriteBatch.draw(gameArea.pkmnTree, gameArea.pkmnTreeLoc, "white", gameArea.pkmnTree_theta, gameArea.pkmnTreeCOR, gameArea.pkmnTreeScale, gameArea.pkmnTreeDepth);

    spriteBatch.end();
}

var colorCounter = 0;
function getColor() {
    let c = "white";
    colorCounter++;

    if (colorCounter > 60) {
        c = (Math.random() >= 0.5) ? "white" : "transparent";
        colorCounter = 0;
    }
    return c;
}