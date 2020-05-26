const express = require("express");
const app = express();
const server = require("https").Server(app);
const io = require("socket.io").listen(server);
const PORT = 8081;

// object with player data
let players:any = {};

// allow all origins
io.set('origins', '*:*');
// listen for a new connection
io.on("connection", (socket : any) => {


    console.log("new connection");

    // choose random X and Y position for player
    let newX =  Math.floor((Math.random() * (18 - 1) + 1));
    let newY =  Math.floor((Math.random() * (18 - 1) + 1));

    // add new player data to list
    players[socket.id] = {
        x: newX,
        y: newY,
        playerId: socket.id
    }

    // send new player all current players
    socket.emit("currentPlayers", players);

    // tell all clients that there is a new player 
    socket.broadcast.emit("newPlayer", players[socket.id]);

    // listen for when user leaves
    socket.on("disconnect", () => {

        // remove player from player object
        delete players[socket.id];

        // emit a message to all players to remove this player
        io.emit("disconnect", socket.id);

        console.log("user disconnected")
    });

    // listen for player movement
    socket.on("playerMovement", (coordinates: any) => {

        // update coordinates
        players[socket.id].x = coordinates.x;
        players[socket.id].y = coordinates.y;

        // emit message to everyone that someone moved
        socket.broadcast.emit("playerMoved", players[socket.id]);

    })

})

// start server
server.listen(PORT, () => {
    console.log("Listening on port: " + server.address().port);
});