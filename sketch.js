// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let tetrisOne;
let optionsIcon, tetriminoClick, clearSound, bgSong;
let bgMusicPlay, sfxPlay;


function preload() {
  //load gear icon for options button
  optionsIcon = loadImage("assets/gearIcon.png");

  //load sounds used in game
  tetriminoClick = loadSound("assets/klick11.flac");
  clearSound = loadSound("assets/flaunch.wav");
  bgSong = loadSound("assets/australisfrontier.mp3");
}

function setup() {
  //creates window, loads instance of tetris, and loops song
  createCanvas(windowWidth, windowHeight);
  tetrisOne = new Tetris(1);
  tetrisOne.blockSpawner();
  bgSong.loop();
}

function reset() {
  tetrisOne = new Tetris(tetrisOne.masterVolume);
  tetrisOne.blockSpawner();
}

function draw() {
  background(220);
  if(!tetrisOne.menu && !tetrisOne.options) { //if in game, show grid, score, and ui items
    tetrisOne.drawGrid();
    tetrisOne.displayScore();
    tetrisOne.displayUpNext();
    tetrisOne.displayHold();
    if(!tetrisOne.lose && !tetrisOne.paused) { //if in game and not paused, run the game
      //drops block at interval decided by how far into the game the player is
      if(frameCount % tetrisOne.frames === 0) {
        tetrisOne.gridFall();
      }
      //constantly dropping ghost block
      for(let i = 0; i < 60; i++) {
        tetrisOne.ghostFall();
      }
      tetrisOne.lock();
      tetrisOne.softDrop();
      tetrisOne.pauseButton();
    }
    else if(tetrisOne.lose) { //show loss screen after losing
      tetrisOne.loseScreen();
    }
    else { //shows pause screen when paused
      tetrisOne.pauseScreen();
    }
  }
  if(tetrisOne.menu === true) { //shows main menu
    tetrisOne.menuScreen();
  }
  else if(tetrisOne.options === true) { //shows options menu
    tetrisOne.optionsMenu();
  }
}

function createEmptyGrid(cellsWide, cellsHigh) {
  //creates an empty grid
  let gridArray = [];
  for(let y = 0; y < cellsHigh; y++) {
    gridArray.push([]);
    for(let x = 0; x < cellsWide; x++) {
      gridArray[y].push(0);
    }
  }
  return gridArray;
}

function keyPressed() {
  //movement left and right
  if(keyCode === LEFT_ARROW) {
    tetrisOne.movement(-1);
  }
  if(keyCode === RIGHT_ARROW) {
    tetrisOne.movement(1);
  }

  //rotation of block
  if(keyCode === UP_ARROW) {
    tetrisOne.rotations();
  }

  //drops the block faster but still allows lock delay
  if(keyCode === DOWN_ARROW) {
    tetrisOne.softDropping = true;
  }

  //drops the block instantly with no lock delay
  if(keyCode === 32) { //space
    tetrisOne.hardDrop();
  }

  //holds block for later use
  if(keyCode === 67) { //c
    tetrisOne.hold();
  }

  //pauses the game
  if(keyCode === 27) { //esc
    tetrisOne.paused = !tetrisOne.paused;
  }
}

function mousePressed() {
  //clicking buttons
  if(tetrisOne.lose) { //reset button
    if(mouseX >= width/2 - tetrisOne.cellSize * 4.5 && mouseX <= width/2 + tetrisOne.cellSize * 4.5 && mouseY >= height * 3/4 - tetrisOne.cellSize * 3/2 && mouseY <= height * 3/4 + tetrisOne.cellSize * 3/2) {
      reset();
    }
  }
  else if(tetrisOne.paused) { //unpause button
    if(dist(mouseX, mouseY, width/2, height/2) <= tetrisOne.cellSize * 2.5) {
      tetrisOne.paused = false;
    }
  }
  else if(tetrisOne.menu) { //buttons on main menu
    if(dist(mouseX, mouseY, width/2 - tetrisOne.cellSize*3, height * 0.75) <= tetrisOne.cellSize * 2.25) { //play button
      tetrisOne.menu = false;
    }
    if(dist(mouseX, mouseY, width/2 + tetrisOne.cellSize*3, height * 0.75) <= tetrisOne.cellSize * 2.25) { //options button
      tetrisOne.options = true;
      tetrisOne.menu = false;
    }
  }
  else if(tetrisOne.options) { //buttons on options menu
    if(dist(mouseX, mouseY, width / 2 + tetrisOne.cellSize * 6, tetrisOne.cellSize * 2) <= tetrisOne.cellSize) { //return to main menu
      tetrisOne.menu = true;
      tetrisOne.options = false;
    }
    //increase master volume
    else if(dist(mouseX, mouseY, width/2 + tetrisOne.cellSize*5.75, height/4 + tetrisOne.cellSize * 2) <= tetrisOne.cellSize * 0.75) { 
      tetrisOne.volumeAdjuster(0, 1);
    }
    //decrease master volume
    else if(dist(mouseX, mouseY, width/2 - tetrisOne.cellSize*5.75, height/4 + tetrisOne.cellSize * 2) <= tetrisOne.cellSize * 0.75) {
      tetrisOne.volumeAdjuster(0, -1);
    }
  }
  else { //pause button in-game
    if(dist(mouseX, mouseY, width - tetrisOne.cellSize * 2, tetrisOne.cellSize * 2) <= tetrisOne.cellSize) {
      tetrisOne.paused = true;
    }
  }
}

class Tetris { //all data and behaviours needed to instantiate a game of Tetris
  constructor(masterVolume) { //holds all variables needed for Tetris to be played
    this.gridHeight = 22;
    this.gridWidth = 10;
    this.block;
    this.staticGrid = createEmptyGrid(this.gridWidth, this.gridHeight);
    this.droppingGrid = createEmptyGrid(this.gridWidth, this.gridHeight);
    this.ghostGrid = createEmptyGrid(this.gridWidth, this.gridHeight);
    this.upNextGrid = createEmptyGrid(4, 8);
    this.holdGrid = createEmptyGrid(4, 2);
    this.state = 1;
    if(height / this.gridHeight <= width/12) {
      this.cellSize = height / this.gridHeight;
    }
    else {
      this.cellSize = width / 14;
    }
    this.lose = false;
    this.buttonColor = color(180);
    this.level = 1;
    this.frames = 43;
    this.linesCleared = 0;
    this.newLinesCleared;
    this.score = 0;
    this.lockTime = 500;
    this.lockTimer = 0;
    this.stuck = false;
    this.softDropping = false;
    this.cellColor = color(255, 255, 255);
    this.blockArray = [];
    this.blockArrayRandomized = [];
    this.holdMap = new Map();
    this.alreadyHeld = false;
    this.paused = false;
    this.menu = true;
    this.options = false;
    this.masterVolume = masterVolume;
  }

