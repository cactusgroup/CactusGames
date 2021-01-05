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
            if (batch[i].color === "white") {
                context.drawImage(
                    batch[i].texture,
                    batch[i].position.getX(),
                    batch[i].position.getY());
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
    pkmnMoonθ : 0,
    pkmnTreeθ : 0,
    moonθ : 0,
    sunθ : 0,
    skyθ : 0,

    // angular velocity
    pkmnMoonω : 0,
    pkmnTreeω : 0,
    moonω : 0,
    sunω : 0,
    skyω : 0,

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
        this.canvas.onkeydown = function(e) {
            kbdState[e.code] = true;
        };
        this.canvas.onkeyup = function(e) {
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
                locs[i][0] + this.starCORs[i].getX(),
                locs[i][1] + this.starCORs[i].getY()
            );
        }
        
        this.pkmnTreeScale = 1;
        this.pkmnTreeOrbiting = false;
        this.pkmnTreeDepth = this.PKMN_TREE_INFRONTOF_TREE;

        initializeCORs();
        initializeLocs();

        //initial angles and angular velocities
        pkmnMoonθ = pkmnTreeθ = moonθ = sunθ = skyθ = 0;
        pkmnMoonω = Math.PI / 15;
        pkmnTreeω = Math.PI / 150;
        moonω = sunω = Math.PI / 150;
        skyω = Math.PI / 15;

        loadContent();
        },
    clear : function() {
        this.context.clearRect(0, 0, 
            this.canvas.width, this.canvas.height);
    }
}

function startGame() {
    gameArea.start();
}

function initializeCORs() {
    gameArea.skyCOR = new Vector2(737.5, 737.5);
    gameArea.moonCOR = new Vector2(-448, 0);
    gameArea.sunCOR = new Vector2(608, 0);
    //starCORs initialized randomly
    gameArea.landscapeCOR = new Vector2(0, 0);
    gameArea.treeCOR = landscapeCOR;
    gameArea.pkmnMoonCOR = new Vector2(57.5, 52.5);

    //pkmnTree changes COR
    gameArea.pkmnTreeGroundCOR = new Vector2(50.5, 35);
    gameArea.pkmnTreeOrbitCOR = new Vector2(50.5, 52);
    gameArea.pkmnTreeCOR = pkmnTreeGroundCOR;
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
    pkmnTreeOrbitLoc = moonCenterPosition();
    pkmnTreeLoc = pkmnTreeGroundLoc;
}

function moonCenterPosition() {
    return new Vector2(
        528 * Math.cos(moonθ) + 400,
        528 * Math.sin(moonθ) + 700
    );
}

function pkmnMoonCenterPosition() {
    let moonCenter = moonCenterPosition();
    return new Vector2(
        moonCenter.getX() + 137.5 * Math.cos(10 * moonθ),
        moonCenter.getY() + 137.5 * Math.sin(10 + moonθ)
    );
}

function pkmnTreeBottomEdgeYValue() {
    return pkmnTreeLoc.getY() - pkmnTreeCOR.getY() +
        pkmnTree.height * pkmnTreeScale;
}

function treeBottomEdgeYValue() {
    return treeLoc.Y + tree.height;
}

function equals(theta1, theta2, epsilon = 0.0005) {
    return Math.abs(theta2 - theta1) < epsilon;
}

async function loadContent() {
    gameArea.spriteBatch = new SpriteBatch(gameArea.context);

    // satellites and pseudosatellites
    gameArea.sky.src = "img/StarryNight/Sky.png";
    gameArea.sky = await createImageBitmap(gameArea.sky);

    gameArea.moon.src = "img/StarryNight/Moon.png";
    gameArea.moon = await createImageBitmap(gameArea.moon);
    
    gameArea.sun.src = "img/StarryNight/Sun.png";
    gameArea.sun = await createImageBitmap(gameArea.sun);

    for (let i = 0; i < gameArea.stars.length; i++) {
        gameArea.stars[i].src =
            "img/StarryNight/Star.png";
        gameArea.stars[i] = await createImageBitmap(gameArea.stars[i]);
    }
    
    // stationary objects
    gameArea.landscape.src = "img/StarryNight/Landscape.png";
    gameArea.landscape = await createImageBitmap(gameArea.landscape);

    gameArea.tree.src = "img/StarryNight/Tree.png";
    gameArea.tree = await createImageBitmap(gameArea.tree);

    // rotating and scaled objects
    gameArea.pkmnMoon.src = "img/StarryNight/Charmander.png";
    gameArea.pkmnMoon = await createImageBitmap(gameArea.pkmnMoon);

    gameArea.pkmnTree.src = "img/StarryNight/Squirtle.png";
    gameArea.pkmnTree = await createImageBitmap(gameArea.pkmnTree);
}

