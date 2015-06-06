(function() {

  var FIELD_WIDTH = 160;
  var FIELD_HEIGHT = 30;

  function AddPopup() {
    window.app.EventEmitter.call(this);

    this._viewModel = new ViewModel();

    var $element = $('<div class="add-popup-content"></div>');

    var $puzzle = $('<div class="add-popup-puzzle"></div>');
    this._$puzzleIcon = $('<div class="flavor-background ' +
      'add-popup-puzzle-icon"></div>');
    this._$puzzleName = $('<label class="add-popup-puzzle-label"></label>');
    $puzzle.append(this._$puzzleIcon, this._$puzzleName);
    $element.append($puzzle);

    this._$fieldContainer = $('<div class="add-popup-fields"></div>');
    $element.append(this._$fieldContainer);

    this._fields = {};
    this._addField('name', 'Name', createNameField());
    this._addField('icon', 'Icon', createDropdown(window.app.iconNames,
      window.app.iconNames.indexOf('3x3x3')));
    this._addField('scrambler', 'Scramble', createDropdown(scrambleNames(), 0));
    this._addField('scrambleType', '', createDropdown());
    this._addField('bld', 'BLD', window.app.flavors.makeCheckbox());

    var $separator = $('<div class="add-popup-separator"></div>');
    $element.append($separator);

    this._dialog = new window.app.Dialog('New Puzzle', $element, ['Create']);
    this._dialog.on('action', this.emit.bind(this, 'create'));
    this._dialog.on('close', this._handleClose.bind(this));

    this._registerUIEvents();
    this._registerViewModelEvents();
    this._viewModel.emitCurrentValues();
  }

  AddPopup.prototype = Object.create(window.app.EventEmitter.prototype);

  AddPopup.prototype.close = function() {
    this._dialog.close();
    this._handleClose();
  };

  AddPopup.prototype.shakeName = function() {
    var $nameInput = this._getField('name');
    $nameInput.focus();
    window.app.runShakeAnimation($nameInput[0]);
  };

  AddPopup.prototype.show = function() {
    this._dialog.show();
  };

  AddPopup.prototype.viewModel = function() {
    return this._viewModel;
  };

  AddPopup.prototype._addField = function(rawName, name, input) {
    var field = new Field(rawName, name, input);
    this._fields[rawName] = field.input();

    // We use prepend to make sure the z order is correct.
    this._$fieldContainer.prepend(field.element());
  };

  AddPopup.prototype._getField = function(rawName) {
    return this._fields[rawName];
  };

  // _handleClose cleans up the components of the popup after the user is done
  // with it.
  AddPopup.prototype._handleClose = function() {
    var dropdownNames = ['icon', 'scrambler', 'scrambleType']
    for (var i = 0, len = dropdownNames.length; i < len; ++i) {
      this._getField(dropdownNames[i]).close();
    }
    window.app.flavors.removeCheckbox(this._getField('bld'));
  };

  AddPopup.prototype._registerUIEvents = function() {
    var $nameInput = this._getField('name');
    var updateName = function() {
      this._viewModel.setField('name', $nameInput.val());
    }.bind(this);
    // NOTE: the text isn't changed before the keydown, so we use setTimeout.
    $nameInput.keydown(setTimeout.bind(null, updateName, 10));
    $nameInput.change(updateName);

    var scramblerDropdown = this._getField('scrambler');
    scramblerDropdown.onChange = function() {
      this._viewModel.setField('scrambler', scramblerDropdown.getValue());
    }.bind(this);

    var scrambleTypeDropdown = this._getField('scrambleType');
    scrambleTypeDropdown.onChange = function() {
      this._viewModel.setField('scrambleType', scrambleTypeDropdown.getValue());
    }.bind(this);

    var iconDropdown = this._getField('icon');
    iconDropdown.onChange = function() {
      var fileName = window.app.iconFiles[iconDropdown.getSelected()];
      this._viewModel.setField('icon', fileName);
    }.bind(this);

    var bldCheck = this._getField('bld');
    bldCheck.onChange = function() {
      this._viewModel.setField('bld', bldCheck.getChecked());
    }.bind(this);
  };

  AddPopup.prototype._registerViewModelEvents = function() {
    this._viewModel.on('name', function(name) {
      this._getField('name').val(name);
      if (name.trim().length > 0) {
        this._$puzzleName.text(name.trim());
      } else {
        this._$puzzleName.text('Name');
      }
    }.bind(this));

    this._viewModel.on('scrambler', function(scrambler) {
      this._getField('scrambler').setValue(scrambler);
    }.bind(this));

    this._viewModel.on('scrambleType', function(scrambleType) {
      if (this._viewModel.showScrambleType()) {
        this._getField('scrambleType').setValue(scrambleType);
      }
    }.bind(this));

    this._viewModel.on('icon', function(iconFile) {
      var iconName = window.app.iconFilesToNames[iconFile];
      this._getField('icon').setValue(iconName);
      this._$puzzleIcon.css({backgroundImage: 'url(images/puzzles/' +
        iconFile + '.png)'});
    }.bind(this));

    this._viewModel.on('bld', function(flag) {
      this._getField('bld').setChecked(flag);
    }.bind(this));

    this._viewModel.on('scrambleTypes', this._scrambleTypesChanged.bind(this));
  };

  AddPopup.prototype._scrambleTypesChanged = function() {
    if (this._viewModel.showScrambleType()) {
      var types = this._viewModel.scrambleTypes();
      this._getField('scrambleType').setOptions(types, 0);
      this._$fieldContainer.addClass('add-popup-fields-all');
    } else {
      this._$fieldContainer.removeClass('add-popup-fields-all');
    }
  };

  function Field(rawName, name, input) {
    this._input = input;
    var $input = input;
    if ('function' === typeof input.element) {
      $input = input.element();
    }

    var $nameLabel = $('<label class="add-popup-label"></label>').text(name);
    var $inputContainer = $('<div class="add-popup-input-container"></div>');
    $inputContainer.append($input);
    this._$element = $('<div class="add-popup-field"></div>').append(
      $nameLabel, $inputContainer
    ).addClass('add-popup-' + rawName + '-field');
  }

  Field.prototype.element = function() {
    return this._$element;
  };

  Field.prototype.input = function() {
    return this._input;
  };

  function ViewModel() {
    window.app.EventEmitter.call(this);

    this._fields = {
      name: '',
      icon: '3x3x3',
      scrambler: 'None',
      scrambleType: 'None',
      bld: false
    };

    this._autocompleteFields = ViewModel.FIELD_NAMES.slice();
  }

  ViewModel.FIELD_NAMES = ['scrambler', 'scrambleType', 'icon', 'name', 'bld'];

  ViewModel.prototype = Object.create(window.app.EventEmitter.prototype);

  ViewModel.prototype.emitCurrentValues = function() {
    for (var i = 0, len = ViewModel.FIELD_NAMES.length; i < len; ++i) {
      var name = ViewModel.FIELD_NAMES[i];
      this.emit(name, this.getField(name));
    }
  };

  ViewModel.prototype.getField = function(name) {
    return this._fields[name];
  };

  ViewModel.prototype.scrambleTypes = function() {
    var scrambler = this.getField('scrambler');
    if (scrambler === 'None') {
      return [];
    }
    var names = [];
    var scramblers = window.puzzlejs.scrambler.scramblersForPuzzle(scrambler);
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      names[i] = scramblers[i].name;
    }
    return names;
  };

  ViewModel.prototype.setField = function(name, value) {
    this._removeAutocompleteField(name);
    this._updateAndEmit(name, value);
    this._autocomplete();
  };

  ViewModel.prototype.showScrambleType = function() {
    var scrambler = this.getField('scrambler');
    if (scrambler === 'None') {
      return false;
    }
    return window.puzzlejs.scrambler.scramblersForPuzzle(scrambler).length > 1;
  };

  ViewModel.prototype._autocomplete = function() {
    var predictedBLD = false;
    var predictedName = '';
    var predictedIcon = '';
    var predictedScrambler = '';
    if (!this._canAutocompleteField('bld') && this.getField('bld')) {
      predictedIcon = 'BLD';
    }
    if (!this._canAutocompleteField('scrambler')) {
      var scrambler = this.getField('scrambler');
      predictedName = scrambler;
      var iconIndex = window.app.iconNames.indexOf(scrambler);
      if (iconIndex >= 0) {
        predictedIcon = window.app.iconFiles[iconIndex];
      }
    }
    if (!this._canAutocompleteField('icon')) {
      var iconName = this.getField('icon');
      if (iconName === 'BLD') {
        predictedBLD = true;
      }
      predictedName = window.app.iconFilesToNames[iconName];
      predictedScrambler = scramblerNameMatchingName(iconName);
    }
    if (!this._canAutocompleteField('name')) {
      var name = this.getField('name');
      var index = window.app.iconNames.indexOf(name);
      predictedIcon = window.app.iconFiles[index];
      predictedScrambler = scramblerNameMatchingName(name) ||
        predictedScrambler;
      if (name.toUpperCase().indexOf('BLD') >= 0) {
        predictedBLD = true;
      }
    }
    if (this._canAutocompleteField('bld')) {
      this._updateAndEmit('bld', predictedBLD);
    }
    if (this._canAutocompleteField('name')) {
      this._updateAndEmit('name', predictedName);
    }
    if (this._canAutocompleteField('icon')) {
      this._updateAndEmit('icon', predictedIcon || '3x3x3');
    }
    if (this._canAutocompleteField('scrambler')) {
      this._updateAndEmit('scrambler', predictedScrambler || 'None');
    }
  };

  ViewModel.prototype._canAutocompleteField = function(name) {
    return this._autocompleteFields.indexOf(name) >= 0;
  };

  ViewModel.prototype._removeAutocompleteField = function(name) {
    var index = this._autocompleteFields.indexOf(name);
    if (index >= 0) {
      this._autocompleteFields.splice(index, 1);
    }
  };

  ViewModel.prototype._updateAndEmit = function(name, value) {
    if (this._fields[name] !== value) {
      this._fields[name] = value;
      this.emit(name, value);
      if (name === 'scrambler') {
        this.emit('scrambleTypes');
        this._updateAndEmit('scrambleType', this.scrambleTypes()[0]);
      }
    }
  };

  function createDropdown(options, selected) {
    var dropdown = new window.dropdownjs.Dropdown(FIELD_WIDTH);
    if (options) {
      dropdown.setOptions(options, selected);
    }
    return dropdown;
  }

  function createNameField() {
    return $('<input class="add-popup-text-input" placeholder="Name">');
  }

  function scrambleNames() {
    var names = window.puzzlejs.scrambler.allPuzzles();
    names.unshift('None');
    return names;
  }

  function scramblerNameMatchingName(name) {
    var lowerName = name.toLowerCase();
    var scramblers = window.puzzlejs.scrambler.allPuzzles();
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      if (scramblers[i].toLowerCase() === lowerName) {
        return scramblers[i];
      }
    }
    return '';
  }

  window.app.AddPopup = AddPopup;

})();
