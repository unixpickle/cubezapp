(function() {

  function MessagePopup(title, message) {
    var content = $('<div class="message-popup-content"></div>').text(message);
    this._dialog = new window.app.Dialog(title, content, ['OK']);
    this._dialog.onAction = this._action.bind(this);
  }

  MessagePopup.prototype.show = function() {
    this._dialog.show();
  };

  MessagePopup.prototype._action = function(name) {
    this._dialog.close();
  };

  window.app.MessagePopup = MessagePopup;

})();