function updateGameArea() {
    gameArea.clear();

    gameArea.pkmnTreeOrbitLoc = moonCenterPosition();

    moonθ += moonω;
    sunθ += sunω;
    pkmnMoonθ += pkmnMoonω

    if (equals(moonθ % (2*Math.PI), 0) && moonθ > (2*Math.PI))
        moonθ %= (2*Math.PI);

    if ("Space" in kbdState && !("Space" in savedState)) {
        if (((4 * Math.PI / 3) < moonθ && moonθ < (5 * Math.PI / 3))
            || (2*Math.PI + 4 * Math.PI / 3) < moonθ && moonθ < (2*Math.PI + 5 * Math.PI / 3)) {
            pkmnTreeOrbiting = !pkmnTreeOrbiting;

            if (pkmnTreeOrbiting) {
                pkmnTreeCOR = pkmnTreeOrbitCOR;
                pkmnTreeScale = 1;
                pkmnTreeDepth = PKMN_TREE_INFRONTOF_MOON;
            } else {
                pkmnTreeCOR = pkmnTreeGroundCOR;
                pkmnTreeLoc = pkmnTreeGroundLoc;
                pkmnTreeDepth = PKMN_TREE_INFRONTOF_TREE;
            }
        }
    }

    if (pkmnTreeOrbiting) {
        pkmnTreeLoc = moonCenterPosition();
    } else {
        if ("ArrowUp" in kbdState)
            pkmnTreeScale -= 0.05;
        if ("ArrowDown" in kbdState)
            pkmnTreeScale += 0.05;
        if ("ArrowLeft" in kbdState)
            pkmnTreeLoc.setX(pkmnTreeLoc.getX() - 5);
        if ("ArrowRight" in kbdState)
            pkmnTreeLoc.setX(pkmnTreeLoc.getX() + 5);

        if (pkmnTreeBottomEdgeYValue() > treeBottomEdgeYValue())
            pkmnTreeDepth = PKMN_TREE_INFRONTOF_TREE;
        else if (pkmnTreeBottomEdgeYValue < treeBottomEdgeYValue())
            pkmnTreeDepth = PKMN_TREE_BEHIND_TREE;
        else
            pkmnTreeDepth = TREE;
    }
    
    savedState = kbdState;
    draw();
}

function draw() {
    spriteBatch.begin(SpriteSortMode.BackToFront, null);
    
    // texture, position, --sourceRectangle--, color, rotation, origin, scale, --effects--, layerDepth
    spriteBatch.draw(sky, skyLoc, "white", skyθ, skyCOR, 1, SKY);
    spriteBatch.draw(moon, moonLoc, "white", moonθ, moonCOR, 1, MOON);
    spriteBatch.draw(sun, sunLoc, "white", sunθ, sunCOR, 1, MOON);
    
    for (let i = 0; i < stars.Length; i++)
        spriteBatch.draw(stars[i], starLocs[i], GetColor(), skyθ, starCORs[i], 1, STARS);

    //stationary
    spriteBatch.draw(landscape, landscapeLoc, "white", 0, landscapeCOR, 1, LANDSCAPE);
    spriteBatch.draw(tree, treeLoc, "white", 0, treeCOR, 1, TREE);

    // rotating and scaled objects
    spriteBatch.draw(pkmnMoon, PkmnMoonCenterPosition(), "white", pkmnMoonθ, pkmnMoonCOR, 1, PKMN_MOON);
    spriteBatch.draw(pkmnTree, pkmnTreeLoc, "white", pkmnTreeθ, pkmnTreeCOR, pkmnTreeScale, pkmnTreeDepth);

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