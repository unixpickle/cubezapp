(function() {

  var LAG_THRESHOLD = 200;
  var LAG_SMOOTH_TIME = 5;

  // This is an exhaustive list of every animation attribute that an animator
  // can animate.
  var attributes = [
    'footerClosedness', 'footerHeight', 'footerOffset', 'footerOpacity',
    'headerOffset', 'headerOpacity',
    'memoOpacity',
    'middleHeight', 'middleY',
    'pbOpacity',
    'scrambleOpacity',
    'timeSize', 'timeY'
  ];

  // An Animation performs a curve-based animation of a numeric value.
  function Animation(start, end, duration, delay, curve) {
    this.start = start;
    this.end = end;

    // Optional arguments.
    if ('number' === typeof duration) {
      this.duration = duration * 1000;
    } else {
      this.duration = 300;
    }
    if ('number' === typeof delay) {
      this.delay = delay * 1000;
    } else {
      this.delay = 0;
    }
    if ('function' === typeof curve) {
      this.curve = curve;
    } else {
      this.curve = defaultCurve;
    }

    this.timestamp = new Date().getTime();
    this.lastTimestamp = this.timestamp;
    this._done = false;
  }

  // current returns the current value for the animating value.
  Animation.prototype.current = function() {
    if (this.duration === 0) {
      this._done = true;
      return this.end;
    }

    var now = new Date().getTime();
    var frameDelay = now - this.lastTimestamp;
    this.lastTimestamp = now;
    if (frameDelay > LAG_THRESHOLD) {
      this.timestamp += frameDelay - LAG_SMOOTH_TIME;
    }

    var elapsed = now - this.timestamp;
    var fraction = Math.max((elapsed-this.delay)/this.duration, 0);
    if (fraction >= 1) {
      this._done = true;
      return this.end;
    }

    // Compute the intermediate value.
    return this.start + (this.end-this.start)*this.curve(fraction);
  };

  // done returns true if the animation is complete. The value returned is
  // updated whenever current() is called.
  Animation.prototype.done = function() {
    return this._done;
  };

  // An Animator performs a set of animations.
  function Animator() {
    this._animations = {};
    this._current = {};
    this._done = true;
    this.onAnimate = null;
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
    if (!this._current.hasOwnProperty(attr)) {
      throw new Error('unknown attribute: ' + attr);
    }
    this._animations[attr] = new Animation(this._current[attr], dest,
      duration, delay, curve);
    if (this._done) {
      this._done = false;
      this._requestAnimationFrame();
    }
  };

  Animator.prototype.animating = function() {
    return !this._done;
  };

  Animator.prototype.current = function() {
    return this._current;
  };

  // setAttribute sets a value for a given attribute without animating it.
  // If the attribute was already being animated, the given value is set as the
  // destination for the existing animation.
  Animator.prototype.setAttribute = function(attr, val) {
    if (!this._current.hasOwnProperty(attr)) {
      throw new Error('unknown attribute: ' + attr);
    } else if (isNaN(val)) {
      throw new Error('setting NaN attribute for: ' + attr);
    }
    var animation = this._animations[attr];
    if (animation !== null) {
      animation.end = val;
    } else {
      this._current[attr] = val;
    }
  };

  // setAttributes sets a bunch of values.
  Animator.prototype.setAttributes = function(map) {
    for (var key in map) {
      if (!map.hasOwnProperty(key)) {
        continue;
      }
      this.setAttribute(key, map[key]);
    }
  };

  Animator.prototype._refresh = function() {
    // Update the current state based on animations.
    this._done = true;
    for (var i = 0, len = attributes.length; i < len; ++i) {
      var attr = attributes[i];
      var animation = this._animations[attr];
      if (animation !== null) {
        this._current[attr] = animation.current();
        if (animation.done()) {
          this._animations[attr] = null;
        } else {
          this._done = false;
        }
      }
    }

    // Pass the current state to the callback if it's available.
    if ('function' === typeof this.onAnimate) {
      this.onAnimate(this._current);
    }
    if (!this._done) {
      this._requestAnimationFrame();
    }
  };

  Animator.prototype._requestAnimationFrame = function() {
    if ('function' === typeof window.requestAnimationFrame) {
      window.requestAnimationFrame(this._refresh.bind(this));
    } else {
      setTimeout(this._refresh.bind(this), 1000/60);
    }
  };

  function defaultCurve(x) {
    return 3*Math.pow(x, 2) - 2*Math.pow(x, 3);
  }

  window.app.Animator = Animator;

})();
