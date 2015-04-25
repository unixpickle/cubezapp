(function() {

  // A ScrambleView queues up scrambles and shows them to the user.
  function ScrambleView() {
    this._queue = new window.app.ScrambleQueue();
    this._currentScramble = null;
    
    this._queue.on('softTimeout', this._showScramble.bind(this, 'Loading...'));
    this._queue.on('scramble', this._showScramble.bind(this));
  }

  ScrambleView.prototype.current = function() {
    return this._currentScramble;
  };

  ScrambleView.prototype.hideScramble = function() {
    this._queue.requestInBackground();
    this._showScramble(null);
  };

  ScrambleView.prototype.showScramble = function() {
    this._queue.request();
  };

  ScrambleView.prototype._showScramble = function(scramble) {
    window.app.view.setScramble(scramble);
    if (scramble ===  'Loading...' || scramble === null) {
      this._currentScramble = null;
    } else {
      this._currentScramble = scramble;
    }
  };

  window.app.ScrambleView = ScrambleView;

})();
