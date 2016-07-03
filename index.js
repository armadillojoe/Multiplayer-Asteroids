/* Copyright 2016 Joseph Jimenez
 * Server side code for simple 2d network 
 * enabled game.
 */
 
(function() {
	"use strict";
	
	// Import all needed modules
	let express = require('express');
	let app = express();
	let http = require("http").Server(app);
	let io = require("socket.io")(http);
	
	// Constants
	const PORT = 7777;
	const HEIGHT = 600;
	const WIDTH = 800;
	
	// Stores all players currently connected
	let players = {};
	
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
		let newPlayer = {
			id: socket.id,
			name: "",
			x: Math.floor(Math.random() * WIDTH),
			y: Math.floor(Math.random() * HEIGHT),
			angle: 270
		};

		players[newPlayer.id] = {
			name: "",
			x: newPlayer.x,
			y: newPlayer.y,
			angle: newPlayer.angle
		};
		console.log("New user connected! Total Users: %d", Object.keys(players).length);
		
		// Send all other players to the new player
		socket.on("requestPlayers", function(name) {
			let toSend = {
				id: socket.id,
				players: players,
				canvas: {height: HEIGHT, width: WIDTH}
			};
			// Send the new player to all other players
			players[newPlayer.id].name = name;
			newPlayer.name = name;
			socket.broadcast.emit("newPlayer", newPlayer);
			io.to(socket.id).emit("requestPlayers", toSend);
		});
		
		// Update players position coordinates
		socket.on("updatePlayer", function(position) {
			if (players.hasOwnProperty(socket.id)) {
				players[socket.id].x = position.x;
				players[socket.id].y = position.y;
				players[socket.id].angle = position.angle;
				socket.broadcast.emit("updatePlayer", {
					id: socket.id,
					x: position.x,
					y: position.y,
					angle: position.angle
				});
			}
		});
		
		// Handles shots being fired
		socket.on("shotFired", function() {
			socket.broadcast.emit("shotFired", {
				x: players[socket.id].x,
				y: players[socket.id].y,
				dir: players[socket.id].angle
			});
		});
		
		// Handle disconnections
		socket.on("disconnect", function() {
			socket.broadcast.emit("removePlayer", socket.id);
			if (players.hasOwnProperty(socket.id)) {
				delete players[socket.id];
				console.log("A user has disconnected! Total Users: %d", Object.keys(players).length);
			}
		});
	});
})();