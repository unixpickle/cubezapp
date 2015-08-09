(function() {

  var code = '\
    <div class="rename-popup-content"> \
      <label>New name</label> \
      <input maxlength="19" /> \
    </div> \
  ';

  function RenamePopup() {
    window.app.EventEmitter.call(this);

    var $content = $(code);
    this._$input = $content.find('input');
    this._$input.attr('placeholder', window.app.store.getActivePuzzle().name);

    this._dialog = new window.app.Dialog('Change Name', $content,
      ['Cancel', 'Rename']);
    this._dialog.on('action', this._action.bind(this));
  }

  RenamePopup.prototype = Object.create(window.app.EventEmitter.prototype);

  RenamePopup.prototype.close = function() {
    this._dialog.close();
  };

  RenamePopup.prototype.getName = function() {
    return this._$input.val();
  };

  RenamePopup.prototype.shakeInput = function() {
    window.app.runShakeAnimation(this._$input[0]);
  };

  RenamePopup.prototype.show = function() {
    this._dialog.show();
    this._$input.focus();
  };

  RenamePopup.prototype._action = function(idx) {
    if (idx === 1) {
      this.emit('rename');
    } else {
      this._dialog.close();
    }
  };

  window.app.RenamePopup = RenamePopup;

})();
