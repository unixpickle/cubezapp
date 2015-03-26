(function() {
  
  var POPUP_WIDTH = 400;
  
  function DeletePopup(name, cb) {
    var msg = 'Are you sure you would like to delete "' + name +
      '"? This action cannot be undone.';
    var content = $('<div class="delete-popup-content"></div>').text(msg);
    this._dialog = new window.app.Dialog('Are you sure?', content,
      ['Delete', 'Cancel']);
  }
  
  DeletePopup.prototype.show = function() {
    this._dialog.show();
  };
  
  window.app.DeletePopup = DeletePopup;
  
})();