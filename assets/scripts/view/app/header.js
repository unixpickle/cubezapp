(function() {

  // This is the height of the dropdown contents.
  var DROPDOWN_HEIGHT = 200;

  // This is the width of each puzzle in the dropdown.
  var PUZZLE_WIDTH = 180;

  // This is the number of pixels between each puzzle in the dropdown.
  var SPACING = 18;

  // These values represent different states of the header.
  var STATE_CLOSED = 0;
  var STATE_OPEN = 1;
  var STATE_DELETING = 2;

  function Header() {
    window.app.EventEmitter.call(this);

    this._$element = $('#header');
    this._$puzzleActions = this._$element.find('.puzzle-actions');
    this._$puzzleName = this._$element.find('.name');
    this._dropdown = new Dropdown();

    // Setup the shielding for when the dropdown is down.
    this._$shielding = $('<div></div>');
    this._$shielding.css({
      position: 'fixed',
      width: '100%',
      height: '100%',
      display: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      webkitBackfaceVisibility: 'hidden'
    });
    this._$shielding.insertBefore(this._$element);
    this._$shielding.click(this.close.bind(this));

    this._state = STATE_CLOSED;
    this._empty = (window.app.store.getPuzzles().length <= 1);

    this._$puzzleName.text(window.app.store.getActivePuzzle().name);

    this._registerUIEvents();
    this._registerModelEvents();
  }

  Header.prototype = Object.create(window.app.EventEmitter.prototype);

  Header.prototype.close = function() {
    if (this._state === STATE_CLOSED) {
      return;
    } else if (this._state === STATE_DELETING) {
      this._dropdown.hideDeleteButtons();
    }

    this._dropdown.close();

    this._$shielding.stop(true, false);
    this._$shielding.fadeOut();

    if (!this._empty) {
      this._$puzzleActions.stop(true, false).fadeOut();
    }

    this._state = STATE_CLOSED;

    window.app.keyboard.remove(this);
  };

  Header.prototype.height = function() {
    return 44;
  };

  Header.prototype.keydown = function(e) {
    if (e.which === 27) {
      this.close();
    }
    return false;
  };

  Header.prototype.layout = function(attrs) {
    if (attrs.headerOpacity === 0) {
      this._$element.css({display: 'none'});
    } else {
      this._$element.css({
        display: 'block',
        opacity: attrs.headerOpacity,
        top: attrs.headerOffset
      });
    }
  };

  Header.prototype.open = function() {
    if (this._state !== STATE_CLOSED) {
      return;
    }

    this._dropdown.open();

    this._$shielding.stop(true, false).fadeIn();
    if (!this._empty) {
      this._$puzzleActions.stop(true, false).fadeIn();
    }

    this._state = STATE_OPEN;

    window.app.keyboard.push(this);
  };

  Header.prototype._deleteClicked = function() {
    if (this._state === STATE_DELETING) {
      this._dropdown.hideDeleteButtons();
      this._state = STATE_OPEN;
    } else if (this._state === STATE_OPEN) {
      this._dropdown.showDeleteButtons();
      this._state = STATE_DELETING;
    }
  };

  Header.prototype._handleCountChange = function() {
    var wasEmpty = this._empty;
    this._empty = (window.app.store.getPuzzles().length <= 1);

    if (this._state === STATE_CLOSED || this._empty === wasEmpty) {
      return;
    }

    // This can only happen if a remote client deletes all the puzzles except
    // one while this client is in delete mode.
    if (this._state === STATE_DELETING) {
      this._dropdown.hideDeleteButtons();
      this._state = STATE_OPEN;
    }

    if (this._empty) {
      this._$puzzleActions.stop(true, false).fadeOut();
    } else {
      this._$puzzleActions.stop(true, false).fadeIn();
    }
  };

  Header.prototype._handleNameChange = function() {
    this._$puzzleName.text(window.app.store.getActivePuzzle().name);
  };

  Header.prototype._registerModelEvents = function() {
    window.app.observe.puzzleCount(this._handleCountChange.bind(this));
    window.app.observe.activePuzzle('name', this._handleNameChange.bind(this));
  };

  Header.prototype._registerUIEvents = function() {
    this._$puzzleName.click(this._toggle.bind(this));
    this._dropdown.onAdd = this.emit.bind(this, 'addPuzzle');
    this._dropdown.onDelete = function(id) {
      this._dropdown.hideDeleteButtons();
      this._state = STATE_OPEN;
      this.emit('deletePuzzle', id);
    }.bind(this);
    this._dropdown.onSwitch = this.emit.bind(this, 'switchPuzzle');
    this._$puzzleActions.find('.add').click(this.emit.bind(this, 'addPuzzle'));
    this._$puzzleActions.find('.remove').click(this._deleteClicked.bind(this));
  };

  Header.prototype._toggle = function() {
    switch (this._state) {
    case STATE_DELETING:
    case STATE_OPEN:
      this.close();
      break;
    case STATE_CLOSED:
      this.open();
      break;
    default:
      throw new Error('unknown state: ' + this._state);
    }
  };

  // Dropdown manages the puzzles dropdown.
  function Dropdown() {
    this._$element = $('#puzzles');
    this._$contents = this._$element.find('.contents');
    this._$deleteButtons = $();
    this._puzzleElements = [];
    this._puzzleIdToElement = {};

    // This pre-bound handler is used to capture browser resize events for the
    // scrollbar.
    this._scrollHandler = this._resizeForScrollbar.bind(this);

    this._isDeleting = false;
    this._isOpen = false;
    this._updateOnOpen = false;

    this.onAdd = null;
    this.onDelete = null;
    this.onSwitch = null;

    this._generateContents();
    this._registerModelEvents();
  }

  Dropdown.prototype.close = function() {
    this._isOpen = false;
    this._$contents.css({'overflow-x': 'hidden'});
    this._$element.stop(true, false);
    this._$element.slideUp();
    window.app.windowSize.removeListener(this._scrollHandler);
  };

  Dropdown.prototype.hideDeleteButtons = function() {
    this._$deleteButtons.stop(true, false).fadeOut();
    this._isDeleting = false;
  };

  Dropdown.prototype.open = function() {
    this._isOpen = true;
    if (this._updateOnOpen) {
      this._updateOnOpen = false;
      this._generateContents();
    }
    this._$element.stop(true, false);
    this._$element.slideDown({complete: this._enableScrolling.bind(this)});
  };

  Dropdown.prototype.showDeleteButtons = function() {
    this._$deleteButtons.stop(true, false).fadeIn();
    this._isDeleting = true;
  };

  Dropdown.prototype._deletePuzzleFromDOM = function($deleteElement) {
    var idx = this._puzzleElements.indexOf($deleteElement);
    var $deleteButton = this._$deleteButtons.eq(idx);

    this._puzzleElements.splice(idx, 1);
    this._$deleteButtons = this._$deleteButtons.not($deleteButton);

    $([$deleteElement[0], $deleteButton[0]]).fadeOut(function() {
      $(this).remove();
    });
  };

  Dropdown.prototype._enableScrolling = function() {
    this._$contents.css({'overflow-x': 'auto'});
    this._resizeForScrollbar();
    window.app.windowSize.addListener(this._scrollHandler);
  };

  Dropdown.prototype._generateContents = function() {
    this._puzzleIdToElement = {};
    this._puzzleElements = [];
    this._$deleteButtons = $();
    this._$contents.empty();

    var puzzles = window.app.store.getPuzzles().slice(1);
    this._empty = (puzzles.length === 0);

    if (this._empty) {
      var button = $('<button class="header-button big-add">Add</button>');
      button.click(function() {
        this.onAdd();
      }.bind(this));
      this._$contents.append(button);
      return;
    }

    // We need a relative positioned div which will contain the puzzle elements.
    var $contents = $('<div class="visible-content"></div>');
    $contents.css({
      position: 'relative',
      height: DROPDOWN_HEIGHT,
      width: puzzles.length*(PUZZLE_WIDTH+SPACING) + SPACING
    });

    var puzzleLeft = SPACING;
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      var puzzle = puzzles[i];

      var $element = generatePuzzleElement(puzzle);
      $element.css({left: puzzleLeft}).click(function(puzzleId) {
        this.onSwitch(puzzleId);
      }.bind(this, puzzle.id));
      $contents.append($element);
      this._puzzleIdToElement[puzzle.id] = $element;
      this._puzzleElements.push($element);

      var $deleteButton = $('<button class="delete">Delete</button>');
      $deleteButton.css({
        left: puzzleLeft + PUZZLE_WIDTH - 15,
        display: (this._isDeleting ? 'block' : 'none')
      }).click(function(puzzleId) {
        this.onDelete(puzzleId);
      }.bind(this, puzzle.id));
      $contents.append($deleteButton);
      this._$deleteButtons = this._$deleteButtons.add($deleteButton);

      puzzleLeft += SPACING + PUZZLE_WIDTH;
    }

    this._$contents.append($contents);
  };

  Dropdown.prototype._puzzleDeleted = function(puzzleId) {
    if (this._puzzleElements.length === 1) {
      this._transitionToEmpty();
      return;
    }

    this._deletePuzzleFromDOM(this._puzzleIdToElement[puzzleId]);
    this._repositionPuzzles();
  };

  Dropdown.prototype._registerModelEvents = function() {
    window.app.store.on('remoteChange', this._generateContents.bind(this));
    window.app.store.on('deletedPuzzle', this._puzzleDeleted.bind(this));

    var closeUpdateLaterEvents = ['addedPuzzle', 'switchedPuzzle'];
    for (var i = 0; i < closeUpdateLaterEvents.length; ++i) {
      var event = closeUpdateLaterEvents[i];
      window.app.store.on(event, function() {
        if (this._isOpen) {
          this.close();
        }
        this._updateOnOpen = true;
      }.bind(this));
    }
  };

  Dropdown.prototype._repositionPuzzles = function() {
    var puzzleLeft = SPACING;
    for (var i = 0, len = this._puzzleElements.length; i < len; ++i) {
      var $element = this._puzzleElements[i];
      $element.animate({left: puzzleLeft});
      var deleteLeft = puzzleLeft + PUZZLE_WIDTH - 15;
      this._$deleteButtons.eq(i).animate({left: deleteLeft});
      puzzleLeft += SPACING + PUZZLE_WIDTH;
    }
  };

  Dropdown.prototype._resizeForScrollbar = function() {
    // Figure out how much space the scrollbar is taking.
    var clientHeight = this._$contents[0].clientHeight ||
      this._$contents.height();
    var difference = this._$contents.height() - clientHeight;

    // Compute the new height and set it if needed.
    var newHeight = DROPDOWN_HEIGHT + difference;
    if (newHeight != this._$element.height()) {
      this._$element.height(newHeight);
    }
  };

  Dropdown.prototype._transitionToEmpty = function() {
    this._empty = true;
    this._puzzleElements = [];
    this._$deleteButtons = $();
    this._puzzleIdToElement = {};

    this._$contents.children('div').fadeOut(function() {
      $(this).remove();
    });

    var button = $('<button class="header-button big-add">Add</button>');
    button.css({display: 'none'}).click(function() {
      this.onAdd();
    }.bind(this));
    this._$contents.append(button);
    button.fadeIn();
  };

  function generatePuzzleElement(puzzle) {
    var element = $('<div class="puzzle"></div>');
    var label = $('<label></label>');
    label.text(puzzle.name);
    var icon = $('<div class="icon flavor-background"></div>');
    icon.css({
      'background-image': 'url(images/puzzles/' + puzzle.icon + '.png)'
    });
    element.append(icon);
    element.append(label);
    return element;
  }

  window.app.Header = Header;

})();
