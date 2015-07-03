// clickthru.js version 0.0.2
(function() {

  var listeners = [];
  var isListening = false;

  function ClickThruEvent(event) {
    this.event = event;
    this._stopPropagation = false;
  }

  ClickThruEvent.prototype.inElement = function(e) {
    var boundingRect = e.getBoundingClientRect();
    var x = this.event.clientX;
    var y = this.event.clientY;
    return x >= boundingRect.left && x <= boundingRect.right &&
      y >= boundingRect.top && y <= boundingRect.bottom;
  };

  ClickThruEvent.prototype.stopClickThruPropagation = function() {
    this._stopPropagation = true;
  };

  function callback(e) {
    var event = new ClickThruEvent(e);
    var theListeners = listeners.slice();
    for (var i = theListeners.length-1; i >= 0; --i) {
      theListeners[i](event);
      if (event._stopPropagation) {
        break;
      }
    }
  }

  function addListener(listener) {
    if (listeners.length === 0) {
      startListening();
    }
    listeners.push(listener);
  }

  function removeListener(listener) {
    var index = listeners.indexOf(listener);
    if (index >= 0) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        stopListening();
      }
    }
  }

  function startListening() {
    if (document.body) {
      document.body.addEventListener('mousedown', callback, true);
      isListening = true;
    }
  }

  function stopListening() {
    if (document.body) {
      document.body.removeEventListener('mousedown', callback, true);
      isListening = false;
    }
  }

  window.clickthru = {
    addListener: addListener,
    removeListener: removeListener
  };

  window.addEventListener('load', function() {
    if (!isListening && listeners.length > 0) {
      startListening();
    }
  });

})();
