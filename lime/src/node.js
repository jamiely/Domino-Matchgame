goog.provide('lime.Node');


goog.require('goog.events.EventTarget');
goog.require('goog.math.Box');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.math.Vec2');
goog.require('lime');
goog.require('lime.DirtyObject');

goog.require('lime.Renderer.CANVAS');
goog.require('lime.Renderer.DOM');


/**
* Node. Abstract drawable object in lime.
* @constructor
* @implements lime.DirtyObject
* @extends goog.events.EventTarget
*/
lime.Node = function() {
    goog.events.EventTarget.call(this);

    this.children_ = [];

    this.parent_ = null;

    this.transitionsAdd_ = {};
    this.transitionsActive_ = {};
    this.transitionsActiveSet_ = {};
    this.transitionsClear_ = {};

    /**
     * Node has been added to DOM tree
     * @type {boolean}
     * @private
     */
    this.inTree_ = false;

    this.director_ = null;

    this.scene_ = null;

    /**
     * Hash of active event handlers
     * @type {object}
     * @private
     */
    this.eventHandlers_ = {};

    this.setScale(1);

    this.setPosition(0, 0);

    this.setSize(0, 0);

    this.quality_ = 1.0;

    this.setAnchorPoint(0.5, 0.5);

    this.setRotation(0);

    this.setAutoResize(lime.AutoResize.NONE);

    this.opacity_ = 1;

    this.setMask(null);

    this.setRenderer(this.supportedRenderers[0].getType());

    this.setDirty(lime.Dirty.LAYOUT);

};
goog.inherits(lime.Node, goog.events.EventTarget);

/**
 * Supported renderers for Node
 * @type {Array.<lime.Renderer>}
 */
lime.Node.prototype.supportedRenderers = [
    lime.Renderer.DOM,
    lime.Renderer.CANVAS
];

/**
 * Set renderer for the node. Renderer defines what lower
 * level technology will be used for drawing node on screen
 * @param {lime.renderer.Renderer} value Renderer object.
 * @return {lime.Node} Node itself.
 */
lime.Node.prototype.setRenderer = function(value) {
    if (!this.renderer || this.renderer.getType() != value) {
        var index = -1;
        for (var i = 0; i < this.supportedRenderers.length; i++) {
            if (this.supportedRenderers[i].getType() == value) {
                index = i;
                break;
            }
        }
        if (index == -1) return; //not supported

        this.renderer = this.supportedRenderers[i];
        this.setDirty(lime.Dirty.LAYOUT);
        for (var i = 0, child; child = this.children_[i]; i++) {
            child.setRenderer(value);
        }
    }
    return this;
};

/**
 * Does node require DOM element for drawing?
 * @return {boolean} True if DOM is required.
 */
lime.Node.prototype.needsDomElement = function() {
    return !(this.parent_ &&
        this.parent_.renderer.getType() == lime.Renderer.CANVAS);
};

/**
 * Return deepest element in DOM tree that is used
 * for drawing the Node.
 * @return {domElement} Deepest DOM element.
 */
lime.Node.prototype.getDeepestDomElement = function() {
    return this.getDeepestParentWithDom().domElement;
};

/**
 * Return deepest parent node that requires DOM element
 * for drawing on screen.
 * @return {lime.Node} Deepest parent.
 */
lime.Node.prototype.getDeepestParentWithDom = function() {
    if (this.needsDomElement()) {
        this.updateDomElement();
        return this;
    }
    else {
        if (this.parent_)
        return this.parent_.getDeepestParentWithDom();
    }
};

/**
 * Return array of parent nodes until scene object
 * @private
 * @return {Array.<lime.Node>} Array of parents.
 */
lime.Node.prototype.getParentStack_ = function() {
    if (!this.parent_ || this instanceof lime.Scene) return [];
    var r = this.parent_.children_.indexOf(this);
    var a = this.parent_.getParentStack_();
    a.push(r);
    return a;
};

/**
 * Compare two node positions in the tree
 * @param {lime.Node} n1 First node.
 * @param {lime.Node} n2 Second node.
 * @return {number} Comparison result.
 */
