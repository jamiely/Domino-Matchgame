//set main namespace
goog.provide('domino');


//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.Circle');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveTo');

domino.block = function(col, row, symbol, color) {
  this.symbol = symbol || '';
  this.color = color || '';
  this.col = col;
  this.row = row;
}

domino.board = function(cols, rows) {
  // defaults
  this.rows = rows = rows || 10;
  this.cols = cols = cols || 10;
  
  this.blocks = [];
  for(var c = 0; c < cols; c ++) {
    for (var r = 0; r < rows; r ++) {
      this.blocks[c][r] = new domino.block(c,r,'e');
    }
  }
  
  this.block = function(c, r) {
    return this.blocks[c][r];
  }
  
  this.each = function(fun) {
    for(var c = 0; c < cols; c ++) {
      for (var r = 0; r < rows; r ++) {
        fun(this.blocks[c][r]);
      }
    }    
  }
};

domino.boardDisplay = function(scene, board) {
  this.board = board;
  var display = [],
    layer = new lime.Layer().setPosition(0,0);
  
  this.board.each(function(block) {
    var spriteBlock = 
      display[block.col][block.row] = 
      new lime.Sprite.setSize(w,h)
        .setPosition(w * block.col, h * block.row)
        .setText(block.symbol);
        
    // add each sprite to the layer
    layer.appendChild(spriteBlock);
  });
  
  // add the layer to the scene
  scene.appendChild(layer);
}

// entrypoint
domino.start = function(){

	var director = new lime.Director(document.body,1024,768),
	    scene = new lime.Scene(),
      gameBoard = new domino.board(),
	    boardDisplay = new domino.boardDisplay(scene, gameBoard);



    //add target and title to the scene
    scene.appendChild(target);
    scene.appendChild(title);

	director.makeMobileWebAppCapable();

    //add some interaction
    goog.events.listen(target,['mousedown','touchstart'],function(e){

        //animate
        target.runAction(new lime.animation.Spawn(
            new lime.animation.FadeTo(.5).setDuration(.2),
            new lime.animation.ScaleTo(1.5).setDuration(.8)
        ));

        title.runAction(new lime.animation.FadeTo(1));

        //let target follow the mouse/finger
        e.startDrag();

        //listen for end event
        e.swallow(['mouseup','touchend'],function(){
            target.runAction(new lime.animation.Spawn(
                new lime.animation.FadeTo(1),
                new lime.animation.ScaleTo(1),
                new lime.animation.MoveTo(512,384)
            ));

            title.runAction(new lime.animation.FadeTo(0));
        });


    });

	// set current scene active
	director.replaceScene(scene);

}


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('domino.start', domino.start);
