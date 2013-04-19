var mgoose = require("mongojs");
var io = require("socket.io").listen(8888);
var sck = 0;
var coll = ["censo"];
var db = require("mongojs").connect("localhost/apmont",coll);



io.sockets.on('connection', function( socket ){

	sck = socket;
	console.log("hola mundo");

});