lime.Node.compareNode = function(n1, n2) {
    if (n1 == n2) return 0;

    var s1 = n1.getParentStack_();
    var s2 = n2.getParentStack_();

    var i = 0;
    while (true) {
        if (s1.length <= i) {return -1}
        if (s2.length <= i) {return 1}

        if (s1[i] == s2[i]) {
            i++;
        }
        else {
            return s1[i] > s2[i] ? 1 : -1;
        }
    }
};

/**
 * @private
 */
lime.Node.prototype.customEvent_ = false;

/**
 * Return a bitmask of dirty values that need to be updated before next drawing
 * The bitmask parts are values of lime.Dirty enum
 * @return {number} Dirty propertiest bitmask.
 */
lime.Node.prototype.getDirty = function() {
    return this.dirty_;
};

/**
 * Sets a dirty value true. This means that object needs that
 * kind of updates before next draw.
 * @param {number} value Values to be added to the bitmask.
 * @param {number} opt_pass Pass number (0-1).
 * @param {boolean} opt_nextframe Register for next frame.
 * @return {lime.Node} Node itself.
 */
lime.Node.prototype.setDirty = function(value, opt_pass, opt_nextframe) {

    if (value && !this.dirty_) {
        lime.setObjectDirty(this, opt_pass, opt_nextframe);
    }
    var old = this.dirty_;
    this.dirty_ |= value;

    if (value == lime.Dirty.LAYOUT) {
        for (var i = 0, child; child = this.children_[i]; i++) {
            if (child instanceof lime.Node)
            child.setDirty(lime.Dirty.LAYOUT);
        }
    }
    if (!goog.isDef(this.dirty_) || !value) {
        this.dirty_ = 0;
        lime.clearObjectDirty(this, opt_pass, opt_nextframe);
    }
    return this;
};


/**
 * Returns scale vector for the element. 1,1 means no scale.
 * @return {goog.math.Vec2} scale vector.
 */
lime.Node.prototype.getScale = function() {
    return this.scale_;
};
/**
 * Sets new scale vector for element. This function also accepts
 * 2 numbers or 1 number that would be coverted to vector before use
 * @param {goog.math.Vec2} value New scale vector.
 * @return {lime.Node} Node itself.
 */
lime.Node.prototype.setScale = function(value) {
    if (arguments.length == 1 && goog.isNumber(value)) {
        this.scale_ = new goog.math.Vec2(value, value);
    }
    else if (arguments.length == 2) {
        this.scale_ = new goog.math.Vec2(arguments[0], arguments[1]);
    }
    else {
        this.scale_ = value;
    }
    if (this.transitionsActive_[lime.Transition.SCALE]) return this;
    return this.setDirty(lime.Dirty.SCALE);
};

/**
 * Returns element's position coordinate
 * @return {goog.math.Coordinate} Current position coordinate.
 */
lime.Node.prototype.getPosition = function() {
    return this.position_;
};

/**
 * Sets new position for element. Also accepts 2 numbers(x and y value)
 * @param {goog.math.Coordinate} value Position coordinate.
 * @return {lime.Node} object itself.
 */
lime.Node.prototype.setPosition = function(value) {
    if (arguments.length == 2) {
        this.position_ = new goog.math.Coordinate(arguments[0], arguments[1]);
    }
    else {
        this.position_ = value;
    }
    if (this.transitionsActive_[lime.Transition.POSITION]) return this;
    return this.setDirty(lime.Dirty.POSITION);
};

/**
 * Returns element used as a mask for current element
 * @return {lime.Node} Mask node.
 */
lime.Node.prototype.getMask = function() {
    return this.mask_;
};
/**
 * Sets element as a mask for current element
 * @param {lime.Node} value Mask node.
 * @return {lime.Node} object itself.
 */
lime.Node.prototype.setMask = function(value) {
    if (value == this.mask_) return;

    this.mask_ = value;

    return this.setDirty(lime.Dirty.CONTENT);
};

