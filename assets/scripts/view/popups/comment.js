(function() {

  function CommentPopup(solve) {
    window.app.EventEmitter.call(this);
    var $content = $('<div class="comment-popup-content">' +
      '<textarea class="comment-popup-textarea"></textarea></div>');
    this._$textArea = $content.find('.comment-popup-textarea');
    this._$textArea.val(solve.notes);
    this._dialog = new window.app.Dialog('Add Comment', $content,
      ['Cancel', 'OK']);
    this._dialog.on('action', this._action.bind(this));
  }

  CommentPopup.prototype = Object.create(window.app.EventEmitter.prototype);

  CommentPopup.prototype.show = function() {
    this._dialog.show();
  };

  CommentPopup.prototype._action = function(actionIndex) {
    if (actionIndex === 1) {
      this.emit('save', this._$textArea.val());
    }
    this._dialog.close();
  };

  window.app.CommentPopup = CommentPopup;

})();
