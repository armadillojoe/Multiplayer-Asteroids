(function() { 
	// Connect to server
	var socket = io();
	
	// Canvas used to draw game on
	var canvas;
	
	// Players currently connected
	var players = [];
	
	// Initialize game
	window.onload = function() {
		canvas = document.createElement("canvas");
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
	
	// Request all the players when you first join
	function requestPlayers() {
		socket.emit("requestPlayers", {});
	}
})();