/**
 * Returns anchor point for the element.
 * @return {goog.math.Vec2} Anchorpoint vector.
 */
lime.Node.prototype.getAnchorPoint = function() {
    return this.anchorPoint_;
};

/**
 * Sets elements anchor point to new value. Anchor point is used
 * when positioning the element to position coordinate. [0,0] means
 * top left corner, [1,1] bottom right, [.5,.5] means that element
 * is position by the center. You can also pass in 2 numbers.
 * @param {goog.math.Vec2} value AnchorPoint vector.
 * @return {lime.Node} object itself.
 */
lime.Node.prototype.setAnchorPoint = function(value) {
    if (arguments.length == 2) {
        this.anchorPoint_ = new goog.math.Vec2(arguments[0], arguments[1]);
    }
    else {
        this.anchorPoint_ = value;
    }
    return this.setDirty(lime.Dirty.POSITION);
};

/**
 * Returns rotation angle for element in degrees
 * @return {number} Rotation angle.
 */
lime.Node.prototype.getRotation = function() {
    return (this.rotation_ = this.rotation_ % 360);
};

/**
 * Rotates element to specific angle in degrees
 * @param {number} value New rotation angle.
 * @return {lime.Node} object itself.
 */
lime.Node.prototype.setRotation = function(value) {

    this.rotation_ = value;

    if (this.transitionsActive_[lime.Transition.ROTATION]) return this;

    return this.setDirty(lime.Dirty.POSITION);
};


/**
 * Returns true if element currently not visible
 * @return {boolean} True if node is hidden.
 */
lime.Node.prototype.getHidden = function() {
    return this.hidden_;
};
/**
 * Sets if element is visible or not
 * @param {boolean} value Hide(true) or show(false).
 * @return {lime.Node} object itself.
 */
lime.Node.prototype.setHidden = function(value) {
    this.hidden_ = value;
    this.setDirty(lime.Dirty.VISIBILITY);
    this.autoHide_ = 0;
    return this;
};

/**
 * Returns elements dimension
 * @return {goog.math.Size} Current element dimensions.
 */
lime.Node.prototype.getSize = function() {
    return this.size_;
};

/**
 * Sets dimensions for element. This funciton also
 * accepts 2 numbers: width,height
 * @param {goog.math.Size} value Elements new size.
 * @return {lime.Node} object itself.
 */
lime.Node.prototype.setSize = function(value) {
    var oldSize = this.size_, newval;
    if (arguments.length == 2) {
        newval = new goog.math.Size(arguments[0], arguments[1]);
    }
    else {
        newval = value;
    }
    //todo:clear this mess
    var ap2 = this.getAnchorPoint();
   if (oldSize && this.children_.length) {
        for (var i = 0; i < this.children_.length; i++) {
            var c = this.children_[i];
            if (c.getAutoResize) {
                var ar = c.getAutoResize();
                if (ar == lime.AutoResize.NONE) continue;
                var b = c.getBoundingBox();
                var fixed = oldSize.width;
                var c1 = b.left + ap2.x * oldSize.width;
                var c2 = b.right - b.left;
                var c3 = fixed - b.right - ap2.x * oldSize.width;
                if (ar & lime.AutoResize.LEFT) fixed -= c1;
                if (ar & lime.AutoResize.WIDTH) fixed -= c2;
                if (ar & lime.AutoResize.RIGHT) fixed -= c3;
                if (fixed != oldSize.width) {
                    var scale = (newval.width - fixed) /
                        (oldSize.width - fixed);
                    if (ar & lime.AutoResize.LEFT) c1 *= scale;
                    if (ar & lime.AutoResize.WIDTH) c2 *= scale;
                }
                fixed = oldSize.height;
                var r1 = b.top + ap2.y * oldSize.height;
                var r2 = b.bottom - b.top;
                var r3 = fixed - b.bottom - ap2.y * oldSize.height;
                if (ar & lime.AutoResize.TOP) fixed -= r1;
                if (ar & lime.AutoResize.HEIGHT) fixed -= r2;
                if (ar & lime.AutoResize.BOTTOM) fixed -= r3;
                if (fixed != oldSize.height) {
                    scale = (newval.height - fixed) /
                        (oldSize.height - fixed);
                    if (ar & lime.AutoResize.TOP) r1 *= scale;
                    if (ar & lime.AutoResize.HEIGHT) r2 *= scale;
                }

                var ap = c.getAnchorPoint();
                c.setSize(c2, r2);
                c.setPosition(c1 + ap.x * c2 - ap2.x * newval.width,
                              r1 + ap.y * r2 - ap2.y * newval.height);
            }

        }

    }
    this.size_ = newval;
    return this.setDirty(lime.Dirty.SCALE);
};

