// Server side
(function() {
	// Import all needed modules
	var express = require('express');
	var app = express();
	var http = require("http").Server(app);
	var io = require("socket.io")(http);
	
	// Constants
	var PORT = 7777;
	var HEIGHT = 400;
	var WIDTH = 800;
	
	// Stores all players currently connected
	var players = [];
	
	// Listen on the specified port
	http.listen(PORT, function() {
		console.log("Listening on port %d!", PORT);
	});
	
	// Allow serving static files
	app.use(express.static(__dirname + "/public"));
	
	// Serve up the root path index.html
	app.get("/", function(req, res) {
		res.sendFile(__dirname + "/public/index.html");
	});
	
	// Handle client connections
	io.on("connection", function(socket) {
		var newPlayer = {
			id: socket.id,
			x: Math.floor(Math.random() * WIDTH),
			y: Math.floor(Math.random() * HEIGHT)
		};
		players.push(newPlayer);
		console.log("New user connected! Total Users: %d", players.length);
		
		// Send the new player to all other players
		socket.broadcast.emit("newPlayer", newPlayer);
		
		// Send all other players to the new player
		socket.on("requestPlayers", function(data) {
			var toSend = {
				id: socket.id,
				players: [],
				canvas: {height: HEIGHT, width: WIDTH}
			};
			
			for (var i = 0; i < players.length; i++) {
				toSend.players.push(players[i]);
			}
			
			io.to(socket.id).emit("requestPlayers", toSend);
		});
		
		socket.on("updatePlayer", function(position) {
			for (var i = 0; i < players.length; i++) {
				if (players[i].id = socket.id) {
					players[i].x = position.x;
					players[i].y = position.y;
					socket.broadcast.emit("updatePlayer", players[i]);
					break;
				}
			}
		});
		
		// Handle disconnections
		socket.on("disconnect", function() {
			socket.broadcast.emit("removePlayer", socket.id);
			for (var i = 0; i < players.length; i++) {
				if (players[i].id == socket.id) {
					players.splice(i, 1);
					console.log("A user has disconnected! Total Users: %d", players.length);
					break;
				}
			}
		});
	});
})();