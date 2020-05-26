import Phaser from "phaser";
import io from "socket.io-client";
import map from "../assets/maps/map.json";
import tiles from "../assets/maps/tiles_extruded.png";
import playerImage from "../assets/player.png";
import otherPlayerImage from "../assets/otherPlayer.png";

// initialize socket

class playGame extends Phaser.Scene {

  constructor() {
    super("PlayGame");
  }


  // preload assets
  preload() {

    // load tilemap data
    this.load.tilemapTiledJSON("map", map);
    this.load.image("tiles", tiles);

    // load player
    this.load.image("player", playerImage);
    this.load.image("otherPlayer", otherPlayerImage);

  }

  addOtherPlayers(playerInfo) {
    
    // create new sprite for other player
    let otherPlayer = this.add.sprite(0, 0, "otherPlayer");

    // set tint to look different
    otherPlayer.setTint("#999");

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

    this.socket = io.connect("34.86.29.163:8081", {secure: true});

    // create a group for all other players
    this.otherPlayers = this.add.group();
    this.x = 0;
    this.y = 0;

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

    // load tilemap data
    this.gameMap = this.add.tilemap("map");
    let gameTiles = this.gameMap.addTilesetImage("tiles", "tiles", 32, 32, 1, 2);
    let topLayer = this.gameMap.createStaticLayer("top", [gameTiles], 0, 0);

    // generate a random spawning point and do math to center on a tile

    this.playerContainer = this.add.container(32,32);

    // add the player
    this.player = this.add.sprite(this.x, this.y, "player");

    this.playerName = this.add.text(0,0, "Player1", {fill: "#000"});
    this.playerName.font = "Arial";
    this.playerName.setOrigin(0, 0);
    // this.playerName.setStroke("#000", 5);


    // this.playerContainer.add(this.playerName);
    // this.playerContainer.add(this.player);

    // tell camera to follow player
    this.cameras.main.startFollow(this.player);

    // add keyboard listeners
    this.keyboard = this.input.keyboard.addKeys("W, A, S, D");

    // movement cooldown data
    this.COOLDOWNMAX = 7;
    this.coolDown = this.COOLDOWNMAX;
  }

  // update the players x and y coordinates
  updatePlayer(coordinates) {

    // check cooldown and update position
    if (this.coolDown <= 0 && !this.checkCollision(coordinates)) {
      this.x = coordinates.x;
      this.y = coordinates.y;
      this.coolDown = this.COOLDOWNMAX;

      // send new position to server
      this.socket.emit("playerMovement", coordinates);
    }

  }

  // check if the tile is collidable
  checkCollision(coordinates) {

    // get the x and y of the tile 
    let playerX = this.gameMap.worldToTileX(coordinates.x * 32);
    let playerY = this.gameMap.worldToTileY(coordinates.y * 32);

    // get the tile
    let tile = this.gameMap.getTileAt(playerX, playerY);

    // check collides property
    return (tile.properties.collides === true);

  }

  update() {

    // check keyboard presses
    if (this.keyboard.W.isDown)
      this.updatePlayer({x: this.x, y: this.y - 1}); 
    if (this.keyboard.A.isDown)
      this.updatePlayer({x: this.x - 1, y: this.y}); 
    if (this.keyboard.S.isDown)
      this.updatePlayer({x: this.x, y: this.y + 1}); 
    if (this.keyboard.D.isDown)
      this.updatePlayer({x: this.x + 1, y: this.y}); 

    // update player position
    // this.player.setX(this.x * 32 + 16);
    // this.player.setY(this.y * 32 + 16);

    this.tweens.add({
      targets: this.player,
      props: {
        x: {value: this.x * 32 + 16, duration: 50, ease: "Linear"},
        y: {value: this.y * 32 + 16, duration: 50, ease: "Linear"}
      }
    });

    // update cooldown
    if (this.coolDown > 0)
      this.coolDown--;
  }
}

export default playGame;
