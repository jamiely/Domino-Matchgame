//set main namespace
goog.provide('domino');


//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.Label');
goog.require('lime.RoundedRect');

domino.blockWidth = 20;
domino.blockHeight = 20;

domino.message = function(str) {
  alert(str);
};

domino.colors = {
  empty: '#EEE',
  cleared: '#d1c072'
};

domino.symbols = {
  wild: '*',
  empty: '_',
  cleared: '-'
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
  domino.map(a, fun);
}

domino.map = function(a, fun) {
  var res = [];
  for(var c = 0; c < a.length; c ++) {
    res.push(fun(a[c]));
  }
  return res;
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
  
  this.fillable = function() {
    return empty() || clear();
  }
  
  var empty = this.empty = function() {
    return symbol == domino.symbols.empty;
  }
  
  var clear = this.clear = function() {
    return symbol == domino.symbols.cleared; 
  }
  
  var wild = this.wild = function() {
    return symbol == domino.symbols.wild;
  };

}

domino.board = function(symbol, color, cols, rows) {
  symbol = symbol || domino.symbols.empty;
  color = color || domino.colors.empty;
  
  // defaults
  this.rows = rows = rows || 5;
  this.cols = cols = cols || 5;
  
  var _blocks = [],
    _cleared = [];
    
  this.blockCount = rows * cols;
  
  // board init
  for(var c = 0; c < cols; c ++) {
    for (var r = 0; r < rows; r ++) {
      if(!_blocks[c]) {
        _blocks[c] = [];
        _cleared[c] = [];
      }
      _blocks[c][r] = new domino.block(c,r, 
        domino.symbols.empty, domino.colors.empty);
      _cleared[c][r] = false;
    }
  }
  
  this.clearedCountCached = 0;
  /**
   * Determine if the entire board has been cleared.
   */
  this.clearedCount = function() {
    var that = this, count = 0;
    
    this.eachIndex(function(c,r) {
      if(_cleared[c][r]) count++;
    });
    
    this.clearedCountCached = count;
    return count;
  }
  
  this.cleared = function() {
    return this.clearedCount() == this.blockCount;
  }
  
  /**
   * Mark the position as cleared.
   */
  this.clear = function(c,r) {
    _cleared[c][r] = true;
  }
  
  /**
   * Use to determine if there are any possible valid moves yet
   */
  this.hasMoves = function() {
    return true;
  }
  
  /**
   * Use to get the possible locations where the block may be
   * placed legally.
   */
  this.moves = function(blk) {
    var that = this,
      fillable = this.fillable(),
      moves = domino.filter(fillable, function(target) {
        return that.isValid(target, blk);
      });
    
    return moves;
  }
  
  /**
   * Use to get the locations of fillable areas, that is, places
   * where we can put down a piece.
   */
  this.fillable = function() {
    var blocks = [];
    this.each(function(blk) {
      if(blk.fillable())
        blocks.push(blk);
    });
    
    return blocks;
  }
  
  /**
   * retrieve a particular block
   */
  this.block = function(c, r) {
    return _blocks[c][r];
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
    return _blocks[c] && _blocks[c][r] ?
      _blocks[c][r] : null;
  }
  
  this.eachIndex = function(fun) {
    this.mapIndex(fun);
  }

  this.mapIndex = function(fun) {
    var res = [];
    for(var c = 0; c < cols; c ++) {
      for (var r = 0; r < rows; r ++) {
        res.push(fun(c, r));
      }
    }    
    return res;
  }

  this.each = function(fun) {
    this.map(fun);
  }
  this.map = function(fun) {
    var res = this.mapIndex(function(c,r) {
      return fun(_blocks[c][r]);
    });
    return res;
  }
  
  this.swapBlock = function(block, col, row) {
    // set these in case they haven't been set
    block.row = row;
    block.col = col;
    _blocks[col][row] = block;
  }
  
  this.isValid = function(target, replacement) {
    var taken = (target.symbol != domino.symbols.empty &&
        target.symbol != domino.symbols.cleared),
      neighbors = this.neighbors(target),
      empty = domino.filter(neighbors, function(blk) {
        return blk == null || blk.symbol == domino.symbols.empty ||
          blk.symbol == domino.symbols.cleared;
      }),
      mismatches = domino.filter(neighbors, function(blk) {
        var empty = blk == null || blk.symbol == domino.symbols.empty ||
          blk.symbol == domino.symbols.cleared;
        if(empty) return false;
        
        var colMatch = blk.color == replacement.color || 
          blk.color == domino.wild.color ||
          domino.wild.color == replacement.color;
        
        var symMatch = blk.symbol == replacement.symbol ||
          blk.symbol == domino.wild.symbol ||
          domino.wild.symbol == replacement.symbol;
          
        return !(colMatch || symMatch);
      }),
      valid = !taken && mismatches.length == 0 &&
        empty.length < 4;

    return valid;
  }
  
  
  
};

