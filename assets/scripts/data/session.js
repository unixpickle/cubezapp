(function() {
  
  function Session(solves) {
    this.id = '' + Math.random() + (new Date()).getTime();
    this.solves = [];
  }
  
  Session.unpack = function(sessionStr) {
    var solves = [];
    var list = JSON.parse(sessionStr);
    for (var i = 0, len = list.length; i < len; ++i) {
      solves[i] = window.app.Solve.unpack(list[i]);
    }
    return Object.create(Session.prototype, {solves: solves});
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