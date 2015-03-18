(function() {
  
  // This is an exhaustive list of every animation attribute that an animator
  // can animate.
  var attributes = [
    'footerClosedness', 'footerHeight', 'footerOffset', 'footerOpacity',
    'headerOffset', 'headerOpacity',
    'memoOpacity',
    'pbOpacity',
    'scrambleOpacity',
    'timeOpacity', 'timeScale', 'timeSize', 'timeY'
  ];
  
  // An Animation performs a curve-based animation of a numeric value.
  function Animation(start, end, duration, delay, curve) {
    this.start = start;
    this.end = end;
    this.duration = duration || 0.4;
    this.delay = delay || 0;
    this.curve = curve || defaultCurve();
    this.timestamp = new Date().getTime();
    this._done = false;
  }
  
  // current returns the current value for the animating value.
  Animation.prototype.current = function() {
    var elapsed = new Date().getTime() - this.timestamp;
    var fraction = Math.max((elapsed/this.duration)-this.delay, 0);
    if (fraction >= 1) {
      this._done = true;
      fraction = 1;
    }
    return this.start + (this.end-this.start)*this.curve(fraction);
  };
  
  // done returns true if the animation is complete. The value returned is
  // updated whenever current() is called.
  Animation.prototype.done = function() {
    this._done;
  };
  
  // An Animator performs a set of animations.
  function Animator() {
    this._animations = {};
    this._current = {};
    this._done = true;
    for (var i = 0, len = attributes.length; i < len; ++i) {
      this._animations[attributes[i]] = null;
      this._current[attributes[i]] = 0;
    }
  }
  
  // animateAttribute starts an animation to transition an attribute to a given
  // value.
  // The duration, delay and curve arguments are optional.
  Animator.prototype.animateAttribute = function(attr, dest, duration, delay,
      curve) {
    this._animations[attr] = new Animation(this._current[attr], dest,
      duration, delay, curve);
    this._done = false;
  };
  
  // current returns an object with all the animation attributes for the current
  // frame.
  Animator.prototype.current = function() {
    // Update the current state based on animations.
    this._done = true;
    for (var i = 0, len = attributes.length; i < len; ++i) {
      var attr = attributes[i];
      var animation = this._animations[attr];
      if (animation !== null) {
        this._current = animation.current();
        if (animation.done()) {
          this._animations[attr] = null;
        } else {
          this._done = false;
        }
      }
    }
    
    // Return the current state.
    return this._current;
  };
  
  // done returns true if there are no active animations.
  Animator.prototype.done = function() {
    return this._done;
  };
  
  // setAttribute sets a value for a given attribute without animating it.
  // If the attribute was already being animated, the given value is set as the
  // destination for the existing animation.
  Animator.prototype.setAttribute = function(attr, val) {
    var animation = this._animations[attr];
    if (animation !== null) {
      animation.end = val;
    } else {
      this._current[attr] = val;
    }
  };
  
  function defaultCurve() {
    return function(x) {
      return x;
    };
  }
  
  window.app.Animator = Animator;
  
})();