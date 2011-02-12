goog.provide('lime.transitions.Dissolve');

goog.require('lime.animation.FadeTo');
goog.require('lime.transitions.Transition');

/**
 * Dissolve transition
 * @inheritDoc
 * @constructor
 */
lime.transitions.Dissolve = function(outgoing, incoming) {
    goog.base(this, outgoing, incoming);

};
goog.inherits(lime.transitions.Dissolve, lime.transitions.Transition);


/** @inheritDoc */
lime.transitions.Dissolve.prototype.start = function() {
    this.incoming_.setOpacity(0);

    var hide = new lime.animation.FadeTo(0).setDuration(this.getDuration()).enableOptimizations();

    goog.events.listen(hide, lime.animation.Event.STOP, function() {
        if (this.outgoing_) {
            this.outgoing_.setOpacity(1);
        }
    },false, this);

    if (this.outgoing_)
        this.outgoing_.runAction(hide);

    var show = new lime.animation.FadeTo(1).setDuration(this.getDuration());
    this.incoming_.runAction(show);

    goog.events.listen(show, lime.animation.Event.STOP,
        this.finish, false, this);


};



