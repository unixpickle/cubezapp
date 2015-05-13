// The settings page is organized into columns. It provides users with an
// easy-to-use interface for changing both global and puzzle settings.
(function() {

  // These constants determine the sizes of various things.
  var FONT_SIZE = 17;
  var RECTANGULAR_FIELD_HEIGHT = 30;
  var RECTANGULAR_FIELD_WIDTH = 160;
  var BUTTON_HEIGHT = 35;
  var BUTTON_WIDTH = 160;

  // These constants determine how spaced out things can get.
  var MINIMUM_ROW_SPACE = 10;
  var MAXIMUM_ROW_SPACE = 20;
  var COLUMN_SPACE = 30;

  var FIELD_START_LEFT = 220;

  // LABEL_PADDING is the minimum space between a label and its corresponding
  // input.
  var LABEL_PADDING = 10;

  var PADDING_RIGHT = 10;

  function Settings() {
    window.app.EventEmitter.call(this);

    this._fields = [];
    this._fieldMap = {};
    this._addField('icon', new DropdownField('Icon'));
    this._addField('scrambler', new DropdownField('Scramble'));
    this._addField('scrambleType', new DropdownField(''));
    this._addField('bld', new CheckField('BLD'));
    this._addField('inspection', new CheckField('Inspection'));
    this._addField('timerInput', new DropdownField('Timer Input'));
    this._addField('update', new DropdownField('Update'));
    this._addField('righty', new CheckField('Right Handed'));
    this._addField('theaterMode', new CheckField('Theater Mode'));
    this._addField('flavor', new DropdownField('Flavor'));
    this._addField('configCube', new ButtonField('Configure Cube'));
    this._addField('changeName', new ButtonField('Change Name'));

    this._getField('scrambleType').element().css({display: 'none'});
    this._scrambleTypeVisible = false;

    this._$puzzle = $('<div class="puzzle"></div>');
    this._$puzzleIcon = $('<div class="icon flavor-background"></div>');
    this._$puzzleName = $('<label></label>');
    this._$puzzle.append([this._$puzzleIcon, this._$puzzleName]);

    this._$contents = $('<div id="settings-contents-contents"></div>');
    this._$contents.append(this._$puzzle);

    this._$element = $('#settings-contents');
    this._$element.append(this._$contents);

    for (var i = 0, len = this._fields.length; i < len; ++i) {
      this._$contents.append(this._fields[i].element());
    }

    this._registerUIEvents();
    this._registerModelEvents();
    this._initDropdownOptions();
    this._initValues();
    this.layout();
  }

  Settings.prototype = Object.create(window.app.EventEmitter.prototype);

  Settings.prototype.getBLD = function() {
    return this._getField('bld').checkbox().getChecked();
  };

  Settings.prototype.getFlavorName = function() {
    return this._getField('flavor').dropdown().getValue();
  };

  Settings.prototype.getIconName = function() {
    return this._getField('icon').dropdown().getValue();
  };

  Settings.prototype.getInspection = function() {
    return this._getField('inspection').checkbox().getChecked();
  };

  Settings.prototype.getRighty = function() {
    return this._getField('righty').checkbox().getChecked();
  }

  Settings.prototype.getScrambleType = function() {
    return this._getField('scrambleType').dropdown().getValue();
  };

  Settings.prototype.getScrambler = function() {
    return this._getField('scrambler').dropdown().getValue();
  };

  Settings.prototype.getTheaterMode = function() {
    return this._getField('theaterMode').checkbox().getChecked();
  };

  Settings.prototype.getTimerInput = function() {
    return this._getField('timerInput').dropdown().getValue();
  };

  Settings.prototype.getUpdate = function() {
    return this._getField('update').dropdown().getSelected();
  };

  Settings.prototype.layout = function() {
    this._layoutFields(false);
  };

  Settings.prototype._addField = function(name, field) {
    this._fields.push(field);
    this._fieldMap[name] = field;
  };

  Settings.prototype._contentHeight = function() {
    return this._$element[0].clientHeight || this._$element.height();
  };

  Settings.prototype._getField = function(name) {
    return this._fieldMap[name];
  };

  Settings.prototype._initDropdownOptions = function() {
    this._getField('icon').dropdown().setOptions(window.app.iconNames);
    this._getField('flavor').dropdown().setOptions(window.app.flavorNames);
    this._getField('update').dropdown().setOptions(
      window.app.TimerView.ACCURACY_NAMES
    );
    this._getField('timerInput').dropdown().setOptions([
      'Regular', 'Manual Entry', 'Stackmat'
    ]);

    var scrambles = window.puzzlejs.scrambler.allPuzzles().slice();
    scrambles.unshift('None');
    this._getField('scrambler').dropdown().setOptions(scrambles);
  };

  Settings.prototype._initValues = function() {
    this._updateBLD();
    this._updateFlavor();
    this._updateIcon();
    this._updateInspection(false);
    this._updateName();
    this._updateRighty();
    this._updateScrambler();
    this._updateScrambleTypes(false);
    this._updateScrambleType();
    this._updateTheaterMode();
    this._updateTimerInput(false);
    this._updateUpdate();
  };

  Settings.prototype._layoutFields = function(animate) {
    var height = this._contentHeight();
    var currentColumn = new Column(height);
    var left = FIELD_START_LEFT;
    for (var i = 0, len = this._fields.length; i < len; ++i) {
      var field = this._fields[i];
      var fieldArray = [field];
      if (field === this._getField('scrambler')) {
        fieldArray.push(this._getField('scrambleType'));
        ++i;
      }
      if (!currentColumn.addFields(fieldArray)) {
        if (!this._scrambleTypeVisible) {
          currentColumn.removeField(this._getField('scrambleType'));
        }
        currentColumn.layoutAtLeft(left, animate);
        left += currentColumn.width() + COLUMN_SPACE;

        currentColumn = new Column(height);
        currentColumn.addFields(fieldArray);
      }
    }

    if (!this._scrambleTypeVisible) {
      currentColumn.removeField(this._getField('scrambleType'));
    }
    currentColumn.layoutAtLeft(left, animate);

    if (this._contentHeight() < height) {
      this._layoutFields(animate);
    } else {
      this._$contents.css({width: left + currentColumn.width() +
        PADDING_RIGHT});
    }
  };

  Settings.prototype._registerModelEvents = function() {
    var keys;
    var key;

    var globalEvents = {
      'flavor': this._updateFlavor,
      'timerAccuracy': this._updateUpdate,
      'theaterMode': this._updateTheaterMode,
      'righty': this._updateRighty
    };
    keys = Object.keys(globalEvents);
    for (var i = 0, len = keys.length; i < len; ++i) {
      key = keys[i];
      window.app.observe.globalSettings(key, globalEvents[key].bind(this));
    }

    var puzzleEvents = {
      'icon': this._updateIcon,
      'name': this._updateName,
      'scrambler': function() {
        this._updateScrambler();
        this._updateScrambleTypes(true);
      },
      'scrambleType': this._updateScrambleType,
      'timerInput': function() {
        this._updateBLD();
        this._updateInspection(true);
        this._updateTimerInput(true);
      }
    };
    keys = Object.keys(puzzleEvents);
    for (var i = 0, len = keys.length; i < len; ++i) {
      key = keys[i];
      window.app.observe.activePuzzle(key, puzzleEvents[key].bind(this));
    }
  };

  Settings.prototype._registerUIEvents = function() {
    this._getField('changeName').button().click(this.emit.bind(this,
      'changeName'));

    var dropdownFields = ['flavor', 'icon', 'scrambleType', 'scrambler',
      'timerInput', 'update'];
    for (var i = 0, len = dropdownFields.length; i < len; ++i) {
      this._getField(dropdownFields[i]).dropdown().onChange =
        this.emit.bind(this, dropdownFields[i] + 'Changed');
    }

    var checkboxes = ['bld', 'inspection', 'righty', 'theaterMode'];
    for (var i = 0, len = checkboxes.length; i < len; ++i) {
      this._getField(checkboxes[i]).checkbox().onChange =
        this.emit.bind(this, checkboxes[i] + 'Changed');
    }
  };

  Settings.prototype._updateBLD = function() {
    var input = window.app.store.getActivePuzzle().timerInput;
    var bld = (input === window.app.TimerController.INPUT_BLD);
    this._getField('bld').checkbox().setChecked(bld);
  };

  Settings.prototype._updateFlavor = function() {
    this._getField('flavor').dropdown().setValue(
      window.app.flavors.idToName(window.app.store.getGlobalSettings().flavor)
    );
  };

  Settings.prototype._updateIcon = function() {
    var fileName = window.app.store.getActivePuzzle().icon;
    this._getField('icon').dropdown().setValue(
      window.app.iconFilesToNames[fileName]
    );
    this._$puzzleIcon.css({
      backgroundImage: 'url(images/puzzles/' + fileName + '.png)'
    });
  };

  Settings.prototype._updateInspection = function(animate) {
    var field = this._getField('inspection');
    var checkbox = field.checkbox();
    var input = window.app.store.getActivePuzzle().timerInput;
    if (input === window.app.TimerController.INPUT_BLD) {
      checkbox.setChecked(false);
      field.enabled = false;
    } else if (input === window.app.TimerController.INPUT_INSPECTION) {
      checkbox.setChecked(true);
      field.enabled = true;
    } else {
      checkbox.setChecked(false);
      field.enabled = true;
    }
    field.updateEnabled(animate);
  };

  Settings.prototype._updateName = function() {
    this._$puzzleName.text(window.app.store.getActivePuzzle().name);
  };

  Settings.prototype._updateRighty = function() {
    this._getField('righty').checkbox().setChecked(
      window.app.store.getGlobalSettings().righty
    );
  };

  Settings.prototype._updateScrambleType = function() {
    this._getField('scrambleType').dropdown().setValue(
      window.app.store.getActivePuzzle().scrambleType
    );
  };

  Settings.prototype._updateScrambleTypes = function(animate) {
    var scrambleTypes = [];
    var scrambler = this.getScrambler();
    if (scrambler !== 'None') {
      var scramblers = window.puzzlejs.scrambler.scramblersForPuzzle(scrambler);
      for (var i = 0, len = scramblers.length; i < len; ++i) {
        scrambleTypes[i] = scramblers[i].name;
      }
    }

    var wasVisible = this._scrambleTypeVisible;
    this._scrambleTypeVisible = (scrambleTypes.length > 1);

    if (this._scrambleTypeVisible) {
      this._getField('scrambleType').dropdown().setOptions(scrambleTypes);
    }

    if (this._scrambleTypeVisible !== wasVisible) {
      this._layoutFields(animate);
      var $element = this._getField('scrambleType').element();
      if (animate) {
        $element.stop(true, true);
        if (this._scrambleTypeVisible) {
          $element.fadeIn();
        } else {
          $element.fadeOut();
        }
      } else {
        if (this._scrambleTypeVisible) {
          $element.css({display: 'block', opacity: 1});
        } else {
          $element.css({display: 'none', opacity: 0});
        }
      }
    }
  };

  Settings.prototype._updateScrambler = function() {
    this._getField('scrambler').dropdown().setValue(
      window.app.store.getActivePuzzle().scrambler
    );
  };

  Settings.prototype._updateTheaterMode = function() {
    this._getField('theaterMode').checkbox().setChecked(
      window.app.store.getGlobalSettings().theaterMode
    );
  };

  Settings.prototype._updateTimerInput = function(animate) {
    var input = window.app.store.getActivePuzzle().timerInput;
    var mode = null;
    if (input === window.app.TimerController.INPUT_REGULAR) {
      mode = 'Regular';
    } else if (input === window.app.TimerController.INPUT_ENTRY) {
      mode = 'Manual Entry';
    } else if (input === window.app.TimerController.INPUT_STACKMAT) {
      mode = 'Stackmat';
    }
    var field = this._getField('timerInput');
    if (mode === null) {
      field.enabled = false;
      field.dropdown().setValue('Regular');
    } else {
      field.enabled = true;
      field.dropdown().setValue(mode);
    }
    field.updateEnabled(animate);
  };

  Settings.prototype._updateUpdate = function() {
    this._getField('update').dropdown().setSelected(
      window.app.store.getGlobalSettings().timerAccuracy
    );
  };

  function Column(maxHeight) {
    this._maxHeight = maxHeight;
    this._fields = [];
    this._height = 0;
  }

  Column.prototype.addFields = function(fields) {
    var requiredHeight = 0;
    for (var i = 0, len = fields.length; i < len; ++i) {
      requiredHeight += fields[i].height();
    }
    var newHeight = this._height + requiredHeight +
      MINIMUM_ROW_SPACE*(fields.length + this._fields.length + 1);
    if (newHeight > this._maxHeight) {
      return false;
    }
    for (var i = 0, len = fields.length; i < len; ++i) {
      this._fields.push(fields[i]);
    }
    this._height += requiredHeight;
    return true;
  };

  Column.prototype.layoutAtLeft = function(x, animate) {
    var spacing = (this._maxHeight - this._height) / (this._fields.length + 1);
    if (spacing > MAXIMUM_ROW_SPACE) {
      spacing = MAXIMUM_ROW_SPACE;
    }
    var contentHeight = spacing*(this._fields.length - 1) + this._height;
    var top = (this._maxHeight - contentHeight) / 2;
    var width = this.width();
    for (var i = 0, len = this._fields.length; i < len; ++i) {
      var field = this._fields[i];
      var $element = field.element();
      var attrs = {left: x, width: width, top: Math.floor(top)};
      if (animate) {
        $element.animate(attrs);
      } else {
        $element.css(attrs);
      }
      top += spacing + field.height();
    }
  };

  Column.prototype.removeField = function(field) {
    var index = this._fields.indexOf(field);
    if (index >= 0) {
      this._height -= field.height();
      this._fields.splice(index, 1);
    }
  };

  Column.prototype.width = function() {
    var width = 0;
    for (var i = 0, len = this._fields.length; i < len; ++i) {
      width = Math.max(width, this._fields[i].width());
    }
    return width;
  };

  // A Field is an abstract row in the settings tab.
  function Field() {
    this.showingEnabled = true;
    this.enabled = true;
  }

  Field.prototype.updateEnabled = function(animate) {
    if (this.showingEnabled === this.enabled) {
      return;
    }
    if (this.enabled) {
      if (animate) {
        this.element().css({pointerEvents: 'auto'}).animate({opacity: 1},
          'fast');
      } else {
        this.element().css({pointerEvents: 'auto', opacity: 1});
      }
    } else {
      if (animate) {
        this.element().css({pointerEvents: 'none'}).animate({opacity: 0.5},
          'fast');
      } else {
        this.element().css({pointerEvents: 'none', opacity: 0.5});
      }
    }
    this.showingEnabled = this.enabled;
  };

  // A ButtonField implements the field interface for a custom button.
  function ButtonField(title) {
    Field.call(this);

    var $button = $('<button class="flavor-background"></button>');
    $button.css({
      fontSize: FONT_SIZE + 'px',
      height: BUTTON_HEIGHT,
      width: BUTTON_WIDTH
    });
    $button.text(title);

    this._$button = $button;
    this._$element = $('<div class="field button-field"></div>');
    this._$element.append($button);
  }

  ButtonField.prototype = Object.create(Field.prototype);

  // button returns the field's button.
  ButtonField.prototype.button = function() {
    return this._$button;
  };

  // element returns the field's element.
  ButtonField.prototype.element = function() {
    return this._$element;
  };

  // height returns BUTTON_HEIGHT.
  ButtonField.prototype.height = function() {
    return BUTTON_HEIGHT;
  };

  // width returns the width of the button.
  ButtonField.prototype.width = function() {
    return BUTTON_WIDTH;
  };

  // A LabelField is a field which contains a label and nothing else.
  function LabelField(name) {
    Field.call(this);

    // Create the label element.
    this._$label = $('<label></label>');
    this._$label.text(name);
    this._$label.css({
      fontSize: FONT_SIZE + 'px',
      lineHeight: RECTANGULAR_FIELD_HEIGHT + 'px',
      height: RECTANGULAR_FIELD_HEIGHT + 'px',
      visibility: 'hidden',
      position: 'fixed'
    });

    // Compute the label's metrics.
    $(document.body).append(this._$label);
    this._labelHeight = this._$label.outerWidth();
    this._labelWidth = this._$label.outerWidth();
    this._$label.detach();
    this._$label.css({visibility: '', position: ''});
  }

  LabelField.prototype = Object.create(Field.prototype);

  // element returns the label.
  LabelField.prototype.element = function() {
    return this._$label;
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
    this._$element = $('<div class="field check-field"></div>');
    this._$element.append(LabelField.prototype.element.call(this));
    this._$element.append(this._checkbox.element());
  }

  CheckField.prototype = Object.create(LabelField.prototype);

  // checkbox returns the checkbox
  CheckField.prototype.checkbox = function() {
    return this._checkbox;
  };

  // element returns the element containing both the label and the checkbox.
  CheckField.prototype.element = function() {
    return this._$element;
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
      '#f0f0f0', RECTANGULAR_FIELD_HEIGHT, FONT_SIZE);

    // Create the field element.
    this._$element = $('<div class="field dropdown-field"></div>');
    this._$element.append(LabelField.prototype.element.call(this));
    this._$element.append(this._dropdown.element());
  }

  DropdownField.prototype = Object.create(LabelField.prototype);

  // dropdown returns the dropdown in the field.
  DropdownField.prototype.dropdown = function() {
    return this._dropdown;
  };

  // element returns an element containing the dropdown and the label.
  DropdownField.prototype.element = function() {
    return this._$element;
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

  window.app.Settings = Settings;

})();
