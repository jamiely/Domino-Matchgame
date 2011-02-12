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

domino.colors = {
  empty: '#EEE',
  cleared: '#d1c072'
};

domino.symbols = {
  wild: '*',
  empty: '?',
  cleared: '_'
};

domino.wild = {
  symbol: domino.symbols.wild,
  color: '#666'
}

domino.keys = function(h) {
  var k = [];
  for(var i in h) {
    k.push(i);
  }
  return k;
}

domino.each = function(a, fun) {
  for(var c = 0; c < a.length; c ++) {
    fun(a[c]);
  }  
}

domino.has = function(a, el) {
  for(var c = 0; c < a.length; c ++) {
    if(el == a[c]) {
      return true;
    }
  };
  return false;
}

domino.filter = function(a, fun) {
  var rtn = [];
  for(var c = 0; c < a.length; c ++) {
    if(fun(a[c])) {
      rtn.push(a[c]);
    }
  };
  return rtn;
}

domino.block = function(col, row, symbol, color) {
  this.symbol = symbol || '';
  this.color = color || '';
  this.col = col;
  this.row = row;
}

domino.board = function(symbol, color, cols, rows) {
  symbol = symbol || domino.symbols.empty;
  color = color || domino.colors.empty;
  
  // defaults
  this.rows = rows = rows || 10;
  this.cols = cols = cols || 10;
  
  this.blocks = [];
  for(var c = 0; c < cols; c ++) {
    for (var r = 0; r < rows; r ++) {
      if(!this.blocks[c]) this.blocks[c] = [];
      this.blocks[c][r] = new domino.block(c,r, 
        domino.symbols.empty, domino.colors.empty);
    }
  }
  
  this.block = function(c, r) {
    return this.blocks[c][r];
  }
  
  this.neighbors = function(blk) {
    var n = [];
    n.push(this.get(blk.col - 1, blk.row));  
    n.push(this.get(blk.col + 1, blk.row));  
    n.push(this.get(blk.col, blk.row - 1));  
    n.push(this.get(blk.col, blk.row + 1));  
    return n;
  }
  
  this.neighborInfo = function(blk) {
    var colors = {}, symbols = {},
      neighbors = domino.filter(this.neighbors(blk), function(n) {
        return n.symbol != domino.symbols.empty;
      });
    domino.each(neighbors, function(n) {
      colors[n.color] = 1;
      symbols[n.symbol] = 1;
    });
    return {
      colors: domino.keys(colors),
      symbols: domino.keys(symbols)
    };
  }
  
  this.get = function(c, r) {
    return this.blocks[c] && this.blocks[c][r] ?
      this.blocks[c][r] : null;
  }
  
  this.each = function(fun) {
    for(var c = 0; c < cols; c ++) {
      for (var r = 0; r < rows; r ++) {
        fun(this.blocks[c][r]);
      }
    }    
  }
  
  this.swapBlock = function(block, col, row) {
    // set these in case they haven't been set
    block.row = row;
    block.col = col;
    this.blocks[col][row] = block;
  }
  
  this.isValid = function(target, replacement) {
    var taken = target.symbol != domino.symbols.empty,
      neighbors = this.neighbors(target),
      empty = domino.filter(neighbors, function(blk) {
        return blk == null || blk.symbol == domino.symbols.empty;
      }),
      mismatches = domino.filter(neighbors, function(blk) {
        var empty = blk == null || blk.symbol == domino.symbols.empty;
        if(empty) return false;
        
        var colMatch = blk.color == replacement.color || 
          blk.color == domino.wild.color;
        
        var symMatch = blk.symbol == replacement.symbol ||
          blk.symbol == domino.wild.symbol;
          
        return !(colMatch || symMatch);
      }),
      valid = !taken && mismatches.length == 0 &&
        empty.length < 4;

    return valid;
  }
  
  
  
  this.clearRow = function(rowIndex) {
    for(var c = 0; c < cols; c++) {
      this.blocks[c][rowIndex] = this.getClearBlock(c, rowIndex);
    }
  };
  
  this.clearColumn = function(colIndex) {
    for(var r = 0; r < rows; r++) {
      this.blocks[colIndex][r] = this.getClearBlock(colIndex, rowIndex);
    }    
  };
};