/**
 * Returns elements quality value.
 * @return {number} Quality value.
 */
lime.Node.prototype.getQuality = function() {
    return this.quality_;
};
/**
 * Sets quality value used while drawing. Not all rendermodes can draw
 * more effectively on lower quality. 1.0 full quality, 0.5 half quality.
 * Setting this walue larger than 1.0 almost never does anything good.
 * @param {number} value New quality value.
 * @return {lime.Node} object itself.
 */
lime.Node.prototype.setQuality = function(value) {
    if (this.quality_ != value) {
        this.quality_ = value;
        this.setDirty(lime.Dirty.SCALE);
        this.calcRelativeQuality();
    }
    return this;
};


/**
 * Calculates relative quality change from the
 * parent objects quality
 */
lime.Node.prototype.calcRelativeQuality = function() {
    var rq = goog.isDef(this.relativeQuality_) ?
        this.relativeQuality_ : this.quality_;

    if (this.parent_ && this.parent_.relativeQuality_)
        rq = this.quality_ * this.parent_.relativeQuality_;

    if (rq != this.relativeQuality_) {
        this.relativeQuality_ = rq;
        for (var i = 0, child; child = this.children_[i]; i++) {
            if (child instanceof lime.Node)
            child.calcRelativeQuality();
        }
        this.setDirty(lime.Dirty.SCALE);
    }
};

/**
 * Returns autoresize rules bitmask.
 * @return {number} Autoresize bitmask.
 */
lime.Node.prototype.getAutoResize = function() {
    return this.autoResize_;
};
/**
 * Sets new autoresixe rules. NOT IMPLEMENTED!
 * @param {number} value New autoresize bitmask.
 * @return {lime.Node} object itself.
 */
lime.Node.prototype.setAutoResize = function(value) {
    this.autoResize_ = value;
    return this.setDirty(lime.Dirty.ALL);
};


/**
 * Convert screen coordinate to node coordinate space
 * @param {goog.math.Coordinate} coord Screen coordinate.
 * @return {goog.math.Coordinate} Local coordinate.
 */
lime.Node.prototype.screenToLocal = function(coord) {
    if (!this.inTree_) return coord;
    var coord = this.getParent().screenToLocal(coord);

    return this.parentToLocal(coord);
};

/**
 * Covert coordinate form parent node space to
 * current node space
 * @param {goog.math.Coordinate} coord Parent coordinate.
 * @return {goog.math.Coordinate} Local coordinate.
 */
lime.Node.prototype.parentToLocal = function(coord) {
    if (!this.getParent()) return;

    coord.x -= this.position_.x;
    coord.y -= this.position_.y;

    coord.x /= this.scale_.x;
    coord.y /= this.scale_.y;

    if (this.rotation_ != 0) {
        var c2 = coord.clone(),
            rot = this.rotation_ * Math.PI / 180,
            cos = Math.cos(rot),
            sin = Math.sin(rot);
        coord.x = cos * c2.x - sin * c2.y;
        coord.y = cos * c2.y + sin * c2.x;
    }

    return coord;
};

/**
 * Convert coordinate in node space to screen coordinate
 * @param {goog.math.Coordinate} coord Local coordinate.
 * @return {goog.math.Coordinate} Screen coordinate.
 */
lime.Node.prototype.localToScreen = function(coord) {
    if (!this.inTree_) return coord;

    return this.getParent().localToScreen(this.localToParent(coord));
};

