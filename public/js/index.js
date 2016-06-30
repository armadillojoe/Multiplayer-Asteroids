/* Copyright 2016 Joseph Jimenez
 * Client side code for simple 2d network 
 * enabled game.
 */

(function() {
	"use strict";
	
	// Connect to server
	let socket = io();
	
	// Canvas used to draw game on
	let canvas;
	let ctx;
	
	// Used for delta time
	let startTime;
	
	// Players currently connected
	let players = {};
	
	// Local player object
	let localPlayer = {
		x: 0,
		y: 0,
		left: false,
		right: false,
		up: false,
		down: false
	};
	
	// Initialize game
	window.onload = function() {
		canvas = document.createElement("canvas");
		ctx = canvas.getContext("2d");
		document.querySelector("body").appendChild(canvas);
		startTime = new Date().getTime();
		socket.emit("requestPlayers", {});
		initializeControls();
		render();
	};
	
	// Loop that renders the canvas to the screen
	function render() {
		updatePlayer();
		ctx.fillStyle = "#4C9ADE";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#000000";
		for (let id in players) {
			ctx.fillRect(players[id].x, players[id].y, 5, 5);
		}
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(localPlayer.x, localPlayer.y, 5, 5);
		requestAnimationFrame(render);
	}
	
	// Updates the position of the local player from key presses
	function updatePlayer() {
		let changed = false;
		let currentTime = new Date().getTime();
		let dt = currentTime - startTime;
		let fps = 1000 / dt;
		document.querySelector("h1").innerHTML = "FPS: " + fps.toFixed(2);
		let ratio = fps / 45;
		let timeScaleFactor = 1 / ratio;
		startTime = currentTime;
		if (localPlayer.left) {
			localPlayer.x -= 7 * timeScaleFactor;
			changed = true;
		}
		if (localPlayer.right) {
			localPlayer.x += 7 * timeScaleFactor;
			changed = true;
		}
		if (localPlayer.up) {
			localPlayer.y -= 7 * timeScaleFactor;
			changed = true;
		}
		if (localPlayer.down) {
			localPlayer.y += 7 * timeScaleFactor;
			changed = true;
		}
		if (changed) {
			socket.emit("updatePlayer", {x: localPlayer.x, y: localPlayer.y});
		}
	}
	
	// Adds players in the game to local players array
	socket.on("requestPlayers", function(data) {
		players = {};
		for (let id in data.players) {
			if (data.id != id) {
				players[id] = {x: data.players[id].x, y: data.players[id].y};
			} else {
				localPlayer.x = data.players[id].x;
				localPlayer.y = data.players[id].y;
			}
		}	
		canvas.height = data.canvas.height;
		canvas.width = data.canvas.width;
	});
	
	// Updates location of other players
	socket.on("updatePlayer", function(data) {
		if (players.hasOwnProperty(data.id)) {
			players[data.id].x = data.x;
			players[data.id].y = data.y;
		}
	});
	
	// Removes player from the game
	socket.on("removePlayer", function(id) {
		if (players.hasOwnProperty(id)) {
			delete players[id];
		}
	});
	
	// Adds a new player to the game
	socket.on("newPlayer", function(player) {
		players[player.id] = {x: player.x, y: player.y};
		console.log(player.id);
	});
	
	// Sets up WASD control scheme
	function initializeControls() {
		document.addEventListener("keydown", function(event) {
			switch (event.keyCode) {
				case 87: localPlayer.up = true; break;
				case 83: localPlayer.down = true; break;
				case 65: localPlayer.left = true; break;
				case 68: localPlayer.right = true; break;
				default: break;
			}
		});	
		document.addEventListener("keyup", function(event) {
			switch (event.keyCode) {
				case 87: localPlayer.up = false; break;
				case 83: localPlayer.down = false; break;
				case 65: localPlayer.left = false; break;
				case 68: localPlayer.right = false; break;
				default: break;
			}
		});
	}
})();