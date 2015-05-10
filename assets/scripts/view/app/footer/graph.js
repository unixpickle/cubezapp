(function() {

  function Graph() {
    this._$element = $('#footer .stats-contents .graph');
  }

  Graph.prototype.hidden = function() {
    // TODO: hide any popup menus here...
  };

  Graph.prototype.layout = function(left, width) {
    this._$element.css({left: left, width: width});
  };

  Graph.prototype.setVisible = function(flag) {
    this._$element.css({display: flag ? 'block' : 'none'});
  };

  window.app.Graph = Graph;

})();
