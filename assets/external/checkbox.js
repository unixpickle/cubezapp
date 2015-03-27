(function() {
  
  var ANIMATION_DURATION = 150;
  
  // This is the leftmost point of the checkmark.
  var P1 = [0.2, 0.5];
  
  // This is the elbow of the checkmark.
  var P2 = [0.4, 0.7];
  
  // This is the rightmost tip of the checkmark
  var P3 = [0.85, 0.25];
  
  function Checkbox(size, color, checked) {
    this._color = color;
    this._size = size;
    this._canvas = document.createElement('canvas');
    this._element = document.createElement('div');
    this._element.appendChild(this._canvas);
    this._element.style.width = size + 'px';
    this._element.style.height = size + 'px';
    this._element.style.display = 'inline-block';
    this._element.onclick = function() {
      this.setChecked(!this.checked());
      if ('function' === this.onChange) {
        this.onChange();
      }
    }.bind(this);
    this._element.onmousedown = function() {
      this._state.pressed = true;
      this._draw();
    }.bind(this);
    this._element.onmouseup = function() {
      this._state.pressed = false;
      this._draw();
    }.bind(this);
    
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    
    // The state helps us with animating changes.
    this._state = new State({
      checked: checked || false,
      pressed: false,
      animatingCheck: false,
      animatingColor: false,
      colorStart: null,
      animationStart: 0
    });
    this._waitingUpdate = false;
    
    // This stuff is used to support crystal.
    this._crystalCb = this._updateResolution.bind(this);
    this._removedInterval = null;
    
    // Make sure the resolution is accurate and then draw the initial state.
    this._updateResolution();
    
    // Callback event.
    this.onChange = null;
  }
  
  // checked returns the checked state of the checkbox.
  Checkbox.prototype.checked = function() {
    return this._state.checked;
  };
  
  // element returns an element for the checkbox. You must call this every time
  // you add the checkbox to the DOM. You should add the returned element to the
  // DOM immediately after calling element() or else it may not be updated for
  // the DPI correctly.
  Checkbox.prototype.element = function() {
    this._startListening();
    return this._element;
  };
  
  // setChecked will change the state of the checkbox.
  Checkbox.prototype.setChecked = function(checked) {
    if (checked === this._state.checked) {
      return;
    }
        
    // If the opposite check animation was running, we jump-start this one.
    if (this._state.animatingCheck) {
      var now = new Date().getTime();
      var missed = ANIMATION_DURATION - (now - this._state.animationStart);
      if (missed > 0) {
        now -= missed;
      }
      this._state.animationStart = now;
    } else {
      this._state.animationStart = new Date().getTime();
    }
    
    this._state.checked = checked;
    this._state.animatingColor = false;
    this._state.animatingCheck = true;
    this._draw();
  };
  
  // setColor will change the coloration of the checkbox.
  Checkbox.prototype.setColor = function(color) {
    this._state.colorStart = this._color;
    this._state.animatingColor = true;
    this._state.animatingCheck = false;
    this._state.animationStart = new Date().getTime();
    this._color = color;
    this._draw();
  };
  
  // _checkForRemoval unsubscribes to crystal if the element is not in the DOM.
  Checkbox.prototype._checkForRemoval = function() {
    if (this._removedInterval !== null && !document.contains(this._element)) {
      this._stopListening();
    }
  };
  
  // _draw re-draws the checkbox in it's current state.
  Checkbox.prototype._draw = function() {
    var size = this._canvas.width;
    var context = this._canvas.getContext('2d');
    
    context.clearRect(0, 0, size, size);
    
    // Calculate the percentage of the current animation.
    var amountChecked = this._state.checked ? 1 : 0;
    var color = this._color;
    if (this._state.animatingCheck || this._state.animatingColor) {
      var elapsed = new Date().getTime() - this._state.animationStart;
      var pct = Math.min(Math.max(elapsed / ANIMATION_DURATION, 0), 1);
      if (this._state.animatingCheck) {
        if (this._state.checked) {
          amountChecked = pct;
        } else {
          amountChecked = 1 - pct;
        }
      } else {
        color = [];
        for (var i = 0; i < 3; ++i) {
          color[i] = (this._color[i]-this._state.colorStart[i])*pct +
            this._state.colorStart[i];
        }
      }
      if (pct < 1) {
        this._requestFrame();
      } else {
        this._state.animatingCheck = false;
        this._state.animatingColor = false;
      }
    }
    
    // Draw the bounding rectangle.
    var boxThickness = Math.floor(size/20);
    context.strokeStyle = this._state.pressed ? '#777777' : '#999999';
    context.lineWidth = boxThickness;
    if (1 || amountChecked) {
      context.strokeRect(boxThickness, boxThickness, size-boxThickness*2,
        size-boxThickness*2);
    }
    
    context.strokeStyle = 'rgba(' + Math.floor(color[0]*255) + ', ' +
      Math.floor(color[1]*255) + ', ' + Math.floor(color[2]*255) + ', 1.0)';
    context.lineWidth = size/10;
    
    // Draw the percentage of the checkbox that's done.
    var firstLength = P2[0] - P1[0];
    var secondLength = P3[0] - P2[0];
    var lengthCovered = amountChecked * (firstLength+secondLength);
    if (amountChecked === 1 || lengthCovered >= firstLength) {
      // Completely draw the first line.
      context.beginPath();
      context.moveTo(P1[0]*size, P1[1]*size);
      context.lineTo(P2[0]*size, P2[1]*size);
      if (amountChecked === 1 || lengthCovered > firstLength) {
        // At least partially draw the second line.
        var pct = (lengthCovered-firstLength)/secondLength;
        context.lineTo((P2[0] + (P3[0]-P2[0])*pct)*size,
          (P2[1] + (P3[1]-P2[1])*pct)*size);
      }
      context.stroke();
    } else if (lengthCovered > 0) {
      // Partially draw the first line.
      context.beginPath();
      var pct = lengthCovered/firstLength;
      context.moveTo(P1[0]*size, P1[1]*size);
      context.lineTo((P1[0] + (P2[0]-P1[0])*pct)*size,
        (P1[1] + (P2[1]-P1[1])*pct)*size);
      context.stroke();
    }
  };
  
  Checkbox.prototype._requestFrame = function() {
    // Make sure we have no overlapping update requests.
    if (this._waitingUpdate) {
      return;
    }
    this._waitingUpdate = true;
    
    if ('function' === typeof window.requestAnimationFrame) {
      window.requestAnimationFrame(function() {
        this._waitingUpdate = false;
        this._draw();
      }.bind(this));
    } else {
      setTimeout(function() {
        this._waitingUpdate = false;
        this._draw();
      }.bind(this), 1000/60);
    }
  };
  
  Checkbox.prototype._startListening = function() {
    if (this._removedInterval !== null) {
      return;
    }
    // Every 10 seconds, see if the element was removed from the DOM. If it was,
    // stop listening for crystal changes.
    this._removedInterval = setInterval(this._checkForRemoval.bind(this),
      10000);
    window.crystal.addListener(this._crystalCb);
  };
  
  Checkbox.prototype._stopListening = function() {
    if (this._removedInterval === null) {
      return;
    }
    window.crystal.removeListener(this._crystalCb);
    clearInterval(this._removedInterval);
    this._removedInterval = null;
  };
  
  Checkbox.prototype._updateResolution = function() {
    var ratio = window.crystal.getRatio();
    this._canvas.width = Math.round(ratio * this._size);
    this._canvas.height = Math.round(ratio * this._size)
    this._draw();
    this._checkForRemoval();
  };
  
  function State(attrs) {
    this.pressed = attrs.pressed;
    this.checked = attrs.checked;
    this.animatingCheck = attrs.animatingCheck;
    this.animatingColor = attrs.animatingColor;
    this.colorStart = attrs.colorStart;
    this.animationStart = attrs.animationStart;
  }
  
  window.checkboxjs = {
    Checkbox: Checkbox
  };
  
})();