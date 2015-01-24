(function() {
  
  function Puzzle(id, sessions, settings) {
    this.id = id;
    this.sessions = sessions;
    this.settings = settings;
  }
  
  Puzzle.unpack = function(data) {
    var sessions = [];
    for (var i = 0, len = data.sessions.length; i < len; ++i) {
      sessions[i] = window.app.Session.unpack(data.sessions[i]);
    }
    return new Puzzle(sessions, data.settings);
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