(function() {

  function DeletePopup(name, cb) {
    var msg = 'Are you sure you would like to delete "' + name +
      '"? This action cannot be undone.';
    var content = $('<div class="delete-popup-content"></div>').text(msg);
    this._dialog = new window.app.Dialog('Are You Sure?', content,
      ['Cancel', 'Delete']);
    this._dialog.on('action', this._action.bind(this));
    this._callback = cb;
  }

  DeletePopup.prototype.show = function() {
    this._dialog.show();
  };

  DeletePopup.prototype._action = function(index) {
    if (index === 1) {
      this._callback();
    }
    this._dialog.close();
  };

  window.app.DeletePopup = DeletePopup;

})();
