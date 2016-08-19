/* 
 * Copyright 2016 Joseph Jimenez
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
		ship: new Image(),
		redShip: new Image()
	};
	
	// Used for delta time
	let startTime;
	
	// Various objects in the game
	let players = {};
	let shots = [];
	let particles = [];
	
	// Local player object
	let localPlayer = {
		name: "",
		x: 0,
		y: 0,
		angle: 270,
		heat: 0,
		left: false,
		right: false,
		up: false,
		shoot: false,
		hit: false,
		overheated: false
	};
	
	// Initialize game
	window.onload = function() {
		document.getElementById("play").onclick = init;
	};
	
	// Starts game once user types in their name
	function init() {
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
	
	// Shows a game over box
	function gameOver() {
		let middle = document.getElementById("middle");
		let box = document.createElement("div");
		let head = document.createElement("h1");
		let ok = document.createElement("button");
		middle.innerHTML = "";
		head.innerHTML = "Game Over";
		ok.innerHTML = "OK";
		ok.onclick = function() {
			location.reload();
		};
		box.appendChild(head);
		box.appendChild(ok);
		box.id = "gameover";
		middle.appendChild(box);
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
		for (let i = 0; i < particles.length; i++) {
			ctx.fillRect(particles[i].x, particles[i].y, 4, 4);
		}
		ctx.fillStyle = "#FF0000";
		if (!localPlayer.hit) {
			drawRotatedImage(imageCache.ship, localPlayer.x, localPlayer.y, localPlayer.angle);
			ctx.font = "12px sans-serif";
			ctx.fillText(localPlayer.name, localPlayer.x, localPlayer.y - 20);
		}
		if (!localPlayer.overheated) {
			ctx.fillStyle = "#000000";
			ctx.strokeStyle = "#000000";
		} else {
			ctx.fillStyle = "#FF0000";
			ctx.strokeStyle = "#FF0000";
		}
		let barX = canvas.width / 2 - 100;
		let barY = 5;
		ctx.rect(barX, barY, 200, 20);
		ctx.stroke();
		ctx.fillRect(barX, barY, localPlayer.heat * 2, 20);
		requestAnimationFrame(render);
	}
	
	// Updates the physics of the game
	function update() {
		// Timing stuff
		let currentTime = new Date().getTime();
		let dt = currentTime - startTime;
		let fps = 1000 / dt;
		let ratio = fps / 45;
		let timeScaleFactor = 1 / ratio;
		startTime = currentTime;
		
		// Update the local player
		let changed = false;
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
		if (localPlayer.shoot) {
			shotFired(); 
		}
		if (changed) {
			socket.emit("updatePlayer", {
				x: localPlayer.x,
				y: localPlayer.y,
				angle: localPlayer.angle
			});
		}
		if (localPlayer.hasOwnProperty("hitTimer")) {
			if (localPlayer.hitTimer === 0) {
				gameOver();
			}
			localPlayer.hitTimer--;
		}
		if (localPlayer.heat > 100) {
			localPlayer.overheated = true;
		}
		if (localPlayer.heat > 0) {
			localPlayer.heat -= 3;
		} else {
			localPlayer.heat = 0;
			localPlayer.overheated = false;
		}
		
		// Update shots
		for (let i = 0; i < shots.length; i++) {
			shots[i].x += Math.cos(shots[i].dir * Math.PI / 180) * 12 * timeScaleFactor;
			shots[i].y += Math.sin(shots[i].dir * Math.PI / 180) * 12 * timeScaleFactor;
			if (distance(localPlayer.x, localPlayer.y, shots[i].x, shots[i].y) < 14 && !localPlayer.hit) {
				localPlayer.hit = true;
				localPlayer.hitTimer = 40;
				shipHit(localPlayer.x, localPlayer.y);
				socket.emit("shipHit");
			}
			if (shots[i].x < 0 || shots[i].x > canvas.width || shots[i].y < 0 || shots[i].y > canvas.height) {
				shots.splice(i, 1);
				i--;
			}
		}
		
		// Update particles
		for (let i = 0; i < particles.length; i++) {
			if (particles[i].timer <= 0) {
				particles.splice(i, 1);
				i--;
			} else {
				particles[i].x += Math.cos(particles[i].dir * Math.PI / 180) * particles[i].speed * timeScaleFactor;
				particles[i].y += Math.sin(particles[i].dir * Math.PI / 180) * particles[i].speed * timeScaleFactor;
				particles[i].timer--;
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
	
	// Handles other ships getting hit
	socket.on("shipHit", function(id) {	
		if (players.hasOwnProperty(id)) {
			shipHit(players[id].x, players[id].y);
			delete players[id];
		}
	});
	
	// Sets up WASD control scheme
	function initializeControls() {
		document.addEventListener("keydown", function(event) {
			switch (event.keyCode) {
				case 87: localPlayer.up = true; break;
				case 65: localPlayer.left = true; break;
				case 68: localPlayer.right = true; break;
				case 32: localPlayer.shoot = true; break;
				default: break;
			}
		});	
		document.addEventListener("keyup", function(event) {
			switch (event.keyCode) {
				case 87: localPlayer.up = false; break;
				case 65: localPlayer.left = false; break;
				case 68: localPlayer.right = false; break;
				case 32: localPlayer.shoot = false; break;
				default: break;
			}
		});
	}
	
	// Ship explodes into many particles
	function shipHit(startX, startY) {
		let numParticles = 20;
		let timeUntilGone = 17;
		for (let i = 0; i < numParticles; i++) {
			particles.push({
				x: startX,
				y: startY,
				speed: Math.floor(Math.random() * 3) + 3,
				dir: Math.floor(Math.random() * 360),
				timer: timeUntilGone + Math.floor(Math.random() * 7)
			});
		}
	}
	
	// Lets all clients and the server know a shot was fired
	function shotFired() {
		if (!localPlayer.overheated) {
			let rad = localPlayer.angle * Math.PI / 180;
			localPlayer.heat += 10;
			shots.push({
				x: (localPlayer.x + Math.cos(rad) * 16) - 2,
				y: localPlayer.y + Math.sin(rad) * 16,
				dir: localPlayer.angle
			});
			socket.emit("shotFired");
		}
	}
	
	// Draws rotated images centered at the x and y coordinate
	function drawRotatedImage(image, x, y, angle) {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle * Math.PI / 180);
		ctx.drawImage(image, -16, -16);
		ctx.restore();
	}
	
	// Calulates euclidean distance between two points
	function distance(x1, y1, x2, y2) {
		return Math.sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2)));
	}
})();