  menuScreen() { //shows main menu containing title, play button, options button, and instructions button
    strokeWeight(2);
    fill(127, 127, 127);
    rectMode(CENTER);
    rect(width/2, height/2, this.cellSize*(this.gridWidth + 5) , this.cellSize*this.gridHeight);

    fill("red");
    textAlign(CENTER, CENTER);
    textSize(this.cellSize * 3);
    text("T E T R I S", width/2, this.cellSize * 7);

    if(dist(mouseX, mouseY, width/2 - this.cellSize*3, height * 0.75) <= this.cellSize * 2.25) { //play button
      this.buttonColor = color(220);
    }
    else {
      this.buttonColor = color(180);
    }
    fill(this.buttonColor);
    rect(width/2 - this.cellSize*3, height * 0.75, this.cellSize * 4.5, this.cellSize * 4.5, this.cellSize);
    fill(0);
    triangle(width/2 - this.cellSize*3 - this.cellSize*1.35, height * 0.75 + this.cellSize*1.5, width/2 - this.cellSize*3 - this.cellSize*1.35, height * 0.75 - this.cellSize*1.5, width/2 - this.cellSize*3 + this.cellSize*1.75, height * 0.75);

    if(dist(mouseX, mouseY, width/2 + this.cellSize*3, height * 0.75) <= this.cellSize * 2.25) { //options button
      this.buttonColor = color(220);
    }
    else {
      this.buttonColor = color(180);
    }
    fill(this.buttonColor);
    rect(width/2 + this.cellSize*3, height * 0.75, this.cellSize * 4.5, this.cellSize * 4.5, this.cellSize);
    imageMode(CENTER);
    image(optionsIcon, width/2 + this.cellSize*3, height * 0.75);
  }

  optionsMenu() { //shows options menu containing volume adjustments
    fill(127, 127, 127);
    rectMode(CENTER);
    rect(width/2, height/2, this.cellSize*(this.gridWidth + 5) , this.cellSize*this.gridHeight);

    if(dist(mouseX, mouseY, width - width / 2 + this.cellSize * 6, this.cellSize * 2) <= this.cellSize) { //return to menu button
      this.buttonColor = color(220);
    }
    else {
      this.buttonColor = color(180);
    }
    rectMode(CENTER);
    fill(this.buttonColor);
    rect(width / 2 + this.cellSize * 6, this.cellSize * 2, this.cellSize * 2, this.cellSize * 2, this.cellSize/5);
    fill(0);
    textAlign(CENTER);
    textSize(this.cellSize * 2);
    text("X", width / 2 + this.cellSize * 6, this.cellSize * 2.2);
    rectMode(CORNER);

    fill("red");
    text("Master Volume:", width/2, height/4);
    rectMode(CORNER);
    for(let i = 1; i < 11; i++) {
      if(this.masterVolume * 10 < i) {
        fill(160);
      }
      else {
        fill(240);
      }
      rect(width/2 - 4.75*this.cellSize + i*this.cellSize - this.cellSize, height/4 + this.cellSize, this.cellSize / 2, this.cellSize*2);
    }

    //right arrow for master volume
    if(dist(mouseX, mouseY, width/2 + this.cellSize*5.75, height/4 + this.cellSize * 2) <= this.cellSize * 0.75) {
      this.buttonColor = color(220);
    }
    else {
      this.buttonColor = color(180);
    }
    fill(this.buttonColor);
    rect(width/2 + this.cellSize*5, height/4 + this.cellSize * 1.25, this.cellSize * 1.5, this.cellSize * 1.5, this.cellSize/4);
    fill(0);
    triangle(width/2 + this.cellSize*5.75 - this.cellSize*0.45, height/4 + this.cellSize * 2 + this.cellSize*0.5, width/2 + this.cellSize*5.75 - this.cellSize*0.45, height/4 + this.cellSize * 2 - this.cellSize*0.5, width/2 + this.cellSize*5.75 + this.cellSize*0.58, height/4 + this.cellSize * 2);

    //left arrow for master volume
    if(dist(mouseX, mouseY, width/2 - this.cellSize*5.75, height/4 + this.cellSize * 2) <= this.cellSize * 0.75) {
      this.buttonColor = color(220);
    }
    else {
      this.buttonColor = color(180);
    }
    fill(this.buttonColor);
    rect(width/2 - this.cellSize*6.5, height/4 + this.cellSize * 1.25, this.cellSize * 1.5, this.cellSize * 1.5, this.cellSize/4);
    fill(0);
    triangle(width/2 - this.cellSize*5.75 + this.cellSize*0.45, height/4 + this.cellSize * 2 + this.cellSize*0.5, width/2 - this.cellSize*5.75 + this.cellSize*0.45, height/4 + this.cellSize * 2 - this.cellSize*0.5, width/2 - this.cellSize*5.75 - this.cellSize*0.58, height/4 + this.cellSize * 2);
  }

  volumeAdjuster(volumeType, directionOfChange) {
    let currentType = null;
    if(volumeType === 0) {
      currentType = this.masterVolume;
    }

    if(currentType + directionOfChange*0.1 >= 0 && currentType + directionOfChange*0.1 <= 1) {
      currentType += 0.1*directionOfChange;
    }

    if(volumeType === 0) {
      this.masterVolume = currentType;
      outputVolume(this.masterVolume);
    }
  }

  pauseScreen() { //pauses the game, preventing blocks from falling
    if(dist(mouseX, mouseY, width/2, height/2) <= this.cellSize * 2.5) {
      this.buttonColor = color(220);
    }
    else {
      this.buttonColor = color(180);
    }
    rectMode(CENTER);
    fill(this.buttonColor);
    rect(width/2, height/2, this.cellSize * 5, this.cellSize * 5, this.cellSize);
    fill(0);
    rect(width/2 - this.cellSize*0.75, height/2, this.cellSize*0.75, this.cellSize * 2.5);
    rect(width/2 + this.cellSize*0.75, height/2, this.cellSize*0.75, this.cellSize * 2.5);
    rectMode(CORNER);
  }

