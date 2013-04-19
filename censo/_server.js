var mgoose = require("mongoose"),
    io = require("socket.io").listen(8888),
    sck = 0,
    db,
    modelos;




function conectar(){


 mgoose.connect("mongodb://localhost/apmont");
 
 db = mgoose.connection;


 db.on("error", function(err){

   if(sck != 0 )
    console.log(err);
   else 
   	console.log(err);

 });


 db.on("open", function(){

    console.log("conectado a la bd");

 });


    modelos = {  censo : db.model("censo",   get_schemas()) };


}


function guardar( data ){
  

   var local = new modelos.censo( data.info );

   console.log(data.info)

   data.info.recibo = base64_decode(data.info.recibo);
   data.info.local = base64_decode(data.info.local);

   local.save( function(err,rs){

   			if(err)
   		  	 io.sockets.socket(data.socket).emit("guardado", {succes : 0 , info : data.info, error : err});
   		    else
   		     io.sockets.socket(data.socket).emit("guardado", {succees : 1,  tipo : data.tipo});

   });


}


function buscar( data ){


	    censo.find( data.query , function(err, resp){

   		        if(err)
   		        	 io.sockets.socket(data.socket).emit("guardado", {succes : 0 , error : err});
   		        else
   		        	 io.sockets.socket(data.socket).emit("guardado",{succees : 1 , resp : resp});

         });


}


function get_schemas( val ){





	switch( val ){


			default :

			 var censoSchema = mgoose.Schema({

 	    nombre : {type : String , trim : true, required : true},
 	    nic :  {type : String, default : "No hay"},
      nit :  {type : String, trim : true},
 	    obs :  {type : String, trim : true},
 	    recibo : {type : mgoose.Schema.Types.Mixed, required : true}, 	    
 	    local : {type : mgoose.Schema.Types.Mixed, required : true},
 	    ancho : {type : Number, required : true},
      largo : {type : Number, required: true},     
 	    nivel : {type : Number, required: true}	    

				 });


                  return censoSchema;

			break;

	}



}

conectar();

io.sockets.on('connection', function( socket ){


    console.log("conectado al socket");

	sck = socket;

    socket.on("guardar",function( data ){
       
         data = {

         	 socket : socket.id,
         	 info : data.info,
           tipo : data.tipo

         };

    	guardar( data ); 

    });


});




// phpjs

function base64_decode (data) {
  // http://kevin.vanzonneveld.net
  // +   original by: Tyler Akins (http://rumkin.com)
  // +   improved by: Thunder.m
  // +      input by: Aman Gupta
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Onno Marsman
  // +   bugfixed by: Pellentesque Malesuada
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: Brett Zamir (http://brett-zamir.me)
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // *     example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
  // *     returns 1: 'Kevin van Zonneveld'
  // mozilla has this native
  // - but breaks in 2.0.0.12!
  //if (typeof this.window['atob'] == 'function') {
  //    return atob(data);
  //}
  var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
    ac = 0,
    dec = "",
    tmp_arr = [];

  if (!data) {
    return data;
  }

  data += '';

  do { // unpack four hexets into three octets using index points in b64
    h1 = b64.indexOf(data.charAt(i++));
    h2 = b64.indexOf(data.charAt(i++));
    h3 = b64.indexOf(data.charAt(i++));
    h4 = b64.indexOf(data.charAt(i++));

    bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

    o1 = bits >> 16 & 0xff;
    o2 = bits >> 8 & 0xff;
    o3 = bits & 0xff;

    if (h3 == 64) {
      tmp_arr[ac++] = String.fromCharCode(o1);
    } else if (h4 == 64) {
      tmp_arr[ac++] = String.fromCharCode(o1, o2);
    } else {
      tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
    }
  } while (i < data.length);

  dec = tmp_arr.join('');

  return dec;
}

