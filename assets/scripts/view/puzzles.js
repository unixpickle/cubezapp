(function() {
  
  function Puzzles() { 
    this.deleteButtons = [];
    this.dropdown = $('#puzzles');
    this.editButtons = $('#edit-buttons');
    this.header = $('#header');
    this.scroller = $('#puzzles-scroller');
    this.name = $('#puzzle-name');
    this.onAdd = null;
    this.onChoose = null;
    this.onDelete = null;
    this.showing = false;
    
    this.name.click(this.toggle.bind(this));
    
    this.update();
    
    // I know all this code is disgusting. It is a rough draft.
    $('#add-button').click(function() {
      if ('function' !== typeof this.onAdd) {
        return;
      }
      var info = {name: 'Untitled', icon: '3x3x3'};
      this.onAdd(info);
      this.toggle();
    }.bind(this));
    $('#remove-button').click(this.removePressed.bind(this));
  }
  
  Puzzles.prototype.clearButtons = function() {
    // I know all this code is disgusting. It is a rough draft.
    for (var i = 0, len = this.deleteButtons.length; i < len; ++i) {
      this.deleteButtons[i].remove();
    }
    this.deleteButtons = [];
  };
  
  Puzzles.prototype.removePressed = function() {
    // I know all this code is disgusting. It is a rough draft.
    if (this.deleteButtons.length > 0) {
      return;
    }
    var views = this.scroller.find('.puzzle');
    var puzzles = window.app.store.getPuzzles();
    for (var i = 0, len = views.length; i < len; ++i) {
      var view = views[i];
      var button = $('<button class="delete-puzzle"></button>');
      var offset = $(views[i]).position();
      var width = $(views[i]).width();
      button.css({left: offset.left+width-20, top: offset.top-10});
      this.scroller.append(button);
      this.deleteButtons.push(button);
      (function(identifier) {
        button.click(function() {
          if ('function' === typeof this.onDelete) {
            this.onDelete(identifier);
          }
        }.bind(this));
      }).call(this, puzzles[i+1].id);
    }
  };
  
  Puzzles.prototype.toggle = function() {
    this.clearButtons();
    
    this.showing = !this.showing;
    this.dropdown.stop(true, false);
    this.header.stop(true, false);
    this.editButtons.stop(true, false);
    if (!this.showing) {
      $('#temp-scramble').css({display: 'block'});
      this.editButtons.animate({opacity: 0}, {complete: function() {
        this.editButtons.css({display: 'none'});
      }.bind(this)});
      this.dropdown.animate({height: 0,
        'background-color': 'rgba(242, 242, 242, 0.5)'});
      this.header.animate({'background-color': 'rgba(255, 255, 255, 0.5)'});
    } else {
      $('#temp-scramble').css({display: 'none'});
      this.editButtons.css({display: 'inline-block'});
      this.editButtons.animate({opacity: 1});
      this.dropdown.animate({height: 210,
        'background-color': 'rgba(242, 242, 242, 1.0)'});
      this.header.animate({'background-color': 'white'});
    }
  };
  
  Puzzles.prototype.update = function() {
    this.clearButtons();
    
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
    var totalWidth = (puzzles.length-1)*width + puzzles.length*spacing;
    this.scroller.css({width: totalWidth});
    
    // Add each puzzle except the current one.
    for (var i = 1, len = puzzles.length; i < len; ++i) {
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
        element.css({left: (i-1)*width + i*spacing});
        this.scroller.append(element);
        element.click(function() {
          if ('function' === typeof this.onChoose) {
            this.onChoose(puzzle);
          }
          this.toggle();
        }.bind(this));
      }).call(this, puzzles[i]);
    }
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Puzzles = Puzzles;
  
})();