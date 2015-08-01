(function() {

  function Keyboard() {
    this._handlers = [];
    this._down = {};

    $(document).keydown(this._keydown.bind(this));
    $(document).keypress(this._keypress.bind(this));
    $(document).keyup(this._keyup.bind(this));
  }

  Keyboard.prototype.pop = function() {
    this._handlers.pop();
  };

  Keyboard.prototype.push = function(handler) {
    this._handlers.push(handler);
  };

  Keyboard.prototype.remove = function(element) {
    var idx = this._handlers.indexOf(element);
    this._handlers.splice(idx, 1);
  };

  Keyboard.prototype._keydown = function(e) {
    // If the key is already down, it's repeated.
    if (this._down[e.which]) {
      e.repeat = true;
    } else {
      e.repeat = false;
      this._down[e.which] = true;
    }

    if (shouldIgnoreKeyEvent(e)) {
      return;
    }

    // Try each handler until one does not forward the event.
    for (var i = this._handlers.length - 1; i >= 0; --i) {
      var handler = this._handlers[i];
      if ('function' !== typeof handler.keydown) {
        break;
      }
      // If the handler returns true, the event should be passed up the stack.
      if (true !== handler.keydown(e)) {
        e.preventDefault();
        e.stopPropagation();
        break;
      }
    }
  };

  Keyboard.prototype._keypress = function(e) {
    if (shouldIgnoreKeyEvent(e)) {
      return;
    }

    // Try each handler until one does not forward the event.
    for (var i = this._handlers.length - 1; i >= 0; --i) {
      var handler = this._handlers[i];
      if ('function' !== typeof handler.keypress) {
        break;
      }
      // If the handler returns true, the event should be passed up the stack.
      if (true !== handler.keypress(e)) {
        e.preventDefault();
        e.stopPropagation();
        break;
      }
    }
  };

  Keyboard.prototype._keyup = function(e) {
    this._down[e.which] = false;

    if (shouldIgnoreKeyEvent(e)) {
      return;
    }

    // Try each handler until one does not forward the event.
    for (var i = this._handlers.length - 1; i >= 0; --i) {
      var handler = this._handlers[i];
      if ('function' !== typeof handler.keyup) {
        break;
      }
      // If the handler returns true, the event should be passed up the stack.
      if (true !== handler.keyup(e)) {
        e.preventDefault();
        e.stopPropagation();
        break;
      }
    }
  };

  function shouldIgnoreKeyEvent(e) {
    var $activeElement = $(document.activeElement);
    if ($activeElement.is('input')) {
      return e.which !== 13 && e.which !== 27;
    } else if ($activeElement.is('textarea')) {
      return e.which !== 27;
    }
  }

  window.app.keyboard = new Keyboard();

})();
