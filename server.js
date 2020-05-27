var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io").listen(server);
var PORT = 8081;
var cors = require('cors');
// object with player data
var players = {};
var map = [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2],
    [2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2],
    [2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2],
    [2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
];
// allow all origins
// io.set('origins', '*:*');
app.use(express.static(__dirname + '/public/dist'));
// serve index page on visit
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/index.html");
});
// app.use(cors({origin: '*'}));
// listen for a new connection
io.on("connection", function (socket) {
    console.log("new connection");
    // choose random X and Y position for player
    var newX = Math.floor((Math.random() * (18 - 1) + 1));
    var newY = Math.floor((Math.random() * (18 - 1) + 1));
    // add new player data to list
    players[socket.id] = {
        x: newX,
        y: newY,
        playerId: socket.id
    };
    // send new player all current players
    socket.emit("currentPlayers", players);
    socket.emit("updateMap", map);
    // tell all clients that there is a new player 
    socket.broadcast.emit("newPlayer", players[socket.id]);
    // listen for when user leaves
    socket.on("disconnect", function () {
        // remove player from player object
        delete players[socket.id];
        // emit a message to all players to remove this player
        io.emit("disconnect", socket.id);
        console.log("user disconnected");
    });
    // listen for player movement
    socket.on("playerMovement", function (coordinates) {
        // update coordinates
        players[socket.id].x = coordinates["new"].x;
        players[socket.id].y = coordinates["new"].y;
        // update map array
        map[coordinates.old.y][coordinates.old.x] = 2;
        // emit message to everyone that someone moved
        socket.broadcast.emit("playerMoved", players[socket.id]);
        // emit message to everyone that map should be updated
        io.emit("updateMap", map);
    });
});
// start server
server.listen(PORT, function () {
    console.log("Listening on port: " + server.address().port);
});
