const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const PORT = 8081;
const cors = require('cors');

// object with player data
let players:any = {};
let map = [
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
app.get("/", (req:any, res:any) => {
    res.sendFile(__dirname + "/public/index.html");
})

// app.use(cors({origin: '*'}));

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
    socket.emit("updateMap", map);

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
        players[socket.id].x = coordinates.new.x;
        players[socket.id].y = coordinates.new.y;


        // update map array
        map[coordinates.old.y][coordinates.old.x] = 2;
        
        // emit message to everyone that someone moved
        socket.broadcast.emit("playerMoved", players[socket.id]);

        // emit message to everyone that map should be updated
        io.emit("updateMap", map);

    })

})

// start server
server.listen(PORT, () => {
    console.log("Listening on port: " + server.address().port);
});