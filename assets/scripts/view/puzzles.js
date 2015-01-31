(function() {
  
  function Puzzles() {
    this.element = $('#puzzles-dropdown');
    this.showing = false;
    window.app.store.onPuzzlesChanged = this._update.bind(this);
    this._update();
  }
  
  Puzzles.prototype.showHide = function() {
    if (!this.showing) {
      this.element.animate({height: 200});
    } else {
      this.element.animate({height: 0});
    }
    this.showing = !this.showing;
  };
  
  Puzzles.prototype._update = function() {
    $('#header-puzzles-stub').text(window.app.store.getActivePuzzle().name);
    
    $('#puzzles-list').html('');
    var puzzles = window.app.store.getPuzzles();
    var body = $('<div />');
    body.css({width: 200 * puzzles.length});
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      var puzzle = puzzles[i];
      var puzzleEl = $('<div class="puzzle" />');
      puzzleEl.html('<img src="images/puzzles/' + puzzle.icon +
        '.png"><br>' + '<label>' + puzzle.name + '</label>');
      puzzleEl.click(function(puzzle) {
        window.app.store.switchPuzzle(puzzle.id, function(err) {
          this._update();
          window.app.session.update();
        }.bind(this));
        this.showHide();
      }.bind(this, puzzle));
      body.append(puzzleEl);
    }
    $('#puzzles-list').append(body);
  };
  
  $(function() {
    if (!window.app) {
      window.app = {};
    }
    window.app.puzzlesDropdown = new Puzzles();
  });
  
})();