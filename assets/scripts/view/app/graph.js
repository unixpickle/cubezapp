(function() {
  
  function Graph() {
    this._element = $('#footer .stats-contents .graph');
  }
  
  Graph.prototype.layout = function(left, width) {
    this._element.css({left: left, width: width});
  };
  
  Graph.prototype.setVisible = function(flag) {
    this._element.css({display: flag ? 'block' : 'none'});
  };
  
  window.app.Graph = Graph;
  
})();