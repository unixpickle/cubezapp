(function() {
  
  function Puzzle(id, sessions, settings) {
    this.id = id;
    this.sessions = sessions;
    this.settings = settings;
  }
  
  Puzzle.generate = function() {
    return new Puzzle('' + Math.random() + (new Date()).getTime(),
      [], {name: "3x3x3", icon: "3x3x3"});
  };
  
  Puzzle.unpack = function(data) {
    var sessions = [];
    for (var i = 0, len = data.sessions.length; i < len; ++i) {
      sessions[i] = window.app.Session.unpack(data.sessions[i]);
    }
    return new Puzzle(data.id, sessions, data.settings);
  };
  
  Puzzle.prototype.findSession = function(id) {
    for (var i = this.sessions.length-1; i >= 0; --i) {
      if (this.sessions[i].id === id) {
        return this.sessions[i];
      }
    }
    return null;
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Puzzle = Puzzle;
  
})();