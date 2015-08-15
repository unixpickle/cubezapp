(function() {

  // ChangeAllUpdatedPopup asks the user whether or not they would like to
  // apply their update setting to all their puzzles. It emits three events:
  // - 'no': the user picked No.
  // - 'yes': the user picked Yes.
  // - 'cancel': the user closed the popup without picking an option.
  function ChangeAllUpdatePopup() {
    window.app.EventEmitter.call(this);

    var code = '<div class="change-all-update-popup-content"></div>';
    var $content = $(code).text("Would you like to apply this setting to all " +
      "of your puzzles?");

    this._dialog = new window.app.Dialog('Apply to All?', $content,
      ['No', 'Yes']);
    this._dialog.on('action', this._action.bind(this));
    this._dialog.on('close', this.emit.bind(this, 'cancel'));
  }

  ChangeAllUpdatePopup.prototype =
    Object.create(window.app.EventEmitter.prototype);

  ChangeAllUpdatePopup.prototype.close = function() {
    this._dialog.close();
  };

  ChangeAllUpdatePopup.prototype.show = function() {
    this._dialog.show();
  };

  ChangeAllUpdatePopup.prototype._action = function(idx) {
    if (idx === 0) {
      this.emit('no');
    } else {
      this.emit('yes');
    }
    this.close();
  };

  window.app.ChangeAllUpdatePopup = ChangeAllUpdatePopup;

})();
