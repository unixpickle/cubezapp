(function() {
  
  function TimerView() {
    this._timerRunning = false;
    this._inTheaterMode = false;
    this._accuracy = 'seconds';
  }
  
  TimerView.ACCURACY_CENTISECONDS = 0;
  TimerView.ACCURACY_SECONDS = 1;
  TimerView.ACCURACY_NONE = 2;
  
  window.app.TimerView = TimerView;
  
})();