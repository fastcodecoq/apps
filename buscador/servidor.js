var io = require('socket.io').listen(6060);

coll = ["cartera","usuarios","facturacion","usuarios_sys","reacudo","filtros"];
var mgjs = require("mongojs");
var db = mgjs.connect("localhost/apmont",coll);
var sck = 0;
var scks_id = new Array();
var ObjectId = mgjs.ObjectId;

function buscar(data){

        console.log("socket => " +  data.socket);


     data.texto = data.texto.trim();
     
     if( !/^([0-9])*$/.test(data.texto) )
	    
       {       
                
       var count;
       var t = data.tiempo;

       if(!data.nPag)
           data.nPag = 1;


      if(!data.filtros)
          query =  { nombre :  RegExp("^" + data.texto,"i") } ; 

        else{


          switch( data.filtros.tipo ){

          case  "avanzado":  

          console.log( "avanzado" )        

          query = { $where : data.filtros.f };

          break;

           }


          }
          

        console.log("query ==> ");
        console.log(query);

        var col;

      switch(data.sbd){

          case "luminarias":

              col = db.luminarias;

          break;


          default:

             col = db.usuarios;


      }


      console.log(col);


       col.find(query).count(function(e,r){
  
               count = r;

               col.find(query).skip( (data.nPag - 1) * 50 ).limit(50, function(err,resp){


              if(!err)
                io.sockets.socket(data.socket).emit("result", { resp : resp , total_pagina : resp.length , total : count , tiempo :  Math.round((new Date()).getTime() / 1000) - t , nPag : data.nPag } );
              else
                io.sockets.socket(data.socket).emit("result",{err:err,resp:resp});
            
              
         });


       });      
      

       }

     else {

       var query = "";



       switch(data.sbd){

          case "luminarias":

              col = db.luminarias;

          break;


          default:




             col = db.usuarios;

               if(!data.filtros)
                query =  { $or: [{nic : data.texto} , {nit : data.texto} , {cedula : data.texto}] };
             else
               return;


      }


       console.log(query);

        col.find(query).count(function(e,r){
  
              count = r;

               col.find(query).skip( (data.nPag - 1) * 50 ).limit(50, function(err,resp){


              if(!err)
                io.sockets.socket(data.socket).emit("result", { resp : resp , total_pagina : resp.length , total : count , tiempo :  Math.round((new Date()).getTime() / 1000) - t , nPag : data.nPag } );
              else
                io.sockets.socket(data.socket).emit("result",{err:err,resp:resp});
            
              

         });

       }); 



      }
           

}


function crear_bd(){}


function notificar( data ){

    sck.emit("notificacion", data);

}


