(function() {

  function TimesListContextMenu(solve, $rowElement) {
    window.app.EventEmitter.call(this);

    var style = {fontWeight: '300'};
    var penaltyTitle = 'Add Penalty';
    if (solve.plus2 || solve.dnf) {
      penaltyTitle = 'Change Penalty';
    }
    var mainPage = new window.contextjs.Page([
      new window.contextjs.TextRow('Delete Time', style),
      new window.contextjs.ExpandableRow(penaltyTitle, style),
      new window.contextjs.TextRow('View Scramble', style),
      new window.contextjs.TextRow('Add Comment', style),
      new window.contextjs.ExpandableRow('Move To', style)
    ]);
    mainPage.onClick = this._mainPageClick.bind(this)
    
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
      // TODO: show the penalty page here.
      break;
    case 2:
      this.emit('viewScramble');
      break;
    case 3:
      this.emit('addComment');
      break;
    case 4:
      // TODO: show the move-to-puzzle context here.
      break;
    }
    this._menu.hide();
  };
  
  window.app.TimesListContextMenu = TimesListContextMenu;

})();