/**
 * Convert coordinate from current node space to
 * parent node space
 * @param {goog.math.Coordinate} coord Local coordinate.
 * @return {goog.math.Coordinate} Parent coordinate.
 */
lime.Node.prototype.localToParent = function(coord) {
    if (!this.getParent()) return coord;
    var coord = coord.clone();

    if (this.rotation_ != 0) {
        var c2 = coord.clone(),
            rot = -this.rotation_ * Math.PI / 180,
            cos = Math.cos(rot),
            sin = Math.sin(rot);
        coord.x = cos * c2.x - sin * c2.y;
        coord.y = cos * c2.y + sin * c2.x;
    }

    coord.x *= this.scale_.x;
    coord.y *= this.scale_.y;

    coord.x += this.position_.x;
    coord.y += this.position_.y;

    return coord;
};

/**
 * Convert coordinate in node space to other nodes coordinate space
 * @param {goog.math.Coordinate} coord Local coordinate.
 * @param {lime.Node} node Node for new coordinate space.
 * @return {goog.math.Coordinate} Coordinate in node space.
 */
lime.Node.prototype.localToNode = function(coord, node) {
    // Todo: this can be optimized.
    // maybe with goog.dom.findCommonAncestor but probably even more
    if (!this.inTree_) return coord;
    return node.screenToLocal(this.localToScreen(coord));

};

/**
 * Returns the opacity value of the Node. 0.0=100% trasparent, 1.0=100% opaque
 * @return {number} Opacity value.
 */
lime.Node.prototype.getOpacity = function() {
    return this.opacity_;
};

/**
 * Sets the opacity value of the Node object
 * @param {number} value New opacity value(0-1).
 * @return {lime.Node} The node object itself.
 */
lime.Node.prototype.setOpacity = function(value) {
    this.opacity_ = value;

    var hidden = this.getHidden();
    if (this.opacity_ == 0 && !hidden) {
        this.setHidden(true);
        this.autoHide_ = 1;
    }
    else if (this.opacity_ != 0 && hidden && this.autoHide_) {
        this.setHidden(false);
    }

    if (goog.isDef(this.transitionsActive_[lime.Transition.OPACITY]))
        return this;

    this.setDirty(lime.Dirty.ALPHA);
    return this;
};


/**
 * Create DOM element to render the node
 */
lime.Node.prototype.createDomElement = function() {

    var newTagName =
        this.renderer.getType() == lime.Renderer.CANVAS ? 'canvas' : 'div';
    var create = function() {
        this.domElement = this.rootElement =
            this.containerElement = goog.dom.createDom(newTagName);
        if (this.domClassName)
            goog.dom.classes.add(this.domElement, this.domClassName);
        this.dirty_ |= ~0;
    };

    if (this.domElement) {
        var curtag = this.domElement.tagName.toLowerCase();
        if (curtag != newTagName) {
            var oldEl = this.rootElement;
            create.call(this);
            if (oldEl.parentNode)
                oldEl.parentNode.replaceChild(this.rootElement, oldEl);
            //return true;
        }
    }
    else {
        create.call(this);
        //return true;
    }

};

/**
 * Update DOM element connected to the node
 */
lime.Node.prototype.updateDomElement = function() {
    if (this.needsDomElement()) {
        this.createDomElement();
    }
    else {
        this.removeDomElement();
    }
    //return false;
};

/**
 * Remove DOM element connected to teh node
 */
lime.Node.prototype.removeDomElement = function() {
    if (this.rootElement) {
        goog.dom.removeNode(this.rootElement);
        delete this.domElement;
        delete this.rootElement;
        delete this.containerElement;
        //return true;
    }
};

/**
 * Update node's layout (tree relations)
 */
lime.Node.prototype.updateLayout = function() {
   // debugger;
    this.dirty_ &= ~lime.Dirty.LAYOUT;
    //var didupdate = this.updateDomElement();
    this.updateDomElement();

    if (this.parent_ && (this.parent_.dirty_ & lime.Dirty.LAYOUT)) {
        this.parent_.updateLayout();
        return;
    }

    if (this.needsDomElement()) {

        for (var i = 0, child; child = this.children_[i]; i++) {
            if (child instanceof lime.Node)
            child.updateLayout();
        }

        this.renderer.updateLayout.call(this);

    }

};

