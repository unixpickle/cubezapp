(function() {
  
  function init() {
    initializeModel(function(latestSolve) {
      initializeView(latestSolve);
      initializeController();
    });
  }
  
  function initializeController() {
    // TODO: implement controllers!
  }
  
  function initializeModel(cb) {
    var store = new window.app.LocalStore();
    window.app.store = store;
    store.getSolves(0, 1, function(err, solves) {
      var latestSolve = null;
      if (!err && solves.length === 1) {
        latestSolve = solves[0];
      }
      cb(latestSolve);
    });
  }
  
  function initializeView(latestSolve) {
    window.app.windowSize = new window.app.WindowSize();
    window.app.flavors = new window.app.Flavors();
    window.app.view = new window.app.AppView(latestSolve);
  }
  
  $(init);
  
})();