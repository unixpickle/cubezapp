(function() {
  
  function PuzzlesDropdown() {
    this.element = $('#puzzles-dropdown');
    this.showing = false;
    window.app.context.addListener(this._update.bind(this));
    this._update();
  }
  
  PuzzlesDropdown.prototype.showHide = function() {
    if (!this.showing) {
      this.element.animate({height: 200});
    } else {
      this.element.animate({height: 0});
    }
    this.showing = !this.showing;
  };
  
  PuzzlesDropdown.prototype._update = function() {
    var puzzles = window.app.context.puzzles();
    var body = $('<div />');
    body.css({width: 200 * puzzles.length});
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      var puzzle = puzzles[i];
      var puzzleEl = $('<div class="puzzle" />');
      puzzleEl.html('<img src="images/puzzles/' + puzzle.settings.icon +
        '.png"><br>' + '<label>' + puzzle.settings.name + '</label>');
      puzzleEl.click(function(puzzle) {
        window.app.context.changePuzzle(puzzle);
        window.app.contextView.update();
      }.bind(null, puzzle));
      body.append(puzzleEl);
    }
    $('#puzzles-list').append(body);
  };
  
  $(function() {
    if (!window.app) {
      window.app = {};
    }
    window.app.puzzlesDropdown = new PuzzlesDropdown();
  });
  
})();