(function() {
  
  var currentRatio = calculateRatio();
  var listeners = [];
  
  function addListener(f) {
    listeners.push(f);
  }
  
  function calculateRatio() {
    // TODO: here, do something to detect browser zoom.
    return window.devicePixelRatio || 1;
  }
  
  function getRatio() {
    return currentRatio;
  }
  
  function removeListener(f) {
    var idx = listeners.indexOf(f);
    if (idx >= 0) {
      listeners.splice(idx, 1);
    }
  }
  
  function update() {
    var rat = calculateRatio();
    if (rat === currentRatio) {
      return;
    }
    
    // The ratio has changed.
    currentRatio = rat;
    
    // Call each listener.
    // NOTE: we copy the listeners because any given listener could remove/add
    // listeners as it pleases.
    var theListeners = listeners.slice();
    for (var i = 0, len = theListeners.length; i < len; ++i) {
      theListeners[i]();
    }
  }
  
  window.crystal = {
    addListener: addListener,
    getRatio: getRatio,
    removeListener: removeListener
  };
  
  setInterval(update, 250);
  
})();