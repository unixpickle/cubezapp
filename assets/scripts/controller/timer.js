(function() {

  function TimerController() {
    this._inputMode = window.app.store.getActivePuzzle().timerInput;
    this._manualText = '';
    this._session = null;
    this._stackmatRunning = false;

    this._settingsChangedWhileRunning = false;
    
    // TODO: the rest of this code.
    window.app.view.scrambler.showScramble();
  }

  TimerController.INPUT_REGULAR = 0;
  TimerController.INPUT_INSPECTION = 1;
  TimerController.INPUT_BLD = 2;
  TimerController.INPUT_STACKMAT = 3;
  TimerController.INPUT_ENTRY = 4;

  window.app.TimerController = TimerController;

})();