/**
 * Update modified dirty parameters to visible elements properties
 * @param {number} opt_pass Pass number.
 */
lime.Node.prototype.update = function(opt_pass) {
 // if (!this.renderer) return;
   var pass = opt_pass || 0;

   var uid = goog.getUid(this);
   if (this.dirty_ & lime.Dirty.LAYOUT) {
       this.updateLayout();
   }
    
   var do_draw = this.renderer.getType() == lime.Renderer.DOM || pass;

    if (do_draw) {
        
        //clear transitions in the queue
        for (var i in this.transitionsClear_) {
            delete this.transitionsActive_[i];
            delete this.transitionsActiveSet_[i];
            property = lime.Node.getPropertyForTransition(i);
            lime.style.clearTransition(this.domElement, property);
            if (this.domElement != this.containerElement) {
                lime.style.clearTransition(this.continerElement, property);
            }
        }
        
        // predraw is a check that elements are correctly drawn before the
        // transition. if not then transition is started in the next frame not now.
        var only_predraw = 0;
        for (i in this.transitionsAdd_) {
            var value = this.transitionsAdd_[i];
            
            // 3rd is an "already_activated" flag
            if (!value[3]) {
                value[3] = 1;
                
            if (i == lime.Transition.POSITION &&
                this.positionDrawn_ != this.position_) {
                 this.setDirty(lime.Dirty.POSITION, 0, true);
                 only_predraw = 1;
            }

            if (i == lime.Transition.SCALE &&
                this.scaleDrawn_ != this.scale_) {
                this.setDirty(lime.Dirty.SCALE, 0, true);
                only_predraw = 1;
            }

            if (i == lime.Transition.OPACITY &&
                this.opacityDrawn_ != this.opacity_) {
                this.setDirty(lime.Dirty.ALPHA, 0, true);
                only_predraw = 1;
            }
            if (i == lime.Transition.ROTATION &&
                this.rotationDrawn_ != this.rotation_) {
                this.setDirty(lime.Dirty.ROTATION, 0, true);
                only_predraw = 1;
            }

            }
        }
        
        // activate the transitions
        if(!only_predraw)
        for (i in this.transitionsAdd_) {
            value = this.transitionsAdd_[i];
            var property = lime.Node.getPropertyForTransition(i);
            
            this.transitionsActive_[i] = value[0];
            lime.style.setTransition(this.domElement,
                property, value[1], value[2]);

            if (this.domElement != this.containerElement &&
                property == lime.style.transformProperty) {

                lime.style.setTransition(this.containerElement,
                    property, value[1], value[2]);

            }
            delete this.transitionsAdd_[i];
        }

        // cache last drawn values to for predraw check
        this.positionDrawn_ = this.position_;
        this.scaleDrawn_ = this.scale_;
        this.opacityDrawn_ = this.opacity_;
        this.rotationDrawn_ = this.rotation_;


        this.transitionsClear_ = {};

    }


    if (pass) {
        this.renderer.drawCanvas.call(this);
    }
    else {
        if (this.renderer.getType() == lime.Renderer.CANVAS) {
            var parent = this.getDeepestParentWithDom();
            parent.redraw_ = 1;
            if (parent == this && this.dirty_ == lime.Dirty.POSITION) {
                parent.redraw_ = 0;
            }
            lime.setObjectDirty(this.getDeepestParentWithDom(), 1);
        }
        
        // dom draw happens here
        this.renderer.update.call(this);

    }
    
    // set flags that transitions have been draw.
    if(do_draw)
    for (i in this.transitionsActive_) {
        if (this.transitionsActive_[i]) {
            this.transitionsActiveSet_[i] = true;
        }
    }

    //clear dirty
    this.setDirty(0, pass);

};

/**
 * Return CSS property name for transition constant
 * @param {number} transition Transition constant.
 * @return {string} Property name.
 */
