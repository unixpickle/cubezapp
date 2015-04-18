// The settings page is organized into columns. It provides users with an
// easy-to-use interface for changing both global and puzzle settings.
(function() {
  
  // These constants determine the sizes of various things.
  var FONT_SIZE = 17;
  var RECTANGULAR_FIELD_HEIGHT = 30;
  var RECTANGULAR_FIELD_WIDTH = 160;
  var BUTTON_HEIGHT = 35;
  
  // These constants determine how spaced out things can get.
  var MINIMUM_ROW_SPACE = 10;
  var MAXIMUM_ROW_SPACE = 20;
  var COLUMN_SPACE = 30;
  
  // LABEL_PADDING is the minimum space between a label and its corresponding
  // input.
  var LABEL_PADDING = 10;
  
  // A Field is an abstract row in the settings tab.
  function Field() {
    this.showing = false;
    this.visible = true;
  }
  
  Field.prototype.element = function() {
    throw new Error('abstract method');
  };
  
  Field.prototype.height = function() {
    throw new Error('abstract method');
  };
  
  Field.prototype.updateShowing = function(animate) {
    if (this.visible === this.showing) {
      return;
    }
    if (this.visible) {
      if (animate) {
        this.element().fadeIn();
      } else {
        this.element().css({display: 'block', opacity: 1});
      }
    } else {
      if (animate) {
        this.element().fadeOut();
      } else {
        this.element().css({display: 'none'});
      }
    }
    this.showing = this.visible;
  };
  
  // A ButtonField implements the field interface for a custom button.
  function ButtonField(title) {
    Field.call(this);
    
    var button = $('<button class="flavor-background"></button>');
    button.css({
      fontSize: FONT_SIZE + 'px',
      height: BUTTON_HEIGHT,
      padding: '0 20px 0 20px'
    });
    button.text(title);
    
    // Compute the button's width.
    button.css({visibility: 'hidden', position: 'fixed'});
    $(document.body).append(button);
    this._width = button.outerWidth();
    button.detach();
    button.css({visibility: '', position: ''});
    
    this._element = $('<div class="field button-field"></div>');
    this._element.append(button);
  }
  
  ButtonField.prototype = Object.create(Field.prototype);
  
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
  };
  
  // A LabelField is a field which contains a label and nothing else.
  function LabelField(name) {
    Field.call(this);
    
    // Create the label element.
    this._label = $('<label></label>');
    this._label.text(name);
    this._label.css({
      fontSize: FONT_SIZE + 'px',
      lineHeight: RECTANGULAR_FIELD_HEIGHT + 'px',
      height: RECTANGULAR_FIELD_HEIGHT + 'px',
      visibility: 'hidden',
      position: 'fixed'
    });
    
    // Compute the label's metrics.
    $(document.body).append(this._label);
    this._labelHeight = this._label.outerWidth();
    this._labelWidth = this._label.outerWidth();
    this._label.detach();
    this._label.css({visibility: '', position: ''});
  }
  
  LabelField.prototype = Object.create(Field.prototype);
  
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
  
  CheckField.prototype = Object.create(LabelField.prototype);
  
  // element returns the element containing both the label and the checkbox.
  CheckField.prototype.element = function() {
    return this._element;
  };
  
  // height returns INPUT_HEIGHT
  CheckField.prototype.height = function() {
    return RECTANGULAR_FIELD_HEIGHT;
  };
  
  // width returns the minimum width of the field.
  CheckField.prototype.width = function() {
    return LabelField.prototype.width.call(this) + LABEL_PADDING + 20;
  };
  
  // A DropdownField is a field which contains a label and a dropdown.
  function DropdownField(name) {
    LabelField.call(this, name);
    
    // Create the dropdown element.
    this._dropdown = new window.dropdownjs.Dropdown(RECTANGULAR_FIELD_WIDTH,
      [0xf0/0xff, 0xf0/0xff, 0xf0/0xff], RECTANGULAR_FIELD_HEIGHT, FONT_SIZE);
    
    // Create the field element.
    this._element = $('<div class="field dropdown-field"></div>');
    this._element.append(LabelField.prototype.element.call(this));
    this._element.append(this._dropdown.element());
  }
  
  DropdownField.prototype = Object.create(LabelField.prototype);

  // dropdown returns the dropdown in the field.
  DropdownField.prototype.dropdown = function() {
    return this._dropdown;
  };
  
  // element returns an element containing the dropdown and the label.
  DropdownField.prototype.element = function() {
    return this._element;
  };
  
  // height returns the height of the element.
  DropdownField.prototype.height = function() {
    return RECTANGULAR_FIELD_HEIGHT;
  };
  
  // width returns the minimum width of the element.
  DropdownField.prototype.width = function() {
    return LabelField.prototype.width.call(this) + LABEL_PADDING +
      RECTANGULAR_FIELD_WIDTH;
  };
  
  // An InputField is a field which contains a label and a textbox.
  function InputField(name) {
    LabelField.call(this, name);
    
    // Create the input element.
    this._input = $('<input></input>').css({
      width: RECTANGULAR_FIELD_WIDTH - 14,
      height: RECTANGULAR_FIELD_HEIGHT - 4,
      fontSize: FONT_SIZE + 'px'
    });
    
    // Create the field element.
    this._element = $('<div class="field input-field"></div>');
    this._element.append(LabelField.prototype.element.call(this));
    this._element.append(this._input);
  }
  
  InputField.prototype = Object.create(LabelField.prototype);
  
  // element returns an element containing the field and the label.
  InputField.prototype.element = function() {
    return this._element;
  };
  
  // height returns the height of the element.
  InputField.prototype.height = function() {
    return RECTANGULAR_FIELD_HEIGHT;
  };
  
  // input returns the input.
  InputField.prototype.input = function() {
    return this._input;
  };
  
  // width returns the minimum width of the element.
  InputField.prototype.width = function() {
    return LabelField.prototype.width.call(this) + LABEL_PADDING +
      RECTANGULAR_FIELD_WIDTH;
  };
  
  function Settings() {
    this._fields = [
      new DropdownField('Icon'),
      new DropdownField('Scramble'),
      new DropdownField(''),
      new CheckField('BLD'),
      new CheckField('Inspection'),
      new DropdownField('Timer Input'),
      new DropdownField('Update'),
      new CheckField('Right Handed'),
      new CheckField('Theater Mode'),
      new DropdownField('Flavor'),
      new ButtonField('Configure Cube'),
      new ButtonField('Change Name')
    ];

    // Setup the icon dropdown.
    this._iconDropdown = this._fields[0].dropdown();
    this._iconDropdown.setOptions(window.app.iconNames);
    this._iconDropdown.onChange = this._changedIcon.bind(this);

    // Setup the flavor dropdown.
    this._flavorDropdown = this._fields[9].dropdown();
    this._flavorDropdown.setOptions(window.app.flavorNames);
    this._flavorDropdown.setSelectedValue(window.app.flavors.current());
    this._flavorDropdown.onChange = this._changedFlavor.bind(this);

    // Setup the scramble dropdown.
    this._scrambleField = this._fields[1];
    this._scrambleDropdown = this._scrambleField.dropdown();
    var scrambles = window.puzzlejs.scrambler.allPuzzles().slice();
    scrambles.unshift('None');
    this._scrambleDropdown.setOptions(scrambles);
    this._scrambleDropdown.onChange = this._changedScramble.bind(this);

    // Setup the subscramble dropdown.
    this._subscrambleField = this._fields[2];
    this._subscrambleDropdown = this._subscrambleField.dropdown();
    this._subscrambleDropdown.onChange = this._changedSubscramble.bind(this);

    this._contents = $('<div class="settings-contents-contents"></div>');
    this._element = $('#footer .settings-contents');
    this._puzzle = $('<div class="puzzle"></div>');
    this._puzzleIcon = $('<div class="icon flavor-background"></div>');
    this._puzzleLabel = $('<label></label>');
    this._puzzle.append([this._puzzleIcon, this._puzzleLabel]);
    this._contents.append(this._puzzle);
    this._element.append(this._contents);
    
    for (var i = 0, len = this._fields.length; i < len; ++i) {
      this._fields[i].element().css({display: 'none'});
      this._contents.append(this._fields[i].element());
    }
  }

  // hideDropdowns is called so that any open dropdowns can be closed.
  Settings.prototype.hideDropdowns = function() {
    this._flavorDropdown.hide();
    this._iconDropdown.hide();
    this._scrambleDropdown.hide();
    this._subscrambleDropdown.hide();
  };
  
  Settings.prototype.layout = function(animate) {
    var height = this._element[0].clientHeight || this._element.height();
    
    // columnX is the x coordinate of the current column.
    var columnX = 220;
    
    // currentColumn will accumulate elements until the column is too tall.
    var currentColumn = [];
    
    // columnHeight represents the minimum height of the current column.
    var columnHeight = MINIMUM_ROW_SPACE;
    
    // columnWidth is the width needed to fit every field in the current column.
    var columnWidth = 0;
    
    for (var i = 0, len = this._fields.length; i < len; ++i) {
      var field = this._fields[i];
      
      if (!field.visible) {
        field.updateShowing(animate);
        continue;
      }
      
      var requiredHeight = field.height();
      var addHeight = field.height();
      if (field === this._scrambleField) {
        requiredHeight += MINIMUM_ROW_SPACE + this._subscrambleField.height();
        if (!this._subscrambleField.visible) {
          addHeight = requiredHeight;
        }
      }
      
      // Either start a new column or add this field to the current one.
      if (columnHeight + requiredHeight + MINIMUM_ROW_SPACE > height) {
        this._layoutColumn(currentColumn, columnX, columnWidth, height,
          animate);
        columnX += columnWidth + COLUMN_SPACE;
        currentColumn = [field];
        columnHeight = MINIMUM_ROW_SPACE*2 + addHeight;
        columnWidth = field.width();
      } else {
        currentColumn.push(field);
        columnHeight += MINIMUM_ROW_SPACE + addHeight;
        columnWidth = Math.max(field.width(), columnWidth);
      }
    }
    
    // The last column may need to be added.
    if (currentColumn.length > 0) {
      this._layoutColumn(currentColumn, columnX, columnWidth, height, animate);
    }
    
    // If the clientHeight is smaller than it was before (i.e. a scrollbar was
    // added), then layout again. This is not a perfect technique, but it's good
    // enough.
    if ((this._element[0].clientHeight || this._element.height()) < height) {
      this.layout();
    }
  };
  
  Settings.prototype.setPuzzle = function(puzzle) {
    this.setPuzzleName(puzzle.name);
    this._puzzleIcon.css({
      backgroundImage: 'url(images/puzzles/' + puzzle.icon + '.png)'
    });

    var iconName = window.app.iconFilesToNames[puzzle.icon];
    this._iconDropdown.setSelectedValue(iconName);

    this._scrambleDropdown.setSelectedValue(puzzle.scrambler);
    this._popuplateSubscramble();
    this._subscrambleDropdown.setSelectedValue(puzzle.scrambleType);

    // We may need to re-layout because a field may have been shown or hidden.
    this.layout();

    // We should deselect dropdowns because a dropdown may have been open if
    // setPuzzle() was called because of a remote change.
    this.hideDropdowns();
  };
  
  Settings.prototype.setPuzzleName = function(name) {
    this._puzzleLabel.text(name);
  };

  Settings.prototype._changedFlavor = function() {
    window.app.flavors.switchToFlavor(this._flavorDropdown.value());
    window.app.store.modifyGlobalSettings({
      flavor: this._flavorDropdown.value()
    });
  };

  Settings.prototype._changedIcon = function() {
    var iconFile = window.app.iconFiles[this._iconDropdown.selected()];
    this._puzzleIcon.css({
      backgroundImage: 'url(images/puzzles/' + iconFile + '.png)'
    });
    window.app.store.modifyPuzzle({icon: iconFile});
  };

  Settings.prototype._changedScramble = function() {
    this._popuplateSubscramble();
    this.layout(true);
    window.app.store.modifyPuzzle({
      scrambler: this._scrambleDropdown.value(),
      scrambleType: this._subscramblers()[0] || 'None'
    });
  };

  Settings.prototype._changedSubscramble = function() {
    // They could have changed the subscramble really fast while it was fading
    // out.
    if (!this._subscrambleField.visible) {
      return;
    }
    window.app.store.modifyPuzzle({
      scrambleType: this._subscrambleDropdown.value()
    });
  };
  
  Settings.prototype._layoutColumn = function(column, x, width, height,
    animate) {
    // Find the raw height of all the elements without any spacing.
    var rawHeight = 0;
    for (var i = 0, len = column.length; i < len; ++i) {
      rawHeight += column[i].height();
    }
    
    // Compute the spacing.
    var spacing = Math.min((height-rawHeight) / (column.length+1),
      MAXIMUM_ROW_SPACE);
    var y = (height - rawHeight - spacing*(column.length-1))/2;
    for (var i = 0, len = column.length; i < len; ++i) {
      var field = column[i];
      var element = field.element();
      if (animate && field.showing) {
        element.animate({
          width: width,
          left: x,
          top: Math.floor(y)
        }, {queue: false});
      } else {
        element.css({
          width: width,
          left: x,
          top: Math.floor(y)
        });
      }
      y += spacing + column[i].height();
      field.updateShowing(animate);
    }
    
    this._contents.css({width: x+width+10});
  };

  Settings.prototype._popuplateSubscramble = function() {
    var options = this._subscramblers();
    this._subscrambleField.visible = (options.length > 1);
    if (options.length > 1) {
      this._subscrambleDropdown.setOptions(options);
    }
  };

  Settings.prototype._subscramblers = function() {
    var puzzle = this._scrambleDropdown.value();
    if (puzzle === 'None') {
      return [];
    }
    
    var names = [];
    var scramblers = window.puzzlejs.scrambler.scramblersForPuzzle(puzzle);
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      names[i] = scramblers[i].name;
    }
    return names;
  };
  
  window.app.Settings = Settings;
  
})();
