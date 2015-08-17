(function() {

  function Graph() {
    this._$element = $('#graph');
    this.settings = new window.app.GraphSettings();
    //this.temporaryGraph = new window.app.TemporaryGraph();
  }

  Graph.prototype.layout = function(left, width) {
    this._$element.css({left: left, width: width});
    //this.temporaryGraph.layout(width - this.settings.element().width());
  };

  Graph.prototype.setVisible = function(flag) {
    this._$element.css({display: flag ? 'block' : 'none'});
  };

  window.app.Graph = Graph;

})();
