(function() {

  // ANIMATION_DURATION is the amount of time it takes for the checkbox to fill
  // in.
  var ANIMATION_DURATION = 150;

  // CHECKBOX_SIZE is the width/height of the checkbox canvas in pixels.
  var CHECKBOX_SIZE = 18;

  // BORDER_COLOR is the color of the border when the checkbox is not clicked.
  var BORDER_COLOR = '#d5d5d5';

  // PRESSED_BORDER is the color of the border when the checkbox is pressed.
  var PRESSED_BORDER = '#d5d5d5';

  // BORDER_THICKNESS is the number of pixels the border should be.
  var BORDER_THICKNESS = 2;

  // This is the leftmost point of the checkmark.
  var P1 = [2, 10];

  // This is the elbow of the checkmark.
  var P2 = [7, 15];

  // This is the rightmost tip of the checkmark
  var P3 = [16, 4];

  function Checkbox(color, checked) {
    this._color = color;
    this._canvas = document.createElement('canvas');
    this._element = document.createElement('div');
    this._element.appendChild(this._canvas);
    this._element.style.width = CHECKBOX_SIZE + 'px';
    this._element.style.height = CHECKBOX_SIZE + 'px';
    this._element.style.border = BORDER_THICKNESS + 'px solid ' + BORDER_COLOR;
    this._element.style.backgroundColor = 'white';
    this._element.style.display = 'inline-block';
    this._element.style.cursor = 'pointer';

    // Clicking changes the checkbox.
    this._element.onclick = function() {
      this.setChecked(!this.checked());
      if ('function' === typeof this.onChange) {
        this.onChange();
      }
    }.bind(this);

    // Change the border color when clicked.
    this._element.onmousedown = function() {
      this._element.style.border = BORDER_THICKNESS + 'px solid ' +
        PRESSED_BORDER;
    }.bind(this);
    this._element.onmouseup = function() {
      this._element.style.border = BORDER_THICKNESS + 'px solid ' +
        BORDER_COLOR;
    }.bind(this);
    this._element.onmouseleave = function() {
      this._element.style.border = BORDER_THICKNESS + 'px solid ' +
        BORDER_COLOR;
    }.bind(this);

    // Make sure the canvas fills the element no matter what the pixel ratio is.
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';

    // The state helps us animate changes.
    this._state = new State({
      checked: checked || false,
      animatingCheck: false,
      animatingColor: false,
      colorStart: null,
      animationStart: 0
    });
    this._waitingUpdate = false;

    // This is used to support crystal.
    this._crystalCb = this._updateResolution.bind(this);
    this._visible = false;

    // Callback event.
    this.onChange = null;

    this._updateResolution();
  }

  // checked returns the checked state of the checkbox.
  Checkbox.prototype.checked = function() {
    return this._state.checked;
  };

  // element returns an element for the checkbox.
  Checkbox.prototype.element = function() {
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

  // setVisible sets whether the checkbox should check for crystal updates.
  Checkbox.prototype.setVisible = function(flag) {
    if (flag === this._visible) {
      return;
    }
    this._visible = flag;
    if (flag) {
      this._updateResolution();
      window.crystal.addListener(this._crystalCb);
    } else {
      window.crystal.removeListener(this._crystalCb);
    }
  }

  // _draw re-draws the checkbox in it's current state.
  Checkbox.prototype._draw = function() {
    var size = this._canvas.width;
    var context = this._canvas.getContext('2d');

    context.clearRect(0, 0, size, size);

    // Calculate the percentage of the current animation.
    var s = this._drawState();
    var amountChecked = s.amountChecked;
    var color = s.color;

    if (amountChecked === 0) {
      // There is nothing to draw.
      return;
    }

    // Setup drawing for the check mark.
    context.strokeStyle = 'rgba(' + Math.floor(color[0]*255) + ', ' +
      Math.floor(color[1]*255) + ', ' + Math.floor(color[2]*255) + ', 1.0)';
    context.lineWidth = 2 * size/CHECKBOX_SIZE;

    // Clip to the region of the checkmark that's complete.
    if (amountChecked !== 1) {
      context.save();
      context.beginPath();
      context.rect(0, 0, size*amountChecked, size);
      context.clip();
    }

    // Draw the checkmark as much as it's been completed.
    var scale = size/CHECKBOX_SIZE;
    context.beginPath();
    context.moveTo(P1[0]*scale, P1[1]*scale);
    context.lineTo(P2[0]*scale, P2[1]*scale);
    context.lineTo(P3[0]*scale, P3[1]*scale);
    context.stroke();
    context.closePath();

    if (amountChecked !== 1) {
      context.restore();
    }
  };

  // _drawState computes the current state to draw, taking animations into
  // account. This will request another animation frame if an animation is not
  // complete.
  Checkbox.prototype._drawState = function() {
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
    return {amountChecked: amountChecked, color: color};
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

  Checkbox.prototype._updateResolution = function() {
    var ratio = window.crystal.getRatio();
    this._canvas.width = Math.round(ratio * CHECKBOX_SIZE);
    this._canvas.height = Math.round(ratio * CHECKBOX_SIZE)
    this._draw();
  };

  function State(attrs) {
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
