// Client side
(function() { 
	// Connect to server
	var socket = io();
	
	// Canvas used to draw game on
	var canvas;
	var ctx;
	
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
		socket.emit("requestPlayers", {});
		initializeControls();
		render();
	};
	
	function render() {
		updatePlayers();
		ctx.fillStyle = "#4C9ADE";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(localPlayer.x, localPlayer.y, 5, 5);
		ctx.fillStyle = "#000000";
		for (var i = 0; i < players.length; i++) {
			ctx.fillRect(players[i].x, players[i].y, 5, 5);
		}
		requestAnimationFrame(render);
	}
	
	function updatePlayers() {
		var changed = false;
		if (localPlayer.left) {
			localPlayer.x -= 7;
			changed = true;
		}
		if (localPlayer.right) {
			localPlayer.x += 7;
			changed = true;
		}
		if (localPlayer.up) {
			localPlayer.y -= 7;
			changed = true;
		}
		if (localPlayer.down) {
			localPlayer.y += 7;
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
	
	socket.on("updatePlayer", function(data) {
		for (var i = 0; i < players.length; i++) {
			if (players[i].id = data.id) {
				players[i].x = data.x;
				players[i].y = data.y;
				break;
			}
		}
	});
	
	socket.on("removePlayer", function(id) {
		for (var i = 0; i < players.length; i++) {
			if (players[i].id == id) {
				players.splice(i, 1);
				console.log(players.length);
				return;
			}
		}
	});
	
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