  pauseButton() { //shows pause button in top right corner
    if(dist(mouseX, mouseY, width - this.cellSize * 2, this.cellSize * 2) <= this.cellSize) {
      this.buttonColor = color(220);
    }
    else {
      this.buttonColor = color(180);
    }
    rectMode(CENTER);
    fill(this.buttonColor);
    rect(width - this.cellSize * 2, this.cellSize * 2, this.cellSize * 2, this.cellSize * 2, this.cellSize/5);
    fill(0);
    rect(width - this.cellSize * 2 - this.cellSize*0.3, this.cellSize * 2, this.cellSize*0.3, this.cellSize);
    rect(width - this.cellSize * 2 + this.cellSize*0.3, this.cellSize * 2, this.cellSize*0.3, this.cellSize);
    rectMode(CORNER);
  }

  blockSpawner(blockToSpawn) { //spawns blocks into the game
    if(blockToSpawn === undefined) { //if not given a block to spawn
      //creates a randomized array of all seven blocks
      if(this.blockArrayRandomized.length < 4) {
        this.blockArray = [1, 2, 3, 4, 5, 6, 7];
        for(let i = 0; i < 7; i++) {
          this.blockArrayRandomized.push(this.blockArray.splice(int(random(0, this.blockArray.length)), 1));
        }
      }
      this.block = this.blockArrayRandomized.shift()[0];
    }
    else {
      this.block = blockToSpawn; //if given a block to spawn
    }
    //places chosen block into the grid
    this.droppingGrid = createEmptyGrid(this.gridWidth, this.gridHeight);
    this.ghostGrid = createEmptyGrid(this.gridWidth, this. gridHeight);
    if(this.block === 1) { //T block
      this.droppingGrid[0][4] = 1;
      this.droppingGrid[0][5] = 1;
      this.droppingGrid[0][6] = 1;
      this.droppingGrid[1][5] = 1;
      this.ghostGrid[0][4] = 1;
      this.ghostGrid[0][5] = 1;
      this.ghostGrid[0][6] = 1;
      this.ghostGrid[1][5] = 1;
      this.state = 1;
    }
    else if(this.block === 2) { //O block
      this.droppingGrid[0][4] = 2;
      this.droppingGrid[0][5] = 2;
      this.droppingGrid[1][4] = 2;
      this.droppingGrid[1][5] = 2;
      this.ghostGrid[0][4] = 2;
      this.ghostGrid[0][5] = 2;
      this.ghostGrid[1][4] = 2;
      this.ghostGrid[1][5] = 2;
    }
    else if(this.block === 3) { //I block
      this.droppingGrid[0][3] = 3;
      this.droppingGrid[0][4] = 3;
      this.droppingGrid[0][5] = 3;
      this.droppingGrid[0][6] = 3;
      this.ghostGrid[0][3] = 3;
      this.ghostGrid[0][4] = 3;
      this.ghostGrid[0][5] = 3;
      this.ghostGrid[0][6] = 3;
      this.state = 1;
    }
    else if(this.block === 4) { //J block
      this.droppingGrid[0][4] = 4;
      this.droppingGrid[0][5] = 4;
      this.droppingGrid[0][6] = 4;
      this.droppingGrid[1][6] = 4;
      this.ghostGrid[0][4] = 4;
      this.ghostGrid[0][5] = 4;
      this.ghostGrid[0][6] = 4;
      this.ghostGrid[1][6] = 4;
      this.state = 1;
    }
    else if(this.block === 5) { //L block
      this.droppingGrid[0][4] = 5;
      this.droppingGrid[0][5] = 5;
      this.droppingGrid[0][6] = 5;
      this.droppingGrid[1][4] = 5;
      this.ghostGrid[0][4] = 5;
      this.ghostGrid[0][5] = 5;
      this.ghostGrid[0][6] = 5;
      this.ghostGrid[1][4] = 5;
      this.state = 1;
    }
    else if(this.block === 6) { //S block
      this.droppingGrid[0][5] = 6;
      this.droppingGrid[0][6] = 6;
      this.droppingGrid[1][5] = 6;
      this.droppingGrid[1][4] = 6;
      this.ghostGrid[0][5] = 6;
      this.ghostGrid[0][6] = 6;
      this.ghostGrid[1][5] = 6;
      this.ghostGrid[1][4] = 6;
      this.state = 1;
    }
    else if(this.block === 7) { //S block
      this.droppingGrid[0][4] = 7;
      this.droppingGrid[0][5] = 7;
      this.droppingGrid[1][5] = 7;
      this.droppingGrid[1][6] = 7;
      this.ghostGrid[0][4] = 7;
      this.ghostGrid[0][5] = 7;
      this.ghostGrid[1][5] = 7;
      this.ghostGrid[1][6] = 7;
      this.state = 1;
    }
    this.alreadyHeld = false;
  }

