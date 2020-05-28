import Phaser from "phaser";
import io from "socket.io-client";
// import map from "../assets/maps/map.json";
import tiles from "../assets/maps/tiles_extruded.png";
import playerImage from "../assets/player.png";

// initialize socket

class playGame extends Phaser.Scene {

  constructor() {
    super("PlayGame");
  }


  // preload assets
  preload() {

    // load tilemap data
    // this.load.tilemapTiledJSON("map", map);
    this.load.image("tiles", tiles);

    // load player
    this.load.image("player", playerImage);

  }

  addOtherPlayers(playerInfo) {
    
    // create new sprite for other player
    let otherPlayer = this.add.sprite(0, 0, "player");

    // set tint to look different
    otherPlayer.setTint("0x" + playerInfo.color);

    // assign playerID 
    otherPlayer.playerId = playerInfo.playerId;

    // move new player to position
    this.tweens.add({
      targets: otherPlayer,
      props: {
        x: {value: playerInfo.x * 32 + 16, duration: 70, ease: "Linear"},
        y: {value: playerInfo.y * 32 + 16, duration: 70, ease: "Linear"}
      }
    });

    // add to group 
    this.otherPlayers.add(otherPlayer); 

  }
  

  // create assets
  create() {

    // this.socket = io.connect("34.86.29.163:8081", {secure: true});
    this.socket = io.connect(":8081");

    this.ready = false;

    // create a group for all other players
    this.otherPlayers = this.add.group();

    // set x & y for testing purposes
    this.x = Math.floor((Math.random() * (18 - 1) + 1));
    this.y = Math.floor((Math.random() * (18 - 1) + 1));

    // listen for list of all players
    this.socket.on("currentPlayers", (players) => {
      Object.keys(players).forEach((id) => {

        // set player coords to coords set by server
        if (this.socket.id === players[id].playerId) {
          this.x = players[id].x;
          this.y = players[id].y;

          // update player location
          this.tweens.add({
            targets: this.player,
            props: {
              x: {value: this.x * 32 + 16, duration: 70, ease: "Linear"},
              y: {value: this.y * 32 + 16, duration: 70, ease: "Linear"}
            }
          });

          // set the player's color
          this.player.setTint("0x" + players[id].color);

          // set colorId for tile replacement
          this.tileId = players[id].tileId;

          return;
        }

        this.addOtherPlayers(players[id]); 

      });
    });


    // listen for other player disconnects
    this.socket.on("disconnect", (playerId) => {
      this.otherPlayers.getChildren().forEach((otherPlayer) => {
        
        // remove disconnected player from group
        if (playerId == otherPlayer.playerId)
          otherPlayer.destroy();

      })
    })

    // listen for new players
    this.socket.on("newPlayer", (playerInfo) => {
      this.addOtherPlayers(playerInfo);
    });

    // listen for map updates and replace tiles
    this.socket.on("updateMap", (newMap) => {
      
      // update local version of map
      this.serverMap = newMap;

      // make sure player is moved before tile is colored
      // it looks better
      setTimeout(() => {
        this.gameMap.putTilesAt(newMap, 0, 0);
      }, 25);

    })

    // listen for other player movement
    this.socket.on("playerMoved", (playerInfo) => {
      this.otherPlayers.getChildren().forEach((otherPlayer) => {
        if (playerInfo.playerId == otherPlayer.playerId){
          // tween the moving player's movement
          this.tweens.add({
            targets: otherPlayer,
            props: {
              x: {value: playerInfo.x * 32 + 16, duration: 70, ease: "Linear"},
              y: {value: playerInfo.y * 32 + 16, duration: 70, ease: "Linear"}
            }
          });
        }
      })
    });

    

    // this.playerName = this.add.text(0,0, "Player1", {fill: "#000"});
    // this.playerName.font = "Arial";
    // this.playerName.setOrigin(0, 0);
    // this.playerName.setStroke("#000", 5);

    // create a blank map
    this.gameMap = this.make.tilemap({ tileWidth: 32, tileHeight: 32, width: 30, height: 30});

    // get tiles
    let gameTiles = this.gameMap.addTilesetImage("tiles", "tiles", 32, 32, 1, 2);

    // create blank layer for replacement
    this.gameMap.createBlankDynamicLayer("top", gameTiles);

    // add the player
    this.player = this.add.sprite(this.x, this.y, "player");

    

    // tell camera to follow player
    this.cameras.main.startFollow(this.player, false, .1, .1);

    // add keyboard listeners (need to improve this)
    this.keyboard = this.input.keyboard.addKeys("W, A, S, D");
    this.cursor = this.input.keyboard.createCursorKeys();

    // movement cooldown data
    this.COOLDOWNMAX = 5;
    this.coolDown = this.COOLDOWNMAX;
  }

  
  // update the players x and y coordinates
  updatePlayer(coordinates) {

    // check cooldown and update position
    if (this.coolDown <= 0 && !this.checkCollision(coordinates)) {

      // store old coordinates
      let oldX = this.x
      let oldY = this.y

      // send new position to server
      this.x = coordinates.x;
      this.y = coordinates.y;

      this.tweens.add({
        targets: this.player,
        props: {
          x: {value: this.x * 32 + 16, duration: 70, ease: "Linear"},
          y: {value: this.y * 32 + 16, duration: 70, ease: "Linear"}
        }
      });

      this.coolDown = this.COOLDOWNMAX;
      this.socket.emit("playerMovement", {old: {x: oldX, y: oldY}, new: coordinates, tileId: this.tileId});

      // update clientside
      setTimeout(() => {
        this.gameMap.putTileAt(this.tileId, oldX, oldY);
      }, 25);

    }

  }

  // check if the tile is collidable
  checkCollision(coordinates) {
    // get the x and y of the tile 
    // let playerX = this.gameMap.worldToTileX(coordinates.x * 32);
    // let playerY = this.gameMap.worldToTileY(coordinates.y * 32);


    // get the tile
    // let t = this.gameMap.getTileAt(playerX, playerY);
    let tile = this.serverMap[coordinates.y][coordinates.x];

    // t.setTint(0x000000);



    // check collides property
    return (tile === 1);

  }

  update() {

    // check keyboard presses
    if (this.keyboard.W.isDown || this.cursor.up.isDown)
      this.updatePlayer({x: this.x, y: this.y - 1}); 
    if (this.keyboard.A.isDown || this.cursor.left.isDown)
      this.updatePlayer({x: this.x - 1, y: this.y}); 
    if (this.keyboard.S.isDown || this.cursor.down.isDown)
      this.updatePlayer({x: this.x, y: this.y + 1}); 
    if (this.keyboard.D.isDown || this.cursor.right.isDown)
      this.updatePlayer({x: this.x + 1, y: this.y}); 

    // update player position
    // this.player.setX(this.x * 32 + 16);
    // this.player.setY(this.y * 32 + 16);

    

    // update cooldown
    if (this.coolDown > 0)
      this.coolDown--;
  }
}

export default playGame;
