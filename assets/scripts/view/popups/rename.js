(function() {

  var code = '\
    <div class="rename-popup-content"> \
      <label>New name</label> \
      <input maxlength="19" /> \
    </div> \
  ';

  function RenamePopup() {
    var content = $(code);
    var input = content.find('input');
    this._dialog = new window.app.Dialog('Rename', content,
      ['Cancel', 'Rename']);
    this._dialog.on('action', this._action.bind(this));
  }

  RenamePopup.prototype.show = function() {
    this._dialog.show();
  };

  RenamePopup.prototype._action = function(idx) {
    if (idx === 1) {
      // TODO: this.
    }
    this._dialog.close();
  };

  window.app.RenamePopup = RenamePopup;

})();
