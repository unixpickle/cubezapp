(function() {

  var MINIMUM_MEAN_SIZE = 3;
  var MAXIMUM_MEAN_SIZE = 50;

  var MINIMUM_SCALE = 5;
  var MAXIMUM_SCALE = 100;

  function Graph() {
    this._$element = $('#graph');
  }

  Graph.prototype.layout = function(left, width) {
    this._$element.css({left: left, width: width});
  };

  Graph.prototype.setVisible = function(flag) {
    this._$element.css({display: flag ? 'block' : 'none'});
  };
  
  window.app.Graph = Graph;

})();
