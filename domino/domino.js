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

domino.blockWidth = 30;
domino.blockHeight = 30;

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
      if(!this.blocks[c]) this.blocks[c] = [];
      this.blocks[c][r] = new domino.block(c,r,'?', '#EEE');
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
  
  this.swapBlock = function(block, col, row) {
    this.blocks[col][row] = block;
  }
};

domino.blockDisplay = function(block, w, h) {
  this.width = w = w || domino.blockWidth;
  this.height = h = h || domino.blockHeight;
  this.sprite = new lime.Label().setSize(w,h)
    .setPosition(w * block.col, h * block.row);
  
  this.swapBlock = function(block) {
    this.block = block;
    
    this.sprite
      .setFill(block.color)
      .setText(block.symbol);
  };
  this.swapBlock(block, w, h);
}

domino.boardDisplay = function(layer, board) {
  this.board = board;
  var display = [];
  
  this.board.each(function(block) {
    if(!display[block.col]) display[block.col] = [];
    
    var spriteBlock = 
      display[block.col][block.row] = 
      new domino.blockDisplay(block);
        
    // add each sprite to the layer
    layer.appendChild(spriteBlock.sprite);
    
  });
  
  this.each = function(fun) {
    for(var c = 0; c < board.cols; c ++) {
      for (var r = 0; r < board.rows; r ++) {
        fun(display[c][r]);
      }
    }    
  } 
  
  this.swapBlock = function(block, col, row) {
    display[col][row].swapBlock(block);
    this.board.swapBlock(block, col, row);
  }
};

domino.blockFactory = function() {
  this.symbols = [1,2,3,4,5];
  this.colors = ['#F00', '#0f0', '#FF0', '#00f', '#0ff'];
  
  var randIndex = function(a) {
      return Math.floor(Math.random() * a.length);
    },
    rand = function(a) { return a[randIndex(a)]; };
  
  this.generate = function() {
    var sym = rand(this.symbols),
      color = rand(this.colors);
      
    return new domino.block(1, 1, sym, color);
  };
};


// entrypoint
domino.start = function(){
	var director = new lime.Director(document.body,1024,768),
	    scene = new lime.Scene(),
      gameBoard = new domino.board(),
	    blockLayer = new lime.Layer().setPosition(100,0),
	    nextBlockLayer = new lime.Layer().setPosition(0,0),
	    blockFactory = new domino.blockFactory(),
	    nextBlock = null,
	    boardDisplay = new domino.boardDisplay(blockLayer, gameBoard);

  scene.appendChild(blockLayer);
  scene.appendChild(nextBlockLayer)
  
  //create next block
  nextBlock = new domino.blockDisplay(blockFactory.generate());
  nextBlockLayer.appendChild(nextBlock.sprite);

	director.makeMobileWebAppCapable();

    boardDisplay.each(function(blockDisplay) {
      goog.events.listen(blockDisplay.sprite, 'click', function(e) {
        var blk = blockDisplay.block;
        boardDisplay.swapBlock(nextBlock.block, blk.col, blk.row);
      })
    });
	
    

	// set current scene active
	director.replaceScene(scene);

}


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('domino.start', domino.start);
