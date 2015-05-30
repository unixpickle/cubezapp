// clickthru.js version 0.0.1
(function() {

  var listeners = [];
  var isListening = false;

  function ClickThruEvent(event) {
    this.event = event;
  }

  ClickThruEvent.prototype.inElement = function(e) {
    var boundingRect = e.getBoundingClientRect();
    var x = this.event.clientX;
    var y = this.event.clientY;
    return x >= boundingRect.left && x <= boundingRect.right &&
      y >= boundingRect.top && y <= boundingRect.bottom;
  };

  function callback(e) {
    var event = new ClickThruEvent(e);
    var theListeners = listeners.slice();
    for (var i = 0, len = theListeners.length; i < len; ++i) {
      theListeners[i](event);
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
