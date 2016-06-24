// Client side
(function() { 
	// Connect to server
	var socket = io();
	
	// Canvas used to draw game on
	var canvas;
	var ctx;
	
	// Players currently connected
	var players = [];
	
	// Initialize game
	window.onload = function() {
		canvas = document.createElement("canvas");
		ctx = canvas.getContext("2d");
		document.querySelector("body").appendChild(canvas);
		requestPlayers();
	};
	
	// Adds players in the game to local players array
	socket.on("requestPlayers", function(data) {
		players = [];
		for (var i = 0; i < data.players.length; i++) {
			if (data.id != data.players[i].id) {
				players.push(data.players[i]);
			}
		}
		
		canvas.height = data.canvas.height;
		canvas.width = data.canvas.width;
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
	
	// Request all the players when you first join
	function requestPlayers() {
		socket.emit("requestPlayers", {});
	}
})();