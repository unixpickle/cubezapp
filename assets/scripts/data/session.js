(function() {
  
  function Session() {
    this.id = '' + Math.random() + (new Date()).getTime();
    this.solves = [];
  }
  
  Session.unpack = function(info) {
    var solves = [];
    for (var i = 0, len = info.solves.length; i < len; ++i) {
      solves[i] = window.app.Solve.unpack(info.solves[i]);
    }
    var res = Object.create(Session.prototype);
    res.id = info.id;
    res.solves = solves;
    return res;
  };
  
  Session.prototype.add = function(solve) {
    this.solves.push(solve);
  };
  
  Session.prototype.count = function() {
    return this.solves.length;
  };
  
  Session.prototype.delete = function(idx) {
    this.solves.splice(idx, 1);
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Session = Session;
  
})();