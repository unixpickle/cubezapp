(function() {
  
  function Timer() {
    this.session = new window.app.Session();
    this.list = new window.app.TimesList();
    this.microwave = new window.app.Microwave();
    this.stats = new window.app.SessionStats();
    
    this._start = null;
    this._interval = null;
    
    this.microwave.disable();
    
    this.list.onselect = function() {
      // Go to the place in the graph.
    }.bind(this);
    
    this.list.ondelete = function(idx) {
      this.session.delete(idx);
      this.stats.update(this.session);
    }.bind(this);
    
    // Spacebar event for starting/stopping
    $(document).keypress(function(k) {
      var keyCode = k.charCode || k.keyCode;
      if (keyCode == 0x20) {
        k.preventDefault();
        this.startStop();
      }
    }.bind(this));
    
    this.stats.update(this.session);
  }
  
  Timer.prototype.start = function() {
    this.list.select(-1);
    this._start = new Date();
    this._interval = setInterval(function() {
      var delay = (new Date()).getTime() - this._start.getTime();
      this.microwave.show(new window.app.Record(delay));
    }.bind(this), 33);
  };
  
  Timer.prototype.startStop = function() {
    if (this._start === null) {
      this.start();
    } else {
      this.stop();
    }
  };
  
  Timer.prototype.stop = function() {
    var delay = (new Date()).getTime() - this._start.getTime();
    var record = new window.app.Record(delay);
    this.session.add(record);
    this.list.add(record);
    this.microwave.show(record);
    clearInterval(this._interval);
    this._interval = null;
    this._start = null;
    this.stats.update(this.session);
  };
  
  $(function() {
    if (!window.app) {
      window.app = {};
    }
    
    window.app.timer = new Timer();
  });
  
})();