  displayUpNext() { //displays up next grid on the left side of the screen
    this.upNextGrid = createEmptyGrid(4, 8);
    //adds blocks to grid
    for(let i = 0; i < 3; i++) {
      if(this.blockArrayRandomized[i][0] === 1) { //T block
        this.upNextGrid[i*3][0] = 1;
        this.upNextGrid[i*3][1] = 1;
        this.upNextGrid[i*3][2] = 1;
        this.upNextGrid[i*3 + 1][1] = 1;
      }
      else if(this.blockArrayRandomized[i][0] === 2) { //O block
        this.upNextGrid[i*3][0] = 2;
        this.upNextGrid[i*3][1] = 2;
        this.upNextGrid[i*3 + 1][0] = 2;
        this.upNextGrid[i*3 + 1][1] = 2;
      }
      else if(this.blockArrayRandomized[i][0] === 3) { //I block
        this.upNextGrid[i*3][0] = 3;
        this.upNextGrid[i*3][1] = 3;
        this.upNextGrid[i*3][2] = 3;
        this.upNextGrid[i*3][3] = 3;
      }
      else if(this.blockArrayRandomized[i][0] === 4) { //J block
        this.upNextGrid[i*3][0] = 4;
        this.upNextGrid[i*3][1] = 4;
        this.upNextGrid[i*3][2] = 4;
        this.upNextGrid[i*3 + 1][2] = 4;
      }
      else if(this.blockArrayRandomized[i][0] === 5) { //L block
        this.upNextGrid[i*3][0] = 5;
        this.upNextGrid[i*3][1] = 5;
        this.upNextGrid[i*3][2] = 5;
        this.upNextGrid[i*3 + 1][0] = 5;
      }
      else if(this.blockArrayRandomized[i][0] === 6) { //S block
        this.upNextGrid[i*3][1] = 6;
        this.upNextGrid[i*3][2] = 6;
        this.upNextGrid[i*3 + 1][1] = 6;
        this.upNextGrid[i*3 + 1][0] = 6;
      }
      else if(this.blockArrayRandomized[i][0] === 7) { //S block
        this.upNextGrid[i*3][0] = 7;
        this.upNextGrid[i*3][1] = 7;
        this.upNextGrid[i*3 + 1][1] = 7;
        this.upNextGrid[i*3 + 1][2] = 7;
      }
    }
    textAlign(LEFT, TOP);
    text("Up Next:", width/2 + this.cellSize * 5.5, this.cellSize * 5);
    //sets color and displays up next grid
    for(let y = 0; y < this.upNextGrid.length; y++) {
      for(let x = 0; x < this.upNextGrid[y].length; x++) {    
        if(this.upNextGrid[y][x] === 1) {
          this.cellColor = color(128, 0, 128);
        }
        else if(this.upNextGrid[y][x] === 2) {
          this.cellColor = color(255, 255, 0);
        }
        else if(this.upNextGrid[y][x] === 3) {
          this.cellColor = color(0, 255, 255);
        }
        else if(this.upNextGrid[y][x] === 4) {
          this.cellColor = color(0, 0, 255);
        }
        else if(this.upNextGrid[y][x] === 5) {
          this.cellColor = color(255, 127, 0);
        }
        else if(this.upNextGrid[y][x] === 6) {
          this.cellColor = color(0, 255, 0);
        }
        else if(this.upNextGrid[y][x] === 7) {
          this.cellColor = color(255, 0, 0);
        }
        if(this.upNextGrid[y][x] !== 0) {
          fill(this.cellColor);
          rect(x * this.cellSize + width/2 + this.cellSize * 7, y * this.cellSize + this.cellSize * 7, this.cellSize, this.cellSize);
        }
      }
    }
  }

  hold() { //ability to hold a block
    if(this.alreadyHeld === false) { //cannot switch blocks multiple times
      if(this.holdMap.has("heldBlock")) { //if there is already a held block, current block and held block are swapped
        let tempHoldBlock = this.block;
        this.blockSpawner(this.holdMap.get("heldBlock"));
        this.holdMap.set("heldBlock", tempHoldBlock);
      }
      else { //if there is no held block, current block is held and randomized drops continue
        this.holdMap.set("heldBlock", this.block);
        this.blockSpawner();
      }
      this.alreadyHeld = true;
    }
  }

  displayHold() { //displays held block UI element
    //adds held block to grid
    this.holdGrid = createEmptyGrid(4, 2);
    if(this.holdMap.get("heldBlock") === 1) { //T block
      this.holdGrid[0][1] = 1;
      this.holdGrid[0][3] = 1;
      this.holdGrid[0][2] = 1;
      this.holdGrid[1][2] = 1;
    }
    else if(this.holdMap.get("heldBlock") === 2) { //O block
      this.holdGrid[0][1] = 2;
      this.holdGrid[0][2] = 2;
      this.holdGrid[1][1] = 2;
      this.holdGrid[1][2] = 2;
    }
    else if(this.holdMap.get("heldBlock") === 3) { //I block
      this.holdGrid[0][0] = 3;
      this.holdGrid[0][1] = 3;
      this.holdGrid[0][2] = 3;
      this.holdGrid[0][3] = 3;
    }
    else if(this.holdMap.get("heldBlock") === 4) { //J block
      this.holdGrid[0][1] = 4;
      this.holdGrid[0][2] = 4;
      this.holdGrid[0][3] = 4;
      this.holdGrid[1][3] = 4;
    }
    else if(this.holdMap.get("heldBlock") === 5) { //L block
      this.holdGrid[0][1] = 5;
      this.holdGrid[0][2] = 5;
      this.holdGrid[0][3] = 5;
      this.holdGrid[1][1] = 5;
    }
    else if(this.holdMap.get("heldBlock") === 6) { //S block
      this.holdGrid[0][2] = 6;
      this.holdGrid[0][3] = 6;
      this.holdGrid[1][2] = 6;
      this.holdGrid[1][1] = 6;
    }
    else if(this.holdMap.get("heldBlock") === 7) { //S block
      this.holdGrid[0][1] = 7;
      this.holdGrid[0][2] = 7;
      this.holdGrid[1][2] = 7;
      this.holdGrid[1][3] = 7;
    }
    fill("red");
    textAlign(RIGHT, TOP);
    text("Held:", width/2 - this.cellSize * 5.5, this.cellSize * 5);
    //colors and displays the grid containing held block
    for(let y = 0; y < this.holdGrid.length; y++) {
      for(let x = 0; x < this.holdGrid[y].length; x++) {    
        if(this.holdGrid[y][x] === 1) {
          this.cellColor = color(128, 0, 128);
        }
        else if(this.holdGrid[y][x] === 2) {
          this.cellColor = color(255, 255, 0);
        }
        else if(this.holdGrid[y][x] === 3) {
          this.cellColor = color(0, 255, 255);
        }
        else if(this.holdGrid[y][x] === 4) {
          this.cellColor = color(0, 0, 255);
        }
        else if(this.holdGrid[y][x] === 5) {
          this.cellColor = color(255, 127, 0);
        }
        else if(this.holdGrid[y][x] === 6) {
          this.cellColor = color(0, 255, 0);
        }
        else if(this.holdGrid[y][x] === 7) {
          this.cellColor = color(255, 0, 0);
        }
        if(this.holdGrid[y][x] !== 0) {
          fill(this.cellColor);
          rect(x * this.cellSize + width/2 - this.cellSize * 9.5, y * this.cellSize + this.cellSize * 7, this.cellSize, this.cellSize);
        }
      }
    }
  }

