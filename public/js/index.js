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
	
	// Stores images to draw easier
	let imageCache = {
		ship: null,
		redShip: null
	};
	
	// Used for delta time
	let startTime;
	
	// Players currently connected
	let players = {};
	
	// Shots on the screen
	let shots = [];
	
	// Local player object
	let localPlayer = {
		name: "",
		x: 0,
		y: 0,
		angle: 270,
		left: false,
		right: false,
		up: false,
		hit: false
	};
	
	// Initialize game
	window.onload = function() {
		document.getElementById("play").onclick = init;
	};
	
	// Starts game once user types in their name
	function init() {
		imageCache.ship = new Image();
		imageCache.redShip = new Image();
		imageCache.ship.src = "../images/ship.png";
		imageCache.redShip.src = "../images/shipRed.png";
		let name = document.getElementById("nameinput").value;
		document.getElementById("middle").innerHTML = "";
		canvas = document.createElement("canvas");
		ctx = canvas.getContext("2d");
		document.getElementById("middle").appendChild(canvas);
		startTime = new Date().getTime();
		localPlayer.name = name;
		socket.emit("requestPlayers", name);
		initializeControls();
		render();
	}
	
	// Loop that renders the canvas to the screen
	function render() {
		update();
		ctx.fillStyle = "#4C9ADE";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#000000";
		for (let id in players) {
			drawRotatedImage(imageCache.ship, players[id].x, players[id].y, players[id].angle);
			ctx.font = "12px sans-serif";
			ctx.fillText(players[id].name, players[id].x - players[id].name.length * 2, players[id].y - 20);
		}
		for (let i = 0; i < shots.length; i++) {
			ctx.fillRect(shots[i].x, shots[i].y, 4, 4);
		}
		ctx.fillStyle = "#FF0000";
		if (localPlayer.hit) {
			drawRotatedImage(imageCache.redShip, localPlayer.x, localPlayer.y, localPlayer.angle);
		} else {
			drawRotatedImage(imageCache.ship, localPlayer.x, localPlayer.y, localPlayer.angle);
		}
		ctx.font = "12px sans-serif";
		ctx.fillText(localPlayer.name, localPlayer.x, localPlayer.y - 20);
		requestAnimationFrame(render);
	}
	
	// Updates the physics of the game
	function update() {
		let changed = false;
		let currentTime = new Date().getTime();
		let dt = currentTime - startTime;
		let fps = 1000 / dt;
		let ratio = fps / 45;
		let timeScaleFactor = 1 / ratio;
		startTime = currentTime;
		if (localPlayer.left) {
			localPlayer.angle = localPlayer.angle - (7 * timeScaleFactor);
			if (localPlayer.angle < 0) {
				localPlayer.angle = 360;
			}
			changed = true;
		}
		if (localPlayer.right) {
			localPlayer.angle = (localPlayer.angle + (7 * timeScaleFactor)) % 360;
			changed = true;
		}
		if (localPlayer.up) {
			let rad = localPlayer.angle * Math.PI / 180;
			localPlayer.x += Math.cos(rad) * 7 * timeScaleFactor;
			localPlayer.y += Math.sin(rad) * 7 * timeScaleFactor;
			changed = true;
		}
		if (localPlayer.down) {
			localPlayer.y += 7 * timeScaleFactor;
			changed = true;
		}
		if (changed) {
			socket.emit("updatePlayer", {
				x: localPlayer.x,
				y: localPlayer.y,
				angle: localPlayer.angle
			});
		}
		
		// Update shots
		for (let i = 0; i < shots.length; i++) {
			shots[i].x += Math.cos(shots[i].dir * Math.PI / 180) * 12 * timeScaleFactor;
			shots[i].y += Math.sin(shots[i].dir * Math.PI / 180) * 12 * timeScaleFactor;
			if (distance(localPlayer.x, localPlayer.y, shots[i].x, shots[i].y) < 14) {
				localPlayer.hit = true;
			}
			if (shots[i].x < 0 || shots[i].x > canvas.width || shots[i].y < 0 || shots[i].y > canvas.height) {
				shots.splice(i, 1);
				i--;
			}
		}
	}
	
	// Adds players in the game to local players array
	socket.on("requestPlayers", function(data) {
		players = {};
		for (let id in data.players) {
			if (data.id != id) {
				players[id] = {
					name: data.players[id].name,
				    x: data.players[id].x,
				    y: data.players[id].y,
				    angle: data.players[id].angle
				};
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
			players[data.id].angle = data.angle;
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
		players[player.id] = {
			name: player.name,
			x: player.x,
			y: player.y,
			angle: player.angle
		};
		console.log(player.id);
	});
	
	// Handles other players shooting
	socket.on("shotFired", function(position) {
		shots.push({
			x: position.x,
			y: position.y,
			dir: position.dir
		});
	});
	
	// Sets up WASD control scheme
	function initializeControls() {
		document.addEventListener("keydown", function(event) {
			switch (event.keyCode) {
				case 87: localPlayer.up = true; break;
				case 65: localPlayer.left = true; break;
				case 68: localPlayer.right = true; break;
				case 32: shotFired(); break;
				default: break;
			}
		});	
		document.addEventListener("keyup", function(event) {
			switch (event.keyCode) {
				case 87: localPlayer.up = false; break;
				case 65: localPlayer.left = false; break;
				case 68: localPlayer.right = false; break;
				default: break;
			}
		});
	}
	
	// Lets all clients and the server know a shot was fired
	function shotFired() {
		let rad = localPlayer.angle * Math.PI / 180;
		shots.push({
			x: (localPlayer.x + Math.cos(rad) * 16) - 2,
			y: localPlayer.y + Math.sin(rad) * 16,
			dir: localPlayer.angle
		});
		socket.emit("shotFired");
	}
	
	// Draws rotated images centered at the x and y coordinate
	function drawRotatedImage(image, x, y, angle) {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle * Math.PI / 180);
		ctx.drawImage(image, -16, -16);
		ctx.restore();
	}
	
	// Calulates distance between two points
	function distance(x1, y1, x2, y2) {
		return Math.sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2)));
	}
})();