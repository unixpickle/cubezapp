(function() {

  var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  var STROKE_COLOR = '#65bcd4';
  var STROKE_WIDTH = '3';

  function LineDrawer() {
    this._lines = [];
    this._svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this._svg.setAttribute('style', 'position: absolute;top: 0;left: 0;width: 100%;height: 100%');

    window.addEventListener('load', function() {
      document.body.insertBefore(this._svg, document.body.childNodes[0]);
      this._updateViewBox();
    }.bind(this));
    window.addEventListener('resize', this._handleResize.bind(this));
  }

  LineDrawer.prototype.createLine = function(start, end) {
    var svgLine = document.createElementNS(SVG_NAMESPACE, 'line');
    svgLine.setAttribute('stroke', STROKE_COLOR);
    svgLine.setAttribute('stroke-width', '3');
    this._svg.appendChild(svgLine);
    var line = new Line(svgLine, start, end);
    this._lines.push(line);
    return line;
  };

  LineDrawer.prototype.deleteLine = function(line) {
    var index = this._lines.indexOf(line);
    if (index < 0) {
      throw new Error('line does not exist');
    }
    this._lines.splice(index, 1);
    this._svg.removeChild(line._svgLine);
  };

  LineDrawer.prototype.updateLineEnd = function(line, newEnd) {
    line._p2 = newEnd;
    line.update();
  };

  LineDrawer.prototype._handleResize = function() {
    this._updateViewBox();
    for (var i = 0, len = this._lines.length; i < len; ++i) {
      this._lines[i].update();
    }
  };

  LineDrawer.prototype._updateViewBox = function() {
    this._svg.setAttribute('viewBox', '0 0 ' + window.innerWidth + ' ' + window.innerHeight);
  };

  function Line(svgLine, p1, p2) {
    this._svgLine = svgLine;
    this._p1 = p1;
    this._p2 = p2;
    this.update();
  }

  Line.prototype.update = function() {
    var p1 = pointInMiddle(this._p1);
    var p2 = pointInMiddle(this._p2);
    this._svgLine.setAttribute('x1', p1[0].toFixed(1));
    this._svgLine.setAttribute('x2', p2[0].toFixed(1));
    this._svgLine.setAttribute('y1', p1[1].toFixed(1));
    this._svgLine.setAttribute('y2', p2[1].toFixed(1));
  };

  function pointInMiddle(element) {
    if (Array.isArray(element)) {
      return element;
    }

    var rect = element.getBoundingClientRect();
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    return [rect.left + width/2, rect.top + height/2];
  }

  window.lineDrawer = new LineDrawer();

})();