function obt_filtros(data){

      query = data.query;

     db.filtros.find( query,function(err,resp){

        io.sockets.socket(data.socket).emit("r_filtros",resp);

     })

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


function editar(data, sck){
   
    console.log(data);
  

    db.usuarios.update({ _id : ObjectId(data._id)  }, { $set : {nic : data.nic , nit : data.nit.toString(), cedula : data.cedula.toString() , nombre : data.nombre , municipio : data.municipio , direccion : data.direccion , barrio : data.barrio , tipo : data.tipo , estado : data.estado }} );
    io.sockets.socket(sck).emit("editado", {success :  1});
       

}



function eliminar_reg(data){


     console.log(data);

     var resp;

     switch(data.sbd){


      case "catastro":

           db.usuarios.remove( { _id : ObjectId(data.id) } , function(err,rs){

            console.log(rs)
                
                if( rs > 0)
                 io.sockets.socket(data.socket).emit("eliminado_reg", { success : 1}); 
                else 
                 io.sockets.socket(data.socket).emit("eliminado_reg", { success : 0}); 


           });


      break;


     }




}


function add_reg(data){


     console.log(data);

     var rs;

     switch(data.sbd){


      case "catastro":

          if( data.info.nic == "" && data.info.cedula == "" && data.info.nit == "")
          {

              rs = { sucess : 0 , err : "001" };
              io.sockets.socket(data.socket).emit("reg_added", rs); 

              return;

          }


          if ( data.info.nic == "" )
               data.info.nic = gen_nic();

          var query_ = { nic : data.info.nic };


          db.usuarios.find(query_).count(function(err, r){

                   if( r > 0 ){

              rs = { sucess : 0 , err : "002" };   
              io.sockets.socket(data.socket).emit("reg_added", rs);            
              return;

                 }else{


                    db.usuarios.save( data.info, function(err, resp){

                      if(!err)
                         rs = { success : 1 };
                       else
                         rs = { success : 0 , error : "003"};


                  io.sockets.socket(data.socket).emit("reg_added", rs); 

                   console.log(rs);

                     });


                 }


          });


         

          

      break;

    }

    

}





io.sockets.on('connection', function (socket) {  

  sck = socket;
  scks_id.push(socket.id);
  console.log("hola")
  
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

      editar(data, socket.id);

  });

  socket.on("obt_filtros", function(data){

          data = {

              nombre : data.nombre ,
              socket : socket.id

          }

          obt_filtros(data);

  });


  socket.on("eliminar_reg", function(data){

             data = {

              id : data.id ,
              sbd : data.sbd,
              socket : socket.id

               }

            eliminar_reg(data);

  });


  socket.on("add_reg", function(data){

          data = {

              info : data.info,
              socket : socket.id,
              sbd : data.sbd

          }


          add_reg(data);

  });


});


//utilidades


function gen_nic( vars ){


var cAleatoria = "";

  this.vars = {

      limit : 7,
      aNumeros : new Array('0','1', '2', '3','2','3','4','5','6','7','8','9'),
      aLetras : new Array('a', 'b', 'c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z')

  }

  if(vars){
      
      if( this.vars.limit )  
      this.vars.limit = vars.limit;
      
      if( this.vars.aNumeros )  
      this.vars.aNumeros = vars.aNumeros;
      
      if( this.vars.aLetras )  
      this.vars.aLetras= vars.aLetras;
             

    }


   for ( i = 0 ; i < this.vars.limit ; i++ )
      {

        if( i%2 == 0 )
        cAleatoria += this.vars.aLetras[Math.floor(Math.random()* this.vars.aLetras.length)];
        else
        cAleatoria += this.vars.aNumeros[Math.floor(Math.random()* this.vars.aNumeros.length)]; 


      }


  return cAleatoria;

}



// otros phpjs

function trim (str, charlist) {
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   improved by: mdsjack (http://www.mdsjack.bo.it)
  // +   improved by: Alexander Ermolaev (http://snippets.dzone.com/user/AlexanderErmolaev)
  // +      input by: Erkekjetter
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: DxGx
  // +   improved by: Steven Levithan (http://blog.stevenlevithan.com)
  // +    tweaked by: Jack
  // +   bugfixed by: Onno Marsman
  // *     example 1: trim('    Kevin van Zonneveld    ');
  // *     returns 1: 'Kevin van Zonneveld'
  // *     example 2: trim('Hello World', 'Hdle');
  // *     returns 2: 'o Wor'
  // *     example 3: trim(16, 1);
  // *     returns 3: 6
  var whitespace, l = 0,
    i = 0;
  str += '';

  if (!charlist) {
    // default list
    whitespace = " \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";
  } else {
    // preg_quote custom list
    charlist += '';
    whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
  }

  l = str.length;
  for (i = 0; i < l; i++) {
    if (whitespace.indexOf(str.charAt(i)) === -1) {
      str = str.substring(i);
      break;
    }
  }

  l = str.length;
  for (i = l - 1; i >= 0; i--) {
    if (whitespace.indexOf(str.charAt(i)) === -1) {
      str = str.substring(0, i + 1);
      break;
    }
  }

  return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
}