(function() {
  
  // window.app must be created by now, since LocalDb must be imported before
  // this file.
  window.app.store = new window.app.LocalDb();
  
})();