lime.Node.getPropertyForTransition = function(transition) {
    return transition == lime.Transition.OPACITY ?
        'opacity' : lime.style.transformProperty;
};


/**
 * Return the parent object. Returns null in not in tree
 * @return {lime.Node} Parent node.
 */
lime.Node.prototype.getParent = function() {
    return this.parent_ ? this.parent_ : null;
};

/**
 * Append element to the end of childrens array
 * @param {lime.Node|domElement} child Child node.
 * @param {number} opt_pos Position of new child.
 * @return {lime.Node} obejct itself.
 */
lime.Node.prototype.appendChild = function(child, opt_pos) {
    child.parent_ = this;
    if (opt_pos == undefined) {
        this.children_.push(child);
    }
    else {
        goog.array.insertAt(this.children_, child, opt_pos);
    }
    if (this.renderer.getType() != lime.Renderer.DOM) {

        child.setRenderer(this.renderer.getType());
    }
    if (child instanceof lime.Node) {
        child.calcRelativeQuality();
        if (this.inTree_) child.wasAddedToTree();
    }
    return this.setDirty(lime.Dirty.LAYOUT);
};

/**
 * Remove element from the childrens array
 * @param {lime.Node|domElement} child Child node.
 * @return {lime.Node} object itself.
 */
lime.Node.prototype.removeChild = function(child) {
    if (this.inTree_) child.wasRemovedFromTree();
    child.removeDomElement();
    child.parent_ = null;
    this.children_.splice(this.children_.indexOf(child), 1);
    return this.setDirty(lime.Dirty.LAYOUT);
};

/**
 * @inheritDoc
 */
lime.Node.prototype.addEventListener = function(type, handler, 
        opt_capture, opt_handlerScope) {

    // Bypass all mouse events on touchscreen devices
    if (lime.userAgent.SUPPORTS_TOUCH &&
        type.substring(0, 5) == 'mouse') return;

    // First element defines if events are registered with DOM 1=yes/0=no
    // Second element defines how many listeners have been set
    if (!goog.isDef(this.eventHandlers_[type])) {
        this.eventHandlers_[type] = [0, 0];
    }

    if (this.inTree_ && this.eventHandlers_[type][0] == 0) {
        this.eventHandlers_[type][0] = 1;
        this.getDirector().eventDispatcher.register(this, type);
    }
    this.eventHandlers_[type][1]++;

};

/**
 * @inheritDoc
 */
lime.Node.prototype.removeEventListener = function(
    type, handler, opt_capture, opt_handlerScope) {

    // Bypass all mouse events on touchscreen devices
    if (lime.userAgent.SUPPORTS_TOUCH &&
        type.substring(0, 5) == 'mouse') return;

    if (this.inTree_ && this.eventHandlers_[type][1] == 1) {
        this.eventHandlers_[type][0] = 0;
        this.getDirector().eventDispatcher.release(this, type);
    }
    this.eventHandlers_[type][1]--;
    if (!this.eventHandlers_[type][1]) delete this.eventHandlers_[type];

};

/**
 * Return the Director instance related to the node.
 * Returns null if no director connection.
 * @return {lime.Director} Current director.
 */
lime.Node.prototype.getDirector = function() {
     if (!this.inTree_) return null;

     return this.director_;
};

/**
 * Returns the Scene instance related to the node.
 * Returns null if no scene connection.
 * @return {lime.Scene} Current scene.
 */
lime.Node.prototype.getScene = function() {
    if (!this.inTree_) return null;

    return this.scene_;
};

/**
 * Handle removing Node from DOM tree
 */
lime.Node.prototype.wasRemovedFromTree = function() {

    // Call remove for all children
    for (var i = 0; child = this.children_[i]; i++) {
        if (child instanceof lime.Node) {
            child.wasRemovedFromTree();
        }
    }
    // Unregister Event listeners
    for (var type in this.eventHandlers_) {
        this.eventHandlers_[type][0] = 0;

       if (!this.getDirector()) debugger;
        this.getDirector().eventDispatcher.release(this, type);
    }

    this.inTree_ = false;
    this.director_ = null;
    this.scene_ = null;
};

