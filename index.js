(function() {
	// Import all needed modules
	var express = require('express');
	var app = express();
	var http = require("http").Server(app);
	var io = require("socket.io")(http);
	var ArrayList = require("./js/ArrayList.js").ArrayList;
	
	// Constants
	var PORT = 7777;
	var HEIGHT = 800;
	var WIDTH = 800;
	
	// Stores all players currently connected
	var players = new ArrayList();
	
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
		console.log("New user connected: " + socket.id);
		var newPlayer = {
			id: socket.id,
			x: Math.floor(Math.random() * WIDTH),
			y: Math.floor(Math.random() * HEIGHT)
		};
		players.add(newPlayer);
		
		// Send all other players to the new player
		socket.on("requestPlayers", function(data) {
			var toSend = {
				id: socket.id,
				players: [],
				canvas: {height: HEIGHT, width: WIDTH}
			};
			
			for (var i = 0; i < players.size(); i++) {
				toSend.players.push(players.get(i));
			}
			
			io.to(socket.id).emit("requestPlayers", toSend);
		});
		
		// Handle disconnections
		socket.on("disconnect", function() {
			console.log("A user has disconnected!");
		});
	});
})();