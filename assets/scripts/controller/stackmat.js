// Currently, this a blackbox for what will eventually be a stackmat timer
// driver.
(function() {

  function Stackmat() {
    this.onWait = null;
    this.onReady = null;
    this.onTime = null;
    this.onDone = null;
    this.onCancel = null;
  }

  Stackmat.prototype.connect = function() {
    // TODO: something here.
  };

  Stackmat.prototype.disconnect = function() {
    // TODO: something here.
  };

  window.app.Stackmat = Stackmat;

})();