  drawGrid() { //displays the grid the game is played on
    //draws the grid and sets all blocks to the correct color
    for(let y = 0; y < this.gridHeight; y++) {
      for(let x = 0; x < this.gridWidth; x++) {
        if(this.staticGrid[y][x] === 1 || this.droppingGrid[y][x] === 1 || this.ghostGrid[y][x] === 1) {
          this.cellColor = color(128, 0, 128);
        }
        else if(this.staticGrid[y][x] === 2 || this.droppingGrid[y][x] === 2 || this.ghostGrid[y][x] === 2) {
          this.cellColor = color(255, 255, 0);
        }
        else if(this.staticGrid[y][x] === 3 || this.droppingGrid[y][x] === 3 || this.ghostGrid[y][x] === 3) {
          this.cellColor = color(0, 255, 255);
        }
        else if(this.staticGrid[y][x] === 4 || this.droppingGrid[y][x] === 4 || this.ghostGrid[y][x] === 4) {
          this.cellColor = color(0, 0, 255);
        }
        else if(this.staticGrid[y][x] === 5 || this.droppingGrid[y][x] === 5 || this.ghostGrid[y][x] === 5) {
          this.cellColor = color(255, 127, 0);
        }
        else if(this.staticGrid[y][x] === 6 || this.droppingGrid[y][x] === 6 || this.ghostGrid[y][x] === 6) {
          this.cellColor = color(0, 255, 0);
        }
        else if(this.staticGrid[y][x] === 7 || this.droppingGrid[y][x] === 7 || this.ghostGrid[y][x] === 7) {
          this.cellColor = color(255, 0, 0);
        }
        else if(this.staticGrid[y][x] === 0) {
          this.cellColor = color(127, 127, 127);
        }
        if(this.ghostGrid[y][x] !== 0 && this.droppingGrid[y][x] === 0) {
          this.cellColor.setAlpha(25);
        }
        fill(this.cellColor);
        rect(x * this.cellSize + width/2 - this.cellSize * this.gridWidth/2, y*this.cellSize, this.cellSize);
      }
    }
    //adds line showing where game will be lost
    strokeWeight(10);
    line(width/2 - this.cellSize * this.gridWidth/2, this.cellSize * 2 , width/2 + this.cellSize * this.gridWidth/2, this.cellSize*2);
    strokeWeight(2);
  }

  gridFall() { //drops current block
    if(this.stuck === false) {
      //creates new grid identical the one dropping a piece
      let gridDropCheck = [];
      for(let y = 0; y < this.gridHeight; y++) {
        gridDropCheck.push([]);
        for(let x = 0; x < this.gridWidth; x++) {
          gridDropCheck[y].push(this.droppingGrid[y][x]);
        }
      }
  
      //checks if block can fall
      for(let y = this.gridHeight-1; y >= 0; y--) {
        for(let x = this.gridWidth-1; x >= 0; x--) {
          if(gridDropCheck[y][x] !== 0) {    
            if(y < this.gridHeight-1) {
              if(this.staticGrid[y+1][x] === 0) {
                gridDropCheck[y+1][x] = gridDropCheck[y][x];
                gridDropCheck[y][x] = 0;
              }
              else { //if block cannot fall, let another function decide if it should be locked
                if(this.hardDropping === false) {
                  this.lockTimer = millis() + this.lockTime;
                }
                this.stuck = true;
                this.hardDropping = false;
                return;
              } 
            } 
            else { //if block cannot fall, let another function decide if it should be locked
              if(this.hardDropping === false) {
                this.lockTimer = millis() + this.lockTime;
              }
              this.stuck = true;
              this.hardDropping = false;
              return;
            } 
          }
        }
      }
      this.droppingGrid = gridDropCheck;
    }
  }

  ghostFall() { //drops the ghost block
    if(this.stuck === false) {
      //creates new grid identical the one dropping a piece
      let gridDropCheck = [];
      for(let y = 0; y < this.gridHeight; y++) {
        gridDropCheck.push([]);
        for(let x = 0; x < this.gridWidth; x++) {
          gridDropCheck[y].push(this.ghostGrid[y][x]);
        }
      }
  
      //checks if block can fall
      let counter = 0;
      for(let y = this.gridHeight-1; y >= 0; y--) {
        for(let x = this.gridWidth-1; x >= 0; x--) {
          if(gridDropCheck[y][x] !== 0) {    
            if(y < this.gridHeight-1) {
              if(this.staticGrid[y+1][x] === 0) {
                gridDropCheck[y+1][x] = gridDropCheck[y][x];
                gridDropCheck[y][x] = 0;
                counter++;
                if(counter % 4 === 0) {
                  this.ghostGrid = gridDropCheck;
                }
              }
              else {
                return;
              }
            } 
            else {
              return;
            }
          }
        }
      }
      this.ghostGrid = gridDropCheck;
    }
  }

  lock() { //locks block into static grid
    if(this.stuck === true) { //restarts gridfall process if block is moved from a stuck position
      let stuckCount = 0;
      //checks if block can fall
      for(let y = 0; y < this.gridHeight; y++) {
        for(let x = 0; x < this.gridWidth; x++) {
          if(this.droppingGrid[y][x] !== 0) {   
            if(y >= this.gridHeight-1) {
              stuckCount++;
            }
            else if(this.staticGrid[y+1][x] !== 0) {
              stuckCount++;
            }
          }
        }
      }
      if(stuckCount === 0) {
        this.stuck = false;
      }
    }

    if(this.lockTimer < millis() && this.stuck === true) { //if block is truely stuck, lock it in place and check if line is cleared
      for(let y2 = 0; y2 < this.gridHeight; y2++) { 
        for(let x2 = 0; x2 < this.gridWidth; x2++) {
          if(this.droppingGrid[y2][x2] !== 0) {
            this.staticGrid[y2][x2] = this.droppingGrid[y2][x2];
          }
        }
      }
      tetriminoClick.play();
      this.newLinesCleared = 0;
      this.clearLineCheck();
      this.stuck = false;
    }
  }

  clearLineCheck() { //checks to see if any line has been completed
    let counter = 0;
    for(let y = 0; y < this.gridHeight; y++) {
      counter = 0;
      for(let x = 0; x < this.gridWidth; x++) {
        if(this.staticGrid[y][x] !== 0) {
          counter++;
        }
        if(counter === 10) { //if line is completed, clear it and update score
          this.clearLine(y);
          this.recordScore();
          clearSound.play();
        }
      }
    }
    this.loseCheck();
    this.blockSpawner();
  }

  recordScore() { //records score based on how many lines are cleared
    this.newLinesCleared++;
    if(this.newLinesCleared === 1) {
      this.score += this.level * 100;
    }
    else if(this.newLinesCleared < 4) {
      this.score += this.level * 200;
    }
    else {
      this.score += this.level * 300;
    }
  }

  displayScore() { //displays score and level
    textSize(this.cellSize * 1.5);
    fill("red");
    textAlign(LEFT, TOP);
    text("Score:", width/2 + this.cellSize * 5.5, this.cellSize / 2);
    text(this.score, width/2 + this.cellSize * 5.5, this.cellSize * 2);
    textAlign(RIGHT, TOP);
    text("Level:", width/2 - this.cellSize * 5.5, this.cellSize / 2);
    text(this.level, width/2 - this.cellSize * 5.5, this.cellSize * 2);
  }

