/* Copyright 2016 Joseph Jimenez
 * Client side code for simple 2d network 
 * enabled game.
 */

(function() { 
	// Connect to server
	var socket = io();
	
	// Canvas used to draw game on
	var canvas;
	var ctx;
	
	// Used for delta time
	var startTime;
	
	// Players currently connected
	var players = [];
	
	// Local player object
	var localPlayer = {
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
		for (var i = 0; i < players.length; i++) {
			ctx.fillRect(players[i].x, players[i].y, 5, 5);
		}
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(localPlayer.x, localPlayer.y, 5, 5);
		requestAnimationFrame(render);
	}
	
	// Updates the position of the local player from key presses
	function updatePlayer() {
		var changed = false;
		var currentTime = new Date().getTime();
		var dt = currentTime - startTime;
		var fps = 1000 / dt;
		document.querySelector("h1").innerHTML = "FPS: " + fps.toFixed(2);
		var ratio = fps / 45;
		var timeScaleFactor = 1 / ratio;
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
		players = [];
		for (var i = 0; i < data.players.length; i++) {
			if (data.id != data.players[i].id) {
				players.push(data.players[i]);
			} else {
				localPlayer.x = data.players[i].x;
				localPlayer.y = data.players[i].y;
			}
		}
		
		canvas.height = data.canvas.height;
		canvas.width = data.canvas.width;
	});
	
	// Updates location of other players
	socket.on("updatePlayer", function(data) {
		for (var i = 0; i < players.length; i++) {
			if (players[i].id == data.id) {
				players[i].x = data.x;
				players[i].y = data.y;
				break;
			}
		}
	});
	
	// Removes player from the game
	socket.on("removePlayer", function(id) {
		for (var i = 0; i < players.length; i++) {
			if (players[i].id == id) {
				players.splice(i, 1);
				console.log(players.length);
				return;
			}
		}
	});
	
	// Adds a new player to the game
	socket.on("newPlayer", function(player) {
		players.push(player);
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