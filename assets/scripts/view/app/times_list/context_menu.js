(function() {

  var MENU_STYLE = {fontWeight: '300'};

  // TimesListContextMenu presents a menu for a user to modify an existing
  // solve.
  //
  // This is an EventEmitter which emits the following events:
  // - delete
  // - viewScramble
  // - addComment
  // - moveTo(puzzleId)
  // - removePenalty
  // - plus2
  // - dnf
  function TimesListContextMenu(solve, $rowElement) {
    window.app.EventEmitter.call(this);

    this._solve = solve;
    this._penaltyTitle = 'Add Penalty';
    if (solve.plus2 || solve.dnf) {
      this._penaltyTitle = 'Change Penalty';
    }

    var mainPage = new window.contextjs.Page([
      new window.contextjs.TextRow('Delete Time', MENU_STYLE),
      new window.contextjs.ExpandableRow(this._penaltyTitle, MENU_STYLE),
      new window.contextjs.TextRow('View Scramble', MENU_STYLE),
      new window.contextjs.TextRow('Add Comment', MENU_STYLE),
      new window.contextjs.ExpandableRow('Move To', MENU_STYLE)
    ]);
    mainPage.onClick = this._mainPageClick.bind(this);

    var context = new window.contextjs.Context($rowElement, $('#footer'));
    this._menu = new window.contextjs.Menu(context, mainPage);
    this._menu.show();
  }

  TimesListContextMenu.prototype =
    Object.create(window.app.EventEmitter.prototype);

  TimesListContextMenu.prototype.hide = function() {
    this._menu.hide();
  };

  TimesListContextMenu.prototype._mainPageClick = function(index) {
    switch (index) {
    case 0:
      this.emit('delete');
      break;
    case 1:
      this._showPenaltyPage();
      return;
    case 2:
      this.emit('viewScramble');
      break;
    case 3:
      this.emit('addComment');
      break;
    case 4:
      this._showMoveToPage();
      return;
    }
    this._menu.hide();
  };

  TimesListContextMenu.prototype._showMoveToPage = function() {
    var menuRows = [new window.contextjs.BackRow('Move To', MENU_STYLE)];
    var puzzles = window.app.store.getInactivePuzzles();
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      var puzzle = puzzles[i];
      menuRows.push(new window.contextjs.TextRow(puzzle.name, MENU_STYLE));
    }

    var page = new window.contextjs.Page(menuRows);
    page.onClick = function(itemIndex) {
      if (itemIndex === 0) {
        this._menu.popPage();
      } else {
        var puzzleId = puzzles[itemIndex-1].id;
        this.emit('moveTo', puzzleId);
        this._menu.hide();
      }
    }.bind(this);
    this._menu.pushPage(page);
  };

  TimesListContextMenu.prototype._showPenaltyPage = function() {
    var noneChecked = !this._solve.dnf && !this._solve.plus2;
    var page = new window.contextjs.Page([
      new window.contextjs.BackRow(this._penaltyTitle, MENU_STYLE),
      new window.contextjs.CheckRow(noneChecked, 'None', MENU_STYLE),
      new window.contextjs.CheckRow(this._solve.plus2, '+2', MENU_STYLE),
      new window.contextjs.CheckRow(this._solve.dnf, 'DNF', MENU_STYLE)
    ]);
    page.onClick = function(itemIndex) {
      if (itemIndex === 0) {
        this._menu.popPage();
      } else {
        this.emit(['removePenalty', 'plus2', 'dnf'][itemIndex-1]);
        this._menu.hide();
      }
    }.bind(this);
    this._menu.pushPage(page);
  };

  window.app.TimesListContextMenu = TimesListContextMenu;

})();