domino.board.getClearBlock = function(c,r) {
  return new domino.block(c,r,
      domino.symbols.cleared, domino.colors.cleared);
}

domino.blockDisplay = function(block, w, h) {
  this.width = w = w || domino.blockWidth;
  this.height = h = h || domino.blockHeight;
  
  // creates the appearance of a rounded rectangle with a stroke
  var sprite = this.sprite = new lime.Sprite()
      .setSize(w,h)
      .setPosition(w * block.col, h * block.row),
    outerRoundRect = new lime.RoundedRect()
      .setSize(w,h),
    innerRoundRect = new lime.RoundedRect()
      .setSize(w-4, h-4),
    label = new lime.Label()
      .setFontFamily('bauhaus 93')
      .setSize(w-5, h-7)
      .setText('?');
      
  
  sprite.appendChild(outerRoundRect);
  sprite.appendChild(innerRoundRect);
  sprite.appendChild(label);
  
  this.cleared = false;
  
  this.swapBlock = function(block) {
    this.block = block;
    
    if(block.empty() || block.clear()) {
      sprite.setFill(block.color);
      outerRoundRect.setFill(block.color);
      innerRoundRect.setFill(block.color);
      
      label.setText('');
    }
    else {
      var color = new lime.fill.Color(block.color);
      outerRoundRect.setFill(color.addBrightness(-0.2));
      innerRoundRect.setFill(block.color);
      label.setText(block.wild()? '☆' : block.symbol);
    }
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
    col = typeof col == 'undefined' ? block.col : col;
    row = typeof row == 'undefined' ? block.row : row;
    
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
    display[c][r].cleared = true;
    this.board.clear(c,r);
    this.swapBlock(domino.board.getClearBlock(c, r));
  }
  
  
  this.getColumn = function(colIndex) {
    var blocks = [];
    for(var r = 0; r < board.rows; r++) {
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
  
  var filled = function(blockDisplay) {
    return blockDisplay.block.symbol != domino.symbols.empty &&
      blockDisplay.block.symbol != domino.symbols.cleared;
  };
  
  /**
   * Check row and col of last altered block, to see if we should clear.
   */
  this.update = function() {
    var blk = lastSwapped.block;
    if(!blk) return;
    
    var
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
  var that = this,
    possibleColors = [
    '#F00', '#0f0', '#FF0', '#00f', '#0ff',
    '#8414AC', '#2FDEFB', '#F11B71', '#54FF45', '#2008FF'
    ],
    possibleSymbols = [
      1, domino.wild.symbol, 2, 3, 4,
      5, 6, 7, 8, 9
    ];
  
  this.symbols = [];
  this.colors = [];
  
  var randIndex = function(a) {
      return Math.floor(Math.random() * a.length);
    },
    rand = function(a) { return a[randIndex(a)]; };
  
  this.generate = function() {
    var sym = rand(this.symbols),
      color = rand(this.colors);
    if(sym == domino.wild.symbol) {
      color = domino.wild.color;
    }
    return new domino.block(1, 1, sym, color);
  };

  var addSymbol = function() {
    that.symbols.push(possibleSymbols.shift());
  }
  
  var inc = this.inc = function(counter) {
    that.colors.push(possibleColors.shift());
    addSymbol();
    if(counter && counter > 0) {
      that.inc(counter-1);
    }
  }
  
  // add 4 symbols
  this.inc(1);
  addSymbol(); // add an extra symbol in the beginning to make things interesting
};

domino.title = function() {
  var that = this,
    layer = this.layer = new lime.Layer().setPosition(80, 16);

  var text = new lime.Label()
    .setFontFamily('bauhaus 93')
    .setSize(350, 25)
    .setText('Domino Match Game').setFill('#F00');

  layer.appendChild(text);

  this.setText = function(str) { text.setText(str); }
};

domino.discard = function() {
  var
    that = this,
    layer = this.layer = new lime.Layer().setPosition(50, 270);

  var text = new lime.Label()
    .setFontFamily('bauhaus 93')
    .setSize(100, 25)
    .setText('Discard').setFill('#CCF');

  layer.appendChild(text);
  this.ondiscard = function(e) { console.log(e); }
  goog.events.listen(text, 'click', function(e){
    that.ondiscard(e);
  });
};

domino.widgetClear = function() {
  var layer = this.layer = new lime.Layer().setPosition(200, 270),
    text = new lime.Label()
      .setFontFamily('bauhaus 93')
      .setSize(100, 25)
      .setText('0 cleared').setFill('#EEE');
  
  layer.appendChild(text);
  
  this.text = function(count) {
    if(count) {
      text.setText(count + ' cleared');
      return this;
    }
    else {
      return text.getText();
    }
  }
};

domino.round = function(game, options) {
  var gameBoard = new domino.board(null, null, 
      options.boardSize || 3, 
      options.boardSize || 3),
    blockLayer = new lime.Layer()
      .setPosition(20, 45),
  
    _nextBlock = null,
    boardDisplay = new domino.boardDisplay(blockLayer, gameBoard),
    initBlock = new domino.block(1, 1, domino.wild.symbol, domino.wild.color);

  game.scene.appendChild(blockLayer);
    
  
  // init block
  
  var mid = Math.floor(gameBoard.rows/2);
  boardDisplay.swapBlock(initBlock, mid, mid);
  
  boardDisplay.each(function(blockDisplay) {
    goog.events.listen(blockDisplay.sprite, 'click', function(e) {
      // the clicked block
      var blk = blockDisplay.block,
        _nextBlock = game.getNextBlock();
      
      if(gameBoard.isValid(blk, _nextBlock.block)) {
        boardDisplay.swapBlock(_nextBlock.block, blk.col, blk.row);
        boardDisplay.update();
        options.onValidMove(boardDisplay);
        domino.message('Domino Match Game');
      }
      else {
        domino.message('That block cannot be placed there.');
      }
    });
  });
  
  this.remove = function() {
    game.scene.removeChild(blockLayer);
  }
}

domino.game = function() {
  var that = this,
    scene = this.scene = new lime.Scene(),
    blockFactory = new domino.blockFactory(),
    roundOptions = {
      onValidMove: function(boardDisplay) {
        nextBlock();
        var count = boardDisplay.board.clearedCountCached;
        clearWidget.text(count);
        if(boardDisplay.board.cleared()) {
          round.remove();

          roundOptions.boardSize += 2;
          if(roundOptions.boardSize > 11) {
            roundOptions.boardSize = 11;
          }
          // increment the color and symbol options
          blockFactory.inc();  
          round = new domino.round(that, roundOptions);
        }
      },
      boardSize: 11
    },
    round = new domino.round(this, roundOptions),
  
    nextBlockLayer = new lime.Layer().setPosition(105, 250),
  
    // widget clear
    clearWidget = new domino.widgetClear(),
  
    title = new domino.title(),
    // discard
    discard = new domino.discard();

  domino.message = function(str) {
    title.setText(str);
  };

  scene.appendChild(nextBlockLayer);  
  scene.appendChild(discard.layer);
  scene.appendChild(clearWidget.layer);
  scene.appendChild(title.layer);

  function nextBlock() {
    _nextBlock.swapBlock(blockFactory.generate());
  }
  //create next block
  _nextBlock = new domino.blockDisplay(blockFactory.generate());
  nextBlockLayer.appendChild(_nextBlock.sprite);

  this.getNextBlock = function() {
    return _nextBlock;
  }
  
  discard.ondiscard = function(e) {
    nextBlock();
  }
}

// entrypoint
domino.start = function(){
	var director = new lime.Director(document.body,240,320),
	  game = new domino.game();
	    
  //director.makeMobileWebAppCapable();
  
	// set current scene active
	director.replaceScene(game.scene);

}


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('domino.start', domino.start);