domino.board.getClearBlock = function(c,r) {
  return new domino.block(c,r,
      domino.symbols.cleared, domino.colors.cleared);
}

domino.blockDisplay = function(block, w, h) {
  this.width = w = w || domino.blockWidth;
  this.height = h = h || domino.blockHeight;
  this.sprite = new lime.Label().setSize(w,h)
    .setPosition(w * block.col, h * block.row);
  this.cleared = false;
  
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
  var display = [],
    that = this;
  
  this.board.each(function(block) {
    if(!display[block.col]) {
      display[block.col] = [];
    }
    

    
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
  
  var lastSwapped = {
    block: null,
    col: 0,
    row: 0
  };
  
  this.swapBlock = function(block, col, row) {
    col = col || block.col;
    row = row || block.row;
    
    display[col][row].swapBlock(block);
    this.board.swapBlock(block, col, row);
    
    lastSwapped.block = block;
    lastSwapped.col = col;
    lastSwapped.row = row;
  }
  
  this.clearBlock = function(c,r) {
    if(typeof c == 'object') {
      r = c.row;
      c = c.col;
    }
    display[col][row].cleared = true;
    this.swapBlock(domino.board.getClearBlock(c, r));
  }
  
  this.clearRow = function(rowIndex) {
    for(var c = 0; c < board.cols; c ++) {
      this.clearBlock(c, rowIndex);
    }
  }
  
  this.clearColumn = function(colIndex) {
    for(var r = 0; r < rows; r++) {
      this.clearBlock(colIndex, r);
    }
  }
  
  this.getColumn = function(colIndex) {
    var blocks = [];
    for(var r = 0; r < rows; r++) {
      blocks.push(display[colIndex][r]);
    }
    return blocks;
  }
  
  this.getRow = function(rowIndex) {
    var blocks = [];
    for(var c = 0; c < board.cols; c ++) {
      blocks.push(display[c][rowIndex]);
    }
    return blocks;
  }  
  
  var filled = function(blk) {
    return blk.symbol == domino.symbols.empty ||
      blk.symbol == domino.symbols.cleared;
  };
  
  /**
   * Check row and col of last altered block, to see if we should clear.
   */
  this.update = function() {
    var blk = lastSwapped.block,
      col = this.getColumn(blk.col),
      row = this.getRow(blk.row),
      colFilled = domino.filter(col, filled),
      rowFilled = domino.filter(row, filled),
      clearCol = colFilled.length == col.length,
      clearRow = rowFilled.length == row.length,
      clear = function(blockDisplay) {
        that.clearBlock(blockDisplay.block)
      };
    
    if(clearCol) domino.each(col, clear);
    if(clearRow) domino.each(row, clear);
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
	    
	    // shows current game pieces
      gameBoard = new domino.board(),
	    blockLayer = new lime.Layer().setPosition(100,0),
	    
	    
	    
	    nextBlockLayer = new lime.Layer().setPosition(0,0),
	    blockFactory = new domino.blockFactory(),
	    _nextBlock = null,
	    boardDisplay = new domino.boardDisplay(blockLayer, gameBoard),
	    initBlock = new domino.block(1, 1, domino.wild.symbol, domino.wild.color);

  scene.appendChild(blockLayer);
  scene.appendChild(nextBlockLayer);

  
  function nextBlock() {
    _nextBlock.swapBlock(blockFactory.generate());
  }
  //create next block
  _nextBlock = new domino.blockDisplay(blockFactory.generate());
  nextBlockLayer.appendChild(_nextBlock.sprite);
  
  boardDisplay.swapBlock(initBlock, 5, 5);

	director.makeMobileWebAppCapable();

    boardDisplay.each(function(blockDisplay) {
      goog.events.listen(blockDisplay.sprite, 'click', function(e) {
        // the clicked block
        var blk = blockDisplay.block;
        
        if(gameBoard.isValid(blk, _nextBlock.block)) {
          boardDisplay.swapBlock(_nextBlock.block, blk.col, blk.row);
          boardDisplay.update();
          nextBlock();
        }
      });
    });
	
    

	// set current scene active
	director.replaceScene(scene);

}


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('domino.start', domino.start);
