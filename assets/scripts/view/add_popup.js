(function() {
  
  var FIELD_WIDTH = 120;
  
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
    
    // Generate fields.
    var fields = element.find('.fields');
    this._nameField = createNameField();
    fields.append(this._nameField);
    this._iconField = createIconField();
    fields.append(this._iconField);
    
    this._popup = new window.app.Popup(element, 500, 350);
    
    var closeButton = element.find('.title button');
    closeButton.click(this._popup.close.bind(this._popup));
  }
  
  AddPopup.prototype.close = function() {
    this._popup.close();
  }
  
  AddPopup.prototype.show = function() {
    this._popup.show();
  }
  
  function createIconField() {
    var dropdown = new window.app.Dropdown(FIELD_WIDTH);
    dropdown.setOptions(['None', '3x3x3', '2x2x2'], 0);
    var element = $('\
      <div class="field"> \
        <label>Icon</label> \
        <div class="content"></div> \
      </div> \
    ');
    element.find('.content').append(dropdown.element());
    return element;
  }
  
  function createNameField() {
    return $('\
      <div class="field"> \
        <label>Name</label> \
        <div class="content"><input /></div> \
      </div> \
    ');
  }
  
  window.app.AddPopup = AddPopup;
  
})();