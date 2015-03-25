(function() {
  
    // I put this code here because it doesn't really belong in the DOM and I
    // don't really know where else to put it...
  var popupHTML = '\
    <div class="add-popup"> \
      <div class="title"> \
        <label>New Puzzle</label> \
        <button>Close</button> \
      </div> \
      <div class="middle"> \
        <div class="puzzle"> \
          <div class="icon theme-background"></div> \
          <label>Name</label> \
        </div> \
        <div class="separator"></div> \
        <div class="fields"></div> \
      </div> \
    </div>';
  
  function AddPopup() {
    var element = $(popupHTML);
    
    // TODO: generate fields (which have strange properties) here.
    
    this._popup = new window.app.Popup(element, 500, 320);
    
    var closeButton = element.find('.title button');
    closeButton.click(this._popup.close.bind(this._popup));
  }
  
  AddPopup.prototype.close = function() {
    this._popup.close();
  }
  
  AddPopup.prototype.show = function() {
    this._popup.show();
  }
  
  window.app.AddPopup = AddPopup;
  
})();