  loseScreen() { //what is displayed after losing the game
    //loss text
    fill("black");
    textSize(this.cellSize * 3);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    stroke("white");
    strokeWeight(this.cellSize / 10);
    text("You Lost!", width/2, height/4);
    textSize(this.cellSize * 1.5);
    text("You Cleared " + this.linesCleared + " Lines!", width/2, height / 2);

    //reset button
    if(mouseX >= width/2 - this.cellSize * 4.5 && mouseX <= width/2 + this.cellSize * 4.5 && mouseY >= height * 3/4 - this.cellSize * 3/2 && mouseY <= height * 3/4 + this.cellSize * 3/2) {
      this.buttonColor = color(220);
    }
    else {
      this.buttonColor = color(180);
    }
    stroke("black");
    rectMode(CENTER);
    fill(this.buttonColor);
    rect(width/2, height * 3/4, this.cellSize * 9, this.cellSize * 3);
    fill("black");
    text("R E S E T", width/2, height * 3/4 + 10);
    rectMode(CORNER);
    strokeWeight(2);
  }

  clearLine(completedY) { //clears lines that have been completed
    for(let x = 0; x < this.gridWidth; x++) {
      this.staticGrid[completedY].splice(x, 1, 0);
    }
    for(let y = completedY; y > 0; y--) {
      for(let x = 0; x < this.gridWidth; x++) {
        this.staticGrid[y][x] = this.staticGrid[y-1][x];
      }
    }
    this.linesCleared++;
    this.setLevel();
  }

  setLevel() { //sets speed of game based on how many lines have been cleared
    if(this.linesCleared % 10 === 0) {
      this.level++;
    }
    if(this.level === 1) {
      this.frames = 43;
    }
    else if(this.level === 2) {
      this.frames = 38;
    }
    else if(this.level === 3) {
      this.frames = 33;
    }
    else if(this.level === 4) {
      this.frames = 28;
    }
    else if(this.level === 5) {
      this.frames = 23;
    }
    else if(this.level === 6) {
      this.frames = 18;
    }
    else if(this.level === 7) {
      this.frames = 13;
    }
    else if(this.level === 8) {
      this.frames = 8;
    }
    else if(this.level === 9) {
      this.frames = 6;
    }
    else if(this.level >= 10 && this.level <= 12) {
      this.frames = 5;
    }
    else if(this.level >= 13 && this.level <= 15) {
      this.frames = 4;
    }
    else if(this.level >= 16 && this.level <= 18) {
      this.frames = 3;
    }
    else if(this.level >= 19 && this.level <= 28) {
      this.frames = 2;
    }
    else if(this.level >= 29) {
      this.frames = 1;
    }
  }

  softDrop() { //drops the block faster while still allowing lock delay when down arrow is held
    if(this.softDropping === true) {
      if(keyIsDown(40)) {
        if(frameCount % 3 === 0) {
          tetrisOne.gridFall();
        }
        if(this.stuck === true) {
          this.softDropping = false;
        }
      }
      else {
        this.softDropping = false;
      }
    }
  }

  hardDrop() { //drops the block instantly with no delay when space is clicked
    this.hardDropping = true;
    for(let i = 0; i < 60; i++) {
      this.gridFall();
    }
  }

  movement(direction) {
    //move left using a 2nd grid to check for valid moves
    if(direction === -1) {
      let gridLSideCheck = [];
      for(let y = 0; y < this.gridHeight; y++) {
        gridLSideCheck.push([]);
        for(let x = 0; x < this.gridWidth; x++) {
          gridLSideCheck[y].push(this.droppingGrid[y][x]);
        }
      }
      for(let y = 0; y < this.gridHeight; y++) { 
        for(let x = 0; x < this.gridWidth; x++) {
          if(gridLSideCheck[y][x] !== 0) {
            if(x >= 1) {
              if(this.staticGrid[y][x-1] === 0) {
                gridLSideCheck[y][x-1] = gridLSideCheck[y][x];
                gridLSideCheck[y][x] = 0;
              }
              else {
                return;
              }
            }
            else {
              return;
            }
          }
        }
      }
      this.droppingGrid = gridLSideCheck;
      this.ghostGrid = this.droppingGrid;
    }

    //move right using a second grid to check for valid moves
    if(direction === 1) {
      let gridRSideCheck = [];
      for(let y = 0; y < this.gridHeight; y++) {
        gridRSideCheck.push([]);
        for(let x = 0; x < this.gridWidth; x++) {
          gridRSideCheck[y].push(this.droppingGrid[y][x]);
        }
      }
      for(let y = this.gridHeight - 1; y >= 0; y--) { 
        for(let x = this.gridWidth - 1; x >= 0; x--) {
          if(gridRSideCheck[y][x] !== 0) {
            if(x < this.gridWidth) {
              if(this.staticGrid[y][x+1] === 0) {
                gridRSideCheck[y][x+1] = gridRSideCheck[y][x];
                gridRSideCheck[y][x] = 0;
              }
              else {
                return;
              }
            }
            else {
              return;
            }
          }
        }
      }
      this.droppingGrid = gridRSideCheck;
      this.ghostGrid = this.droppingGrid;
    }
  }

  rotations() { //rotates the block
    //creates a 2nd grid to check for valid rotations
    let gridRotateCheck = [];
    for(let y = 0; y < this.droppingGrid.length; y++) {
      gridRotateCheck.push([]);
      for(let x = 0; x < this.droppingGrid[y].length; x++) {
        gridRotateCheck[y].push(this.droppingGrid[y][x]);
      }
    }

    //Rotating T-Block
    if(this.block === 1) {
      for(let y = 0; y < this.gridHeight; y++) {
        for(let x = 0; x < this.gridWidth; x++) {
          if(gridRotateCheck[y][x] === 1) {
            if(this.state === 1) {
              if(y > 0 && x < this.gridWidth - 1 && this.staticGrid[y-1][x+1] === 0) {
                gridRotateCheck[y-1][x+1] = 1;
                gridRotateCheck[y][x+2] = 0;

                this.state = 2;
              }
            }
            else if(this.state === 2) {
              if(x < this.gridWidth - 1 && y < this.gridHeight - 1 && this.staticGrid[y+1][x+1] === 0) {
                gridRotateCheck[y+1][x+1] = 1;
                gridRotateCheck[y+2][x] = 0;

                this.state = 3;
              }
            }
            else if(this.state === 3) {
              if(y < this.gridHeight - 2 && this.staticGrid[y+2][x] === 0) {
                gridRotateCheck[y+2][x] = 1;
                gridRotateCheck[y+1][x-1] = 0;

                this.state = 4;
              }
            }
            else if(this.state === 4) {
              if(x > 0 && y < this.gridHeight - 1 && this.staticGrid[y+1][x-1] === 0) {
                gridRotateCheck[y+1][x-1] = 1;
                gridRotateCheck[y][x] = 0;

                this.state = 1;
              }
            }
            this.droppingGrid = gridRotateCheck;
            this.ghostGrid = this.droppingGrid;
            return;
          }
        }
      }
    }

    //Rotating I-this.Block
    if(this.block === 3) {
      for(let y = 0; y < this.gridHeight; y++) {
        for(let x = 0; x < this.gridWidth; x++) {
          if(gridRotateCheck[y][x] === 3) {
            if(this.state === 1) {
              if(y > 0 && y < this.gridHeight - 2 && this.staticGrid[y-1][x+2] === 0 && this.staticGrid[y+1][x+2] === 0 && this.staticGrid[y+2][x+2] === 0) {
                gridRotateCheck[y-1][x+2] = 3;
                gridRotateCheck[y+1][x+2] = 3;
                gridRotateCheck[y+2][x+2] = 3;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y][x+1] = 0;
                gridRotateCheck[y][x+3] = 0;
                this.state = 2;
              }
            }
            else if(this.state === 2) {
              if(y < this.gridHeight - 2 && x > 1 && x < this.gridWidth - 1 && this.staticGrid[y+2][x-2] === 0 && this.staticGrid[y+2][x-1] === 0 && this.staticGrid[y+2][x+1] === 0) {
                gridRotateCheck[y+2][x-2] = 3;
                gridRotateCheck[y+2][x-1] = 3;
                gridRotateCheck[y+2][x+1] = 3;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+1][x] = 0;
                gridRotateCheck[y+3][x] = 0;

                this.state = 3;
              }
            }
            else if(this.state === 3) {
              if(y < this.gridHeight - 2 && y > 1 && x < this.gridWidth - 1 && this.staticGrid[y-2][x+1] === 0 && this.staticGrid[y-1][x+1] === 0 && this.staticGrid[y+1][x+1] === 0) {
                gridRotateCheck[y-2][x+1] = 3;
                gridRotateCheck[y-1][x+1] = 3;
                gridRotateCheck[y+1][x+1] = 3;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y][x+2] = 0;
                gridRotateCheck[y][x+3] = 0;

                this.state = 4;
              }
            }
            else if(this.state === 4) {
              if(y < this.gridHeight - 1 && x < this.gridWidth - 2 && x > 0 && this.staticGrid[y+1][x-1] === 0 && this.staticGrid[y+1][x+1] === 0 && this.staticGrid[y+1][x+2] === 0) {
                gridRotateCheck[y+1][x-1] = 3;
                gridRotateCheck[y+1][x+1] = 3;
                gridRotateCheck[y+1][x+2] = 3;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+2][x] = 0;
                gridRotateCheck[y+3][x] = 0;

                this.state = 1;
              }
            }
            this.droppingGrid = gridRotateCheck;
            this.ghostGrid = this.droppingGrid;
            return;
          }
        }
      }
    }

    //Rotating J-this.Block
    if(this.block === 4) {
      for(let y = 0; y < this.gridHeight; y++) {
        for(let x = 0; x < this.gridWidth; x++) {
          if(gridRotateCheck[y][x] === 4) {
            if(this.state === 1) {
              if(y < this.gridHeight - 1 && y > 0 && x < this.gridWidth - 1 && this.staticGrid[y-1][x+1] === 0 && this.staticGrid[y+1][x+1] === 0 && this.staticGrid[y+1][x] === 0) {
                gridRotateCheck[y-1][x+1] = 4;
                gridRotateCheck[y+1][x+1] = 4;
                gridRotateCheck[y+1][x] = 4;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y][x+2] = 0;
                gridRotateCheck[y+1][x+2] = 0;
                this.state = 2;
              }
            }
            else if(this.state === 2) {
              if(y < this.gridHeight - 1 && x > 0 && x < this.gridWidth - 1 && this.staticGrid[y][x-1] === 0 && this.staticGrid[y+1][x-1] === 0 && this.staticGrid[y+1][x+1] === 0) {
                gridRotateCheck[y][x-1] = 4;
                gridRotateCheck[y+1][x-1] = 4;
                gridRotateCheck[y+1][x+1] = 4;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+2][x] = 0;
                gridRotateCheck[y+2][x-1] = 0;
                this.state = 3;
              }
            }
            else if(this.state === 3) {
              if(y < this.gridHeight - 2 && x < this.gridWidth - 2 && this.staticGrid[y][x+1] === 0 && this.staticGrid[y][x+2] === 0 && this.staticGrid[y+2][x+1] === 0) {
                gridRotateCheck[y][x+1] = 4;
                gridRotateCheck[y][x+2] = 4;
                gridRotateCheck[y+2][x+1] = 4;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+1][x] = 0;
                gridRotateCheck[y+1][x+2] = 0;
                this.state = 4;
              }
            }
            else if(this.state === 4) {
              if(y < this.gridHeight - 1 && y > 0 && x < this.gridWidth - 1 && this.staticGrid[y+1][x-1] === 0 && this.staticGrid[y+1][x+1] === 0 && this.staticGrid[y+2][x+1] === 0) {
                gridRotateCheck[y+1][x-1] = 4;
                gridRotateCheck[y+1][x+1] = 4;
                gridRotateCheck[y+2][x+1] = 4;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y][x+1] = 0;
                gridRotateCheck[y+2][x] = 0;
                this.state = 1;
              }
            }
            this.droppingGrid = gridRotateCheck;
            this.ghostGrid = this.droppingGrid;
            return;
          }
        }
      }
    }

    //rotates L-this.Block
    if(this.block === 5) {
      for(let y = 0; y < this.gridHeight; y++) {
        for(let x = 0; x < this.gridWidth; x++) {
          if(gridRotateCheck[y][x] === 5) {
            if(this.state === 1) {
              if(y < this.gridHeight - 1 && y > 0 && x < this.gridWidth - 1 && this.staticGrid[y-1][x] === 0 && this.staticGrid[y-1][x+1] === 0 && this.staticGrid[y+1][x+1] === 0) {
                gridRotateCheck[y-1][x] = 5;
                gridRotateCheck[y-1][x+1] = 5;
                gridRotateCheck[y+1][x+1] = 5;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+1][x] = 0;
                gridRotateCheck[y][x+2] = 0;
                this.state = 2;
              }
            }
            else if(this.state === 2) {
              if(y < this.gridHeight - 1 && x < this.gridWidth - 2 && this.staticGrid[y+1][x] === 0 && this.staticGrid[y][x+2] === 0 && this.staticGrid[y+1][x+2] === 0) {
                gridRotateCheck[y+1][x] = 5;
                gridRotateCheck[y][x+2] = 5;
                gridRotateCheck[y+1][x+2] = 5;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y][x+1] = 0;
                gridRotateCheck[y+2][x+1] = 0;
                this.state = 3;
              }
            }
            else if(this.state === 3) {
              if(y < this.gridHeight - 2 && x > 0 && this.staticGrid[y][x-1] === 0 && this.staticGrid[y+2][x] === 0 && this.staticGrid[y+2][x-1] === 0) {
                gridRotateCheck[y][x-1] = 5;
                gridRotateCheck[y+2][x] = 5;
                gridRotateCheck[y+2][x-1] = 5;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+1][x] = 0;
                gridRotateCheck[y+1][x-2] = 0;
                this.state = 4;
              }
            }
            else if(this.state === 4) {
              if(y < this.gridHeight - 2 && x > 0 && x < this.gridWidth - 1 && this.staticGrid[y+1][x+1] === 0 && this.staticGrid[y+1][x-1] === 0 && this.staticGrid[y+2][x-1] === 0) {
                gridRotateCheck[y+1][x+1] = 5;
                gridRotateCheck[y+1][x-1] = 5;
                gridRotateCheck[y+2][x-1] = 5;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+2][x] = 0;
                gridRotateCheck[y+2][x+1] = 0;
                this.state = 1;
              }
            }
            this.droppingGrid = gridRotateCheck;
            this.ghostGrid = this.droppingGrid;
            return;
          }
        }
      }
    }

    //rotates S-this.Block
    if(this.block === 6) {
      for(let y = 0; y < this.gridHeight; y++) {
        for(let x = 0; x < this.gridWidth; x++) {
          if(gridRotateCheck[y][x] === 6) {
            if(this.state === 1) {
              if(y < this.gridHeight - 2 && x < this.gridWidth - 1 && this.staticGrid[y+1][x+1] === 0 && this.staticGrid[y+2][x+1] === 0) {
                gridRotateCheck[y+1][x+1] = 6;
                gridRotateCheck[y+2][x+1] = 6;

                gridRotateCheck[y][x+1] = 0;
                gridRotateCheck[y+1][x-1] = 0;
                this.state = 2;
              }
            }
            else if(this.state === 2) {
              if(y < this.gridHeight - 2 && x > 0 && this.staticGrid[y+2][x] === 0 && this.staticGrid[y+2][x-1] === 0) {
                gridRotateCheck[y+2][x] = 6;
                gridRotateCheck[y+2][x-1] = 6;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+2][x+1] = 0;
                this.state = 3;
              }
            }
            else if(this.state === 3) {
              if(y > 0 && x > 0 && this.staticGrid[y-1][x-1] === 0 && this.staticGrid[y][x-1] === 0) {
                gridRotateCheck[y-1][x-1] = 6;
                gridRotateCheck[y][x-1] = 6;

                gridRotateCheck[y+1][x-1] = 0;
                gridRotateCheck[y][x+1] = 0;
                this.state = 4;
              }
            }
            else if(this.state === 4) {
              if(x < this.gridWidth - 2 && this.staticGrid[y][x+1] === 0 && this.staticGrid[y][x+2] === 0) {
                gridRotateCheck[y][x+1] = 6;
                gridRotateCheck[y][x+2] = 6;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+2][x+1] = 0;
                this.state = 1;
              }
            }
            this.droppingGrid = gridRotateCheck;
            this.ghostGrid = this.droppingGrid;
            return;
          }
        }
      }
    }

    //rotates Z-this.Block
    if(this.block === 7) {
      for(let y = 0; y < this.gridHeight; y++) {
        for(let x = 0; x < this.gridWidth; x++) {
          if(gridRotateCheck[y][x] === 7) {
            if(this.state === 1) {
              if(y < this.gridHeight - 2 && x < this.gridWidth - 2 && this.staticGrid[y][x+2] === 0 && this.staticGrid[y+2][x+1] === 0) {
                gridRotateCheck[y][x+2] = 7;
                gridRotateCheck[y+2][x+1] = 7;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y][x+1] = 0;
                this.state = 2;
              }
            }
            else if(this.state === 2) {
              if(y < this.gridHeight - 2 && x < this.gridWidth - 2 && this.staticGrid[y+1][x-2] === 0 && this.staticGrid[y+2][x] === 0) {
                gridRotateCheck[y+1][x-2] = 7;
                gridRotateCheck[y+2][x] = 7;

                gridRotateCheck[y][x] = 0;
                gridRotateCheck[y+1][x] = 0;
                this.state = 3;
              }
            }
            else if(this.state === 3) {
              if(y < this.gridHeight - 1 && y > 0 && x < this.gridWidth - 1 && this.staticGrid[y-1][x+1] === 0 && this.staticGrid[y+1][x] === 0) {
                gridRotateCheck[y-1][x+1] = 7;
                gridRotateCheck[y+1][x] = 7;

                gridRotateCheck[y+1][x+2] = 0;
                gridRotateCheck[y+1][x+1] = 0;
                this.state = 4;
              }
            }
            else if(this.state === 4) {
              if(y < this.gridHeight - 1 && x < this.gridWidth - 1 && x > 0 && this.staticGrid[y][x-1] === 0 && this.staticGrid[y+1][x+1] === 0) {
                gridRotateCheck[y][x-1] = 7;
                gridRotateCheck[y+1][x+1] = 7;

                gridRotateCheck[y+1][x-1] = 0;
                gridRotateCheck[y+2][x-1] = 0;
                this.state = 1;
              }
            }
            this.droppingGrid = gridRotateCheck;
            this.ghostGrid = this.droppingGrid;
            return;
          }
        }
      }
    }
  }

  loseCheck() { //checks if the game is lost
    for(let x = 0; x < this.gridWidth; x++) {
      if(this.staticGrid[1][x] !== 0) {
        this.lose = true;
      }
    }
  }
}