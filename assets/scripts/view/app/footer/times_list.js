(function() {

  var LIST_WIDTH = 150;

  function TimesList() {
    this._$element = $('#footer .stats-contents .times');
    this._registerModelEvents();
    this._refillAll();
  }

  TimesList.prototype.layout = function(width) {
    this._$element.css({width: width || LIST_WIDTH});
  };

  TimesList.prototype.width = function() {
    return this._$element.width();
  };

  TimesList.prototype._addRowForSolve = function(solve) {
    var row = generateRowForSolve(solve);
    this._$element.prepend(row);
  };

  TimesList.prototype._refillAll = function() {
    var count = window.app.store.getSolveCount();
    window.app.store.getSolves(0, count, function(err, solves) {
      if (err !== null) {
        return;
      }
      this._$element.empty();
      for (var i = solves.length-1; i >= 0; --i) {
        var row = generateRowForSolve(solves[i]);
        this._$element.append(row);
      }
    }.bind(this));
  };

  TimesList.prototype._registerModelEvents = function() {
    window.app.store.on('addedSolve', this._addRowForSolve.bind(this));
    var reload = this._refillAll.bind(this);
    var events = ['addedPuzzle', 'deletedSolve', 'modifiedSolve',
      'remoteChange', 'switchedPuzzle'];
    for (var i = 0, len = events.length; i < len; ++i) {
      window.app.store.on(events[i], reload);
    }
  };

  function generateRowForSolve(solve) {
    var time = window.app.solveTime(solve);
    var timeText = window.app.formatTime(time);
    if (solve.plus2) {
      timeText += '+';
    }
    if (solve.dnf) {
      timeText = '<s>' + timeText + '</s>';
    }
    var row = '<div class="row"><label>' + timeText +
      '</label><button class="delete"></button></div>';
    var $row = $(row);
    if (window.app.showSolveAsPB(solve)) {
      $row.find('label').addClass('flavor-text');
    } else {
      $row.find('label').addClass('not-pb');
    }
    $row.find('.delete').click(function() {
      window.app.store.deleteSolve(solve.id);
    });
    return $row;
  }

  window.app.TimesList = TimesList;

})();
