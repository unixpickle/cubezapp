// Currently, this a blackbox for what will eventually be a stackmat timer
// driver.
(function() {

  function Stackmat() {
    window.app.EventEmitter.call(this);
  }

  Stackmat.prototype = Object.create(window.app.EventEmitter.prototype);

  Stackmat.prototype.connect = function() {
    // TODO: something here.
  };

  Stackmat.prototype.disconnect = function() {
    // TODO: something here.
  };

  window.app.Stackmat = Stackmat;

})();