/**
 * Handle adding Node to the DOM tree
 */
lime.Node.prototype.wasAddedToTree = function() {
    this.inTree_ = true;
    this.director_ = this.parent_.getDirector();
    this.scene_ = this.parent_.getScene();

    // Notify all children
    for (var i = 0, child; child = this.children_[i]; i++) {
        if (child instanceof lime.Node) {
            child.wasAddedToTree();
        }
    }
    // Register Event Listeners
    for (var type in this.eventHandlers_) {
        this.eventHandlers_[type][0] = 1;
        this.getDirector().eventDispatcher.register(this, type);
    }
};

/**
 * Returns bounding box for element is elements own coordinate space
 * @return {goog.math.Box} Contents frame in node space.
 */
lime.Node.prototype.getFrame = function() {
    var s = this.getSize(), a = this.getAnchorPoint();

    return new goog.math.Box(
        -s.height * a.y,        //top
        s.width * (1 - a.x),    //right
        s.height * (1 - a.y),   //bottom
        -s.width * a.x          //left
        );
};

/**
 * Returns bounding box for element in parents coordinate space.
 * @param {goog.math.Bpx} opt_frame Optional frame box for element.
 * @return {goog.math.Box} Bounding box.
 */
lime.Node.prototype.getBoundingBox = function(opt_frame) {
    var frame = opt_frame || this.getFrame();
    var tl = new goog.math.Coordinate(frame.left, frame.top);
    var tr = new goog.math.Coordinate(frame.right, frame.top);
    var bl = new goog.math.Coordinate(frame.left, frame.bottom);
    var br = new goog.math.Coordinate(frame.right, frame.bottom);

    tl = this.localToParent(tl);
    tr = this.localToParent(tr);
    bl = this.localToParent(bl);
    br = this.localToParent(br);

    return new goog.math.Box(
        Math.floor(Math.min(tl.y, tr.y, bl.y, br.y)),
        Math.ceil(Math.max(tl.x, tr.x, bl.x, br.x)),
        Math.ceil(Math.max(tl.y, tr.y, bl.y, br.y)),
        Math.floor(Math.min(tl.x, tr.x, bl.x, br.x))
    );

};

/**
 * Return box containing current element and all its children
 * @return {goog.math.Box} Bounding box.
 */
lime.Node.prototype.measureContents = function() {

    var frame = this.getFrame();
    if (frame.left == frame.right && this.children_.length) {
        frame = this.children_[0].getBoundingBox(
                    this.children_[0].measureContents());
    }


    for (var i = 0, child; child = this.children_[i]; i++) {
        if (child.isMask != 1)
        frame.expandToInclude(child.getBoundingBox(child.measureContents()));
    }

    return frame;

};

/**
 * Register transition property. Use through animations.
 * @param {number} property Transition property constant.
 * @param {mixed} value New value.
 * @param {number} duration Transition duration.
 * @param {Array.<mixed>} ease Easing function.
 */
lime.Node.prototype.addTransition = function(property, value, duration, ease) {
    this.transitionsAdd_[property] = [value, duration, ease, 0];
};

/**
 * Clear previously set transition
 * @param {number} property Transition property.
 */
lime.Node.prototype.clearTransition = function(property) {
    this.transitionsClear_[property] = 1;
};

/**
 * Checks if event should fire on element based on the position.
 * Before returning true this function should set the position property
 * of the event to the hit position in elements coordinate space
 * @param {lime.Event} e Event object.
 * @return {boolean} If node should handle the event.
 */
lime.Node.prototype.hitTest = function(e) {
    var coord = this.screenToLocal(e.screenPosition);
    if (this.getFrame().contains(coord)) {
        e.position = coord;
        return true;
    }
    return false;
};

/**
 * Add Node to action targets list and start the animation
 * @param {lime.Animation} action Animation to run.
 */
lime.Node.prototype.runAction = function(action) {
    action.addTarget(this);
    action.play();
};
