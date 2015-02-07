(function() {
  
  function Puzzles() { 
    this.dropdown = $('#puzzles');
    this.scroller = $('#puzzles-scroller');
    this.name = $('#puzzle-name');
    this.showing = false;
    
    this.name.click(this.toggle.bind(this));
    
    this.update();
  }
  
  Puzzles.prototype.toggle = function() {
    this.showing = !this.showing;
    this.dropdown.stop(true, true);
    if (!this.showing) {
      this.dropdown.animate({height: 0});
    } else {
      this.dropdown.animate({height: 200});
    }
  };
  
  Puzzles.prototype.update = function() {
    this.name.text(window.app.store.getActivePuzzle().name);
    
    this.scroller.html('');
    
    var puzzles = window.app.store.getPuzzles();
    if (puzzles.length === 0) {
      this.scroller.css({width: 0});
      return;
    }
    
    // Resize puzzles scroller
    var width = 200;
    var spacing = 20;
    var totalWidth = puzzles.length*width + (puzzles.length+1)*spacing;
    this.scroller.css({width: totalWidth});
    
    // Add each puzzle
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      var puzzle = puzzles[i];
      (function(puzzle) {
        var element = $('<div class="puzzle" />');
        var label = $('<label />');
        var frame = $('<div class="img-frame" />');
        var img = $('<img />');
        label.text(puzzle.name);
        img.attr('src', 'images/puzzles/' + puzzle.icon + '.png');
        frame.append(img);
        element.append(label);
        element.append(frame);
        element.css({left: i*width + (i+1)*spacing});
        this.scroller.append(element);
        element.click(function() {
          window.app.store.switchPuzzle(puzzle.id);
          this.update();
          this.toggle();
        }.bind(this));
      }).call(this, puzzles[i]);
    }
  };
  
  $(function() {
    if (!window.app) {
      window.app = {};
    }
    window.app.puzzles = new Puzzles();
  });
  
})();