(function() {
  
  var FIELD_WIDTH = 120;
  var FIELD_HEIGHT = 30;
  var MIDDLE_HEIGHT = 200;
  
  var POPUP_WIDTH = 500;
  var POPUP_HEIGHT = 344;
  
  // I put this code here because it doesn't really belong in the DOM and I
  // don't know where else to put it...
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
      <div class="bottom"> \
        <button class="done theme-background">Create</button> \
      </div> \
    </div>';
  
  function AddPopup() {
    this._element = $(popupHTML);
    this._fields = this._element.find('.fields');
    this._puzzleIcon = this._element.find('.puzzle .icon');
    this._puzzleName = this._element.find('.puzzle label');
    
    // This state is used to know whether or not to play an animation to show
    // the subscramble dropdown.
    this._showingSubscramble = false;
    
    // Create this so our hidden class is complete before we start doing stuff.
    this._popup = null;
    
    // Create hidden class with fields.
    this._bldField = null;
    this._iconField = null;
    this._iconDropdown = null;
    this._nameField = null;
    this._nameInput = null;
    this._scrambleField = null;
    this._scrambleDropdown = null;
    this._subscrambleField = null;
    this._subscrambleDropdown = null;
    
    // Generate fields.
    this._createBLDField();
    this._createIconField();
    this._createNameField();
    this._createScrambleField();
    this._createSubscrambleField();
    
    // Layout the fields.
    this._initialLayout();
    
    // Create the actual popup.
    this._popup = new window.app.Popup(this._element, POPUP_WIDTH,
      POPUP_HEIGHT);
    
    // Setup done button.
    var doneButton = this._element.find('.done');
    doneButton.one('click', this._done.bind(this));
  }
  
  AddPopup.prototype.show = function() {
    this._popup.show();
  };
  
  AddPopup.prototype._createBLDField = function() {
    this._bldField = $('\
      <div class="field"> \
        <label>BLD</label> \
      </div> \
    ');
  };
  
  AddPopup.prototype._createIconField = function() {
    this._iconDropdown = new window.app.Dropdown(FIELD_WIDTH);
    this._iconDropdown.setOptions(window.app.iconNames,
      window.app.iconNames.indexOf('3x3x3'));
    this._iconField = $('\
      <div class="field"> \
        <label>Icon</label> \
        <div class="content"></div> \
      </div> \
    ');
    this._iconField.find('.content').append(this._iconDropdown.element());
    
    // Changing the icon field changes the icon in the preview.
    this._iconDropdown.onChange = function() {
      // Get the filename corresponding to the icon name.
      var name = window.app.iconFiles[this._iconDropdown.selected()];
      this._puzzleIcon.css({
        backgroundImage: 'url(images/puzzles/' + name + '.png)'
      });
    }.bind(this);
  };
  
  AddPopup.prototype._createNameField = function() {
    this._nameField = $('\
      <div class="field"> \
        <label>Name</label> \
        <div class="content"> \
          <input placeholder="Name" /> \
        </div> \
      </div> \
    ');
    this._nameInput = this._nameField.find('input');
    
    // When the text changes, change the puzzle name on the left.
    this._nameInput.keydown(function() {
      // The text isn't changed by the keydown, so we wait 10ms.
      setTimeout(function() {
        this._puzzleName.text(this._nameInput.val() || 'Name');
      }.bind(this), 10);
    }.bind(this));
    this._nameInput.change(function() {
      this._puzzleName.text(this._nameInput.val() || 'Name');
    }.bind(this));
  };
  
  AddPopup.prototype._createScrambleField = function() {
    var puzzles = window.puzzlejs.scrambler.allPuzzles();
    puzzles.unshift('None');
    
    this._scrambleDropdown = new window.app.Dropdown(FIELD_WIDTH);
    this._scrambleDropdown.setOptions(puzzles, 0);
    this._scrambleField = $('\
      <div class="field"> \
        <label>Scramble</label> \
        <div class="content"></div> \
      </div> \
    ');
    var el = this._scrambleDropdown.element();
    this._scrambleField.find('.content').append(el);
    
    // When the scramble changes, it changes the subscrambles.
    this._scrambleDropdown.onChange = this._scrambleChanged.bind(this);
  };
  
  AddPopup.prototype._createSubscrambleField = function() {
    this._subscrambleDropdown = new window.app.Dropdown(FIELD_WIDTH);
    this._subscrambleField = $('\
      <div class="field"> \
        <div class="content"></div> \
      </div> \
    ');
    var el = this._subscrambleDropdown.element();
    this._subscrambleField.find('.content').append(el);
    this._subscrambleField.css({display: 'none'});
  };
  
  // _done process the user's input and creates a puzzle.
  AddPopup.prototype._done = function() {
    var name = this._nameInput.val();
    if (name === '') {
      // TODO: make the field shake.
      this._nameInput.focus();
      return;
    }
    
    // Fiend the info they selected.
    var icon = window.app.iconFiles[this._iconDropdown.selected()];
    var scrambler = this._scrambleDropdown.value();
    var subscramblers = this._subscramblers();
    var subscrambler = '';
    if (subscramblers.length === 1) {
      subscrambler = subscramblers[0];
    } else if (subscramblers.length > 1) {
      subscrambler = this._subscrambleDropdown.value();
    }
    
    // TODO: support BLD checkbox.
    
    // Close this popup and the header popup behind it.
    this._popup.close();
    window.app.view.closePuzzles();
    
    // Add the puzzle and switch to it.
    window.app.home.addPuzzle({
      name: name,
      icon: icon,
      scrambler: scrambler,
      scrambleType: subscrambler,
      scrambleLength: 0,
      lastUsed: new Date().getTime()
    });
  };
  
  // _fieldPositions computes the top coordinates for each field.
  AddPopup.prototype._fieldPositions = function() {
    if (this._showingSubscramble) {
      var contentHeight = FIELD_HEIGHT * 5;
      var spacing = (MIDDLE_HEIGHT-contentHeight) / 6;
      var tops = [];
      for (var i = 0; i < 5; ++i) {
        if (i !== 3) {
          tops.push(spacing*(i+1) + FIELD_HEIGHT*i);
        }
      }
      return tops;
    } else {
      var contentHeight = FIELD_HEIGHT * 4;
      var spacing = (MIDDLE_HEIGHT-contentHeight) / 5;
      var tops = [];
      for (var i = 0; i < 4; ++i) {
        tops[i] = spacing*(i+1) + FIELD_HEIGHT*i;
      }
      return tops;
    }
  };
  
  // _initialLayout puts the fields in their respective places.
  AddPopup.prototype._initialLayout = function() {
    // Compute the subscramble field's position.
    var contentHeight = FIELD_HEIGHT * 5;
    var spacing = (MIDDLE_HEIGHT-contentHeight) / 6;
    this._subscrambleField.css({top: spacing*4 + FIELD_HEIGHT*3});
    
    // Compute the position for the rest of the fields and append them.
    var positions = this._fieldPositions();
    var fields = [this._nameField, this._iconField, this._scrambleField,
      this._bldField];
    for (var i = 0; i < 4; ++i) {
      fields[i].css({top: positions[i]});
      this._fields.append(fields[i]);
    }
    this._fields.append(this._subscrambleField);
  };
  
  AddPopup.prototype._scrambleChanged = function() {
    var subScramblers = this._subscramblers();
    var showSub = (subScramblers.length > 1);
    
    // Update the subscramblers in the dropdown if possible.
    if (showSub) {
      this._subscrambleDropdown.setOptions(subScramblers, 0);
    }
    
    // If the subscramble visibility did not change, no animation or relayout is
    // needed.
    if (showSub === this._showingSubscramble) {
      return;
    }
    
    this._showingSubscramble = showSub;
    
    // Animate all elements to their new positions.
    var positions = this._fieldPositions();
    var fields = [this._nameField, this._iconField, this._scrambleField,
      this._bldField];
    for (var i = 0; i < 4; ++i) {
      var y = positions[i];
      fields[i].animate({top: y});
    }
    
    // Fade in/out the subscramble field.
    if (showSub) {
      this._subscrambleField.fadeIn();
    } else {
      this._subscrambleField.fadeOut();
    }
  };
  
  AddPopup.prototype._subscramblers = function() {
    var puzzle = this._scrambleDropdown.value();
    if (puzzle === 'None') {
      return [];
    }
    
    return ['Moves', 'State'];
    
    var names = [];
    var scramblers = window.puzzlejs.scrambler.scramblersForPuzzle(puzzle);
    for (var i = 0, len = scramblers.length; i < len; ++i) {
      names[i] = scramblers[i].name;
    }
    return names;
  };
  
  window.app.AddPopup = AddPopup;
  
})();