// The settings page is organized into columns. It provides users with an
// easy-to-use interface for changing both global and puzzle settings.
(function() {
  
  // BUTTON_FONT_SIZE is the font size of buttons in the settings tab.
  var BUTTON_FONT_SIZE = 20;
  
  // BUTTON_HEIGHT is the height of buttons in the settings tab.
  var BUTTON_HEIGHT = 40;
  
  // COLUMN_SPACE is the number of pixels between columns.
  var COLUMN_SPACE = 30;
  
  // INPUT_HEIGHT is the height of all dropdowns and input boxes.
  var INPUT_HEIGHT = 30;
  
  // INPUT_WIDTH is the width of all the dropdowns and input boxes.
  var INPUT_WIDTH = 180;
  
  // LABEL_FONT_SIZE is the font size of labels.
  var LABEL_FONT_SIZE = 20;
  
  // LABEL_PADDING is the minimum space between a label and its corresponding
  // input.
  var LABEL_PADDING = 10;
  
  // MINIMUM_SAPCE is the minimum number of pixels between fields.
  var MINIMUM_SPACE = 10;
  
  // MAXIMUM_SPACE is the maximum number of pixels between fields.
  var MAXIMUM_SPACE = 20;
  
  // A ButtonField implements the field interface for a custom button.
  function ButtonField(title) {
    this.visible = true;
    
    var button = $('<button class="flavor-background"></button>');
    button.css({
      fontSize: BUTTON_FONT_SIZE + 'px',
      height: BUTTON_HEIGHT,
      padding: '0 20px 0 20px'
    });
    button.text(title);
    
    // Compute the button's width.
    button.css({visibility: 'hidden', position: 'fixed'});
    $(document.body).append(button);
    this._width = button.outerWidth();
    button.remove();
    button.css({visibility: '', position: ''});
    
    this._element = $('<div class="field button-field"></div>');
    this._element.append(button);
  }
  
  // element returns the field's element.
  ButtonField.prototype.element = function() {
    return this._element;
  };
  
  // height returns BUTTON_HEIGHT.
  ButtonField.prototype.height = function() {
    return BUTTON_HEIGHT;
  };
  
  // width returns the width of the button.
  ButtonField.prototype.width = function() {
    return this._width;
  }
  
  // A LabelField is a field which contains a label and nothing else.
  function LabelField(name) {
    this.visible = true;
    
    // Create the label element.
    this._label = $('<label></label>');
    this._label.text(name);
    this._label.css({
      fontSize: LABEL_FONT_SIZE + 'px',
      visibility: 'hidden',
      position: 'fixed'
    });
    
    // Compute the label's metrics.
    $(document.body).append(this._label);
    this._labelHeight = this._label.outerWidth();
    this._labelWidth = this._label.outerWidth();
    this._label.remove();
    this._label.css({visibility: '', position: ''});
  }
  
  // element returns the label.
  LabelField.prototype.element = function() {
    return this._label;
  };
  
  // height returns the label's height.
  LabelField.prototype.height = function() {
    return this._labelHeight;
  };
  
  // width returns the label's width.
  LabelField.prototype.width = function() {
    return this._labelWidth;
  };
  
  // A CheckField is a field which contains a label and a checkbox.
  function CheckField(name) {
    LabelField.call(this, name);
    
    this._checkbox = window.app.flavors.makeCheckbox();
    this._element = $('<div class="field check-field"></div>');
    this._element.append(LabelField.prototype.element.call(this));
    this._element.append(this._checkbox.element());
  }
  
  // element returns the element containing both the label and the checkbox.
  CheckField.prototype.element = function() {
    return this._element;
  };
  
  // height returns INPUT_HEIGHT
  CheckField.prototype.height = function() {
    return INPUT_HEIGHT;
  };
  
  // width returns the minimum width of the field.
  CheckField.prototype.width = function() {
    return LabelField.prototype.width.call(this) + LABEL_PADDING + 20;
  };
  
  // A DropdownField is a field which contains a label and a dropdown.
  function DropdownField(name) {
    LabelField.call(this, name);
    
    // Create the dropdown element.
    this._dropdown = new window.dropdownjs.Dropdown(INPUT_WIDTH, [0xf0/0xff,
      0xf0/0xff, 0xf0/0xff]);
    
    // Create the field element.
    this._element = $('<div class="field dropdown-field"></div>');
    this._element.append(LabelField.prototype.element.call(this));
    this._element.append(this._dropdown.element());
  }
  
  // element returns an element containing the dropdown and the label.
  DropdownField.prototype.element = function() {
    return this._element;
  };
  
  // height returns the height of the element.
  DropdownField.prototype.height = function() {
    return INPUT_HEIGHT;
  };
  
  // width returns the minimum width of the element.
  DropdownField.prototype.width = function() {
    return LabelField.prototype.width.call(this) + LABEL_PADDING + INPUT_WIDTH;
  };
  
  // An InputField is a field which contains a label and a textbox.
  function InputField(name) {
    LabelField.call(this, name);
    
    // Create the input element.
    this._input = $('<input></input>');
    
    // Create the field element.
    this._element = $('<div class="field input-field"></div>');
    this._element.append(LabelField.prototype.element.call(this));
    this._element.append(this._input);
  }
  
  // element returns an element containing the field and the label.
  InputField.prototype.element = function() {
    return this._element;
  };
  
  // height returns the height of the element.
  InputField.prototype.height = function() {
    return INPUT_HEIGHT;
  };
  
  // input returns the input.
  InputField.prototype.input = function() {
    return this._input;
  };
  
  // width returns the minimum width of the element.
  InputField.prototype.width = function() {
    return LabelField.prototype.width.call(this) + LABEL_PADDING + INPUT_WIDTH;
  };
  
  function Settings() {
    this._fields = [
      new InputField('Name'),
      new DropdownField('Icon'),
      new DropdownField('Scramble'),
      new CheckField('BLD'),
      new CheckField('Inspection'),
      new DropdownField('Timer Input'),
      new DropdownField('Update'),
      new CheckField('Right Handed'),
      new CheckField('Theater Mode'),
      new DropdownField('Flavor'),
      new ButtonField('Configure Cube')
    ];
    
    this._nameInput = this._fields[0].input();
    
    this._element = $('#footer .settings-contents');
    this._puzzle = $('<div class="puzzle"></div>');
    this._puzzleIcon = $('<div class="icon flavor-background"></div>');
    this._puzzleLabel = $('<label></label>');
    this._puzzle.append([this._puzzleIcon, this._puzzleLabel]);
    this._element.append(this._puzzle);
  }
  
  Settings.prototype.layout = function(h) {
    var height = this._element[0].clientHeight || h;
    
    // columnX is the x coordinate of the current column.
    var columnX = 220;
    
    // currentColumn will accumulate elements until the column is too tall.
    var currentColumn = [];
    
    // columnHeight represents the minimum height of the current column.
    var columnHeight = MINIMUM_SPACE;
    
    // columnWidth is the width needed to fit every field in the current column.
    var columnWidth = 0;
    
    for (var i = 0, len = this._fields.length; i < len; ++i) {
      var field = this._fields[i];
      field.element().remove();
      if (!field.visible) {
        continue;
      }
      // Either start a new column or add this field to the current one.
      if (columnHeight + field.height() + MINIMUM_SPACE > height) {
        this._layoutColumn(currentColumn, columnX, columnWidth, height);
        columnX += columnWidth + COLUMN_SPACE;
        currentColumn = [field];
        columnHeight = MINIMUM_SPACE*2 + field.height();
        columnWidth = field.width();
      } else {
        currentColumn.push(field);
        columnHeight += MINIMUM_SPACE + field.height();
        columnWidth = Math.max(field.width(), columnWidth);
      }
    }
    
    // The last column may need to be added.
    if (currentColumn.length > 0) {
      this._layoutColumn(currentColumn, columnX, columnWidth, height);
    }
    
    // If the clientHeight is smaller than it was before (i.e. a scrollbar was
    // added), then layout again. This is not a perfect technique, but it's good
    // enough.
    if ((this._element[0].clientHeight || h) < height) {
      this.layout(h);
    }
  };
  
  Settings.prototype.setPuzzle = function(puzzle) {
    this._puzzleLabel.text(puzzle.name);
    this._puzzleIcon.css({
      backgroundImage: 'url(images/puzzles/' + puzzle.icon + '.png)'
    });
    this._nameInput.val(puzzle.name);
  };
  
  Settings.prototype._layoutColumn = function(column, x, width, height) {
    // Find the raw height of all the elements without any spacing.
    var rawHeight = 0;
    for (var i = 0, len = column.length; i < len; ++i) {
      rawHeight += column[i].height();
    }
    
    // Compute the spacing.
    var spacing = Math.min((height-rawHeight) / (column.length+1),
      MAXIMUM_SPACE);
    var y = (height - rawHeight - spacing*(column.length-1))/2;
    for (var i = 0, len = column.length; i < len; ++i) {
      var element = column[i].element();
      element.css({
        width: width,
        left: x,
        top: Math.floor(y)
      });
      this._element.append(element);
      y += spacing + column[i].height();
    }
  };
  
  window.app.Settings = Settings;
  
})();