(function() {
  
  var POPUP_WIDTH = 400;
  
  var popupHTML = '\
    <div class="delete-popup"> \
      <div class="title"> \
        <label>Are you sure?</label> \
        <button>Close</button> \
      </div> \
      <div class="middle"></div> \
      <div class="bottom"> \
        <button class="done theme-background">Cancel</button> \
        <button class="other">Delete</button> \
      </div> \
    </div>';
  
  function DeletePopup(name, cb) {
    var msg = 'Are you sure you would like to delete "' + name +
      '"? This action cannot be undone.';
    var sizer = $('<div />', {class: 'delete-popup-sizer'});
    sizer.text(msg);
    sizer.css({visibility: 'hidden', position: 'absolute'});
    $(document.body).append(sizer);
    var textHeight = sizer.outerHeight();
    sizer.remove();
    
    var popupHeight = textHeight + 134;
    
    this._callback = cb;
    this._element = $(popupHTML);
    this._element.find('.middle').text(msg);
    this._element.css({height: popupHeight});
    this._popup = new window.app.Popup(this._element, POPUP_WIDTH,
      popupHeight);
  }
  
  DeletePopup.prototype.show = function() {
    this._popup.show();
  };
  
  window.app.DeletePopup = DeletePopup;
  
})();