var io = require('socket.io').listen(6060);

coll = ["cartera","usuarios","facturacion","usuarios_sys","reacudo"];
var db = require("mongojs").connect("localhost/apmont",coll);
var sck = 0;
var scks_id = new Array();

function buscar(data){

        console.log("socket => " +  data.socket);



     
     if( !/^([0-9])*$/.test(data.texto) )
	    
       {       
                
               
         db.usuarios.find({ $or: [{ nombre : new RegExp(data.texto,"i")} , { barrio : new RegExp(data.texto,"i") }] } , function(err,resp){

              if(!err)
                io.sockets.socket(data.socket).emit("result", { resp : resp , total : resp.length } );
              else
                io.sockets.socket(data.socket).emit("result",{err:1,resp:resp});
              

         }).skip(3).limit(50);
      

       }

     else

        db.usuarios.find({ $or: [{ nic : data.texto },{ cedula : data.texto.toString() },{ nit : data.texto.toString() }] } ,function(err,resp){

            
              if(!err)
                io.sockets.socket(data.socket).emit("result", { resp : resp , total : resp.length } );
              else
                io.sockets.socket(data.socket).emit("result",{err:1,resp:resp});


       });
           

}


function crear_bd(){}


function notificar( data ){

    sck.emit("notificacion", data);

}


function cargar(data){

  
   db.articulos.save(data, function(res){
            
             if(res){
                io.sockets.socket(data.socket).emit('carga', {status:1});
                notificar( { tipo :  "0" , texto : "Se ha cargado nueva información de catastro" } );
               }else{
                io.sockets.socket(data.socket).emit('carga', {status:0});
             }

    });


}


function editar(data){
   
    console.log(data);
  
    
    if( db.usuarios.update( { nic : data.nic  }, { $set : {nic : data.nic , nit : data.nit.toString(), cedula : data.cedula.toString() , nombre : data.nombre , municipio : data.municipio , direccion : data.direccion , barrio : data.barrio , tipo : data.tipo , estado : data.estado } }) )
       io.sockets.socket(data.socket).emit("editar",{ proceso : 1 });
     else
       io.sockets.socket(data.socket).emit("editar",{ proceso : 0 }); 


}





io.sockets.on('connection', function (socket) {  

  sck = socket;
  scks_id.push(socket.id);
  
  socket.on('buscar', function (data) {

      data.socket = socket.id;
      buscar(data);
      

  });


  socket.on("cmd",function(data){


  	   io.sockets.emit("cmdo",{ comando : data });

  });


  socket.on("cargar",function(data){

      cargar(data);

  });


  socket.on("editar",function(data){

      editar(data);

  });


});



