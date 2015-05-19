// context.js version 0.1.1
//
// Copyright (c) 2015, Alexander Nichol and Jonathan Loeb.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer. 
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//
(function() {
  window.contextjs = {};
  var exports = window.contextjs;

  // A Background draws the blurb and shadow which appears in the background of a
  // menu.
  function Background() {
    this._highlightTop = 0;
    this._highlightHeight = 0;
    this._metrics = null;
    this._canvas = document.createElement('canvas');
  }

  Background.SELECTION_COLOR = '#f0f0f0';

  Background.prototype.element = function() {
    return $(this._canvas);
  };

  Background.prototype.setHighlight = function(top, height) {
    this._highlightTop = top;
    this._highlightHeight = height;
    this._draw();
  };

  Background.prototype.setMetrics = function(metrics) {
    this._metrics = metrics;
    this._draw();
  };

  Background.prototype._draw = function() {
    if (this._metrics === null) {
      return;
    }

    var scale = Math.ceil(window.crystal.getRatio());
    var inset = Menu.SHADOW_BLUR * scale;
    var width = (this._metrics.width+Menu.ARROW_SIZE)*scale + inset*2;
    var height = this._metrics.height*scale + inset*2;

    this._canvas.width = width;
    this._canvas.height = height;
    this._canvas.style.width = width/scale + 'px';
    this._canvas.style.height = height/scale + 'px';

    var context = this._canvas.getContext('2d');
    context.clearRect(0, 0, width, height);

    context.shadowBlur = Menu.SHADOW_BLUR * scale;
    context.shadowColor = Menu.SHADOW_COLOR;
    context.fillStyle = 'white';

    var arrowSize = Menu.ARROW_SIZE * scale;
    var arrowY = this._metrics.pixelsAboveArrow*scale + inset;

    // Draw the main blurb.
    context.beginPath();
    context.moveTo(inset+arrowSize, inset);
    context.lineTo(inset+arrowSize, arrowY-arrowSize);
    context.lineTo(inset, arrowY);
    context.lineTo(inset+arrowSize, arrowY+arrowSize);
    context.lineTo(inset+arrowSize, height-inset);
    context.lineTo(width-inset, height-inset);
    context.lineTo(width-inset, inset);
    context.closePath();
    context.fill();

    // Draw the highlight.
    context.shadowColor = 'transparent';
    context.save();
    context.clip();
    context.fillStyle = Background.SELECTION_COLOR;
    context.fillRect(0, inset + this._highlightTop*scale, width,
      this._highlightHeight*scale);
    context.restore();
  };
  var ARROW_CONTENT_OVERLAP = 5;
  var DEFAULT_CONTAINER_PADDING = 5;

  // A Context holds information about where a Menu is showing on the screen.
  function Context($element, $container, containerPadding) {
    this._$element = $element;
    this._$container = $container || $(document.body);
    this._containerPadding = containerPadding || DEFAULT_CONTAINER_PADDING;
    this.onInvalidate = null;

    this._elementParents = [];
    this._boundInvalidate = this._invalidate.bind(this);
    this._registerElementScroll();
  }

  Context.prototype.arrowPosition = function() {
    var offset = this._$element.offset();
    return {
      left: offset.left + this._$element.width() - ARROW_CONTENT_OVERLAP,
      top: offset.top + this._$element.height()/2
    };
  };

  Context.prototype.containerBounds = function() {
    var offset = this._$container.offset();
    return {
      top: offset.top + this._containerPadding,
      left: offset.left + this._containerPadding,
      width: this._$container.width() - this._containerPadding*2,
      height: this._$container.height() - this._containerPadding*2
    };
  };

  Context.prototype.dispose = function() {
    this._unregisterElementScroll();
  };

  Context.prototype._invalidate = function() {
    if ('function' === typeof this.onInvalidate) {
      this.onInvalidate();
    }
    this._unregisterElementScroll();
  };

  Context.prototype._registerElementScroll = function() {
    var $element = this._$element;
    do {
      $element = $element.parent();
      $element.scroll(this._boundInvalidate);
      this._elementParents.push($element);
    } while ($element[0] !== document.body);
  };

  Context.prototype._unregisterElementScroll = function() {
    for (var i = 0, len = this._elementParents.length; i < len; ++i) {
      this._elementParents[i].off('scroll', this._boundInvalidate);
    }
  };

  exports.Context = Context;
  function BaseLayoutInfo(context, page) {
    this._context = context;
    this._page = page;
    this._metrics = null;

    this.onUpdate = null;
    this.onNewLayoutInfo = null;
  }

  BaseLayoutInfo.prototype.begin = function() {
    this.setMetrics(Metrics.computeBestFittingMetrics(this.getContext(),
      this.getPage()));
  };

  BaseLayoutInfo.prototype.cssForContainer = function() {
    return {
      width: this.getMetrics().width + Menu.ARROW_SIZE + Menu.SHADOW_BLUR*2,
      height: this.getMetrics().height + Menu.SHADOW_BLUR*2,
      left: this.getMetrics().pointX - Menu.SHADOW_BLUR,
      top: this.getMetrics().pointY - this.getMetrics().pixelsAboveArrow -
        Menu.SHADOW_BLUR
    };
  };

  BaseLayoutInfo.prototype.cssForPage = function() {
    return {left: '', position: ''};
  };

  BaseLayoutInfo.prototype.cssForScroller = function() {
    return {overflowY: this.getMetrics().scrolls ? 'scroll' : 'hidden'};
  };

  BaseLayoutInfo.prototype.getContext = function() {
    return this._context;
  };

  BaseLayoutInfo.prototype.getMetrics = function() {
    return this._metrics;
  };

  BaseLayoutInfo.prototype.getPage = function() {
    return this._page;
  };

  BaseLayoutInfo.prototype.setMetrics = function(metrics) {
    this._metrics = metrics;
  };

  BaseLayoutInfo.prototype.terminate = function() {
  };

  function RegularLayoutInfo(context, page) {
    BaseLayoutInfo.call(this, context, page);
    this._resizeHandler = this._recomputeMetrics.bind(this);
  }

  RegularLayoutInfo.prototype = Object.create(BaseLayoutInfo.prototype);

  RegularLayoutInfo.prototype.begin = function() {
    BaseLayoutInfo.prototype.begin.call(this);
    $(window).resize(this._resizeHandler);
  };

  RegularLayoutInfo.prototype.terminate = function() {
    $(window).off('resize', this._resizeHandler);
  };

  RegularLayoutInfo.prototype._recomputeMetrics = function() {
    var newMetrics = Metrics.computeBestFittingMetrics(this.getContext(),
      this.getPage());
    if (!this.getMetrics().equals(newMetrics)) {
      this.setMetrics(newMetrics);
      this.onUpdate();
    }
  };

  function TransitionLayoutInfo(context, page, startMetrics, forwards) {
    BaseLayoutInfo.call(this, context, page);

    this._startMetrics = startMetrics;
    this._forwards = forwards;

    this._endMetrics = null;
    this._startTime = null;
    this._left = 0;
    this._terminated = false;
  }

  TransitionLayoutInfo.DURATION = 300;

  TransitionLayoutInfo.prototype = Object.create(BaseLayoutInfo.prototype);

  TransitionLayoutInfo.prototype.begin = function() {
    this._endMetrics = Metrics.computeBestFittingMetrics(this.getContext(),
      this.getPage());
    this._startTime = new Date().getTime();
    this._updateLeft(0);
    this._updateMetrics(0);
    this._requestAnimationFrame();
  };

  TransitionLayoutInfo.prototype.cssForPage = function() {
    return {left: this._left, position: 'relative'};
  };

  TransitionLayoutInfo.prototype.terminate = function() {
    this._terminated = true;
  };

  TransitionLayoutInfo.prototype._done = function() {
    this.onNewLayoutInfo(new RegularLayoutInfo(this.getContext(),
      this.getPage()));
  };

  TransitionLayoutInfo.prototype._requestAnimationFrame = function() {
    if ('function' === typeof window.requestAnimationFrame) {
      window.requestAnimationFrame(this._tick.bind(this));
    } else {
      setTimeout(this._tick.bind(this), 1000/60);
    }
  };

  TransitionLayoutInfo.prototype._tick = function() {
    if (this._terminated) {
      return;
    }
    var elapsed = Math.max(new Date().getTime()-this._startTime, 0);
    var percent = elapsed / TransitionLayoutInfo.DURATION;
    if (percent >= 1) {
      this._done();
    } else {
      this._requestAnimationFrame();
      this._updateLeft(percent);
      this._updateMetrics(percent);
      this.onUpdate();
    }
  };

  TransitionLayoutInfo.prototype._updateLeft = function(percent) {
    var initialLeft;
    if (this._forwards) {
      initialLeft = this._startMetrics.width;
    } else {
      initialLeft = -this.getPage().width();
    }
    this._left = (1 - Math.min(percent*2, 1)) * initialLeft;
  };

  TransitionLayoutInfo.prototype._updateMetrics = function(percent) {
    this.setMetrics(Metrics.transition(this._startMetrics, this._endMetrics,
      Math.max(percent*2 - 1, 0)));
  };
  function Menu(context, page) {
    this._background = new Background();
    this._backstack = [];
    this._layoutInfo = new RegularLayoutInfo(context, page);

    this._hoverTop = 0;
    this._hoverHeight = 0;
    this._boundMouseDown = this._handleMouseDown.bind(this);

    this._$scrollingContent = $('<div></div>').css({
      position: 'absolute',
      left: Menu.SHADOW_BLUR + Menu.ARROW_SIZE,
      top: Menu.SHADOW_BLUR,
      width: 'calc(100% - ' + (Menu.SHADOW_BLUR*2+Menu.ARROW_SIZE) + 'px)',
      height: 'calc(100% - ' + Menu.SHADOW_BLUR*2 + 'px)',
      overflowX: 'hidden'
    }).scroll(this._updateHighlight.bind(this));

    this._$element = $('<div></div>').css({position: 'fixed'});
    this._$element.append(this._background.element());
    this._$element.append(this._$scrollingContent);
    context.onInvalidate = this.hide.bind(this);

    this._state = Menu.STATE_INITIAL;
  }

  Menu.ARROW_SIZE = 10;
  Menu.FADE_DURATION = 150;
  Menu.MIN_ARROW_DISTANCE_FROM_EDGE = 3;
  Menu.SHADOW_BLUR = 5;
  Menu.SHADOW_COLOR = 'rgba(144, 144, 144, 1)';

  Menu.STATE_INITIAL = 0;
  Menu.STATE_SHOWING = 1;
  Menu.STATE_HIDDEN = 2;

  Menu.prototype.hide = function() {
    if (this._state === Menu.STATE_SHOWING) {
      this._$element.fadeOut(Menu.FADE_DURATION, function() {
        $(this).remove();
      }).css({pointerEvents: 'none'});
      this._state = Menu.STATE_HIDDEN;
      document.body.removeEventListener('mousedown', this._boundHide, true);
      this._layoutInfo.getContext().dispose();
    }
  };

  Menu.prototype.popPage = function() {
    var transition = new TransitionLayoutInfo(this._layoutInfo.getContext(),
      this._backstack.pop(), this._layoutInfo.getMetrics(), false);
    this._switchToLayoutInfo(transition);
  };

  Menu.prototype.pushPage = function(page) {
    this._backstack.push(this._layoutInfo.getPage());
    var transition = new TransitionLayoutInfo(this._layoutInfo.getContext(),
      page, this._layoutInfo.getMetrics(), true);
    this._switchToLayoutInfo(transition);
  };

  Menu.prototype.show = function() {
    if (this._state === Menu.STATE_INITIAL) {
      this._state = Menu.STATE_SHOWING;
      this._configureNewLayoutInfo();
      $(document.body).append(this._$element);
      document.body.addEventListener('mousedown', this._boundMouseDown, true);
    }
  };

  Menu.prototype._configureNewLayoutInfo = function() {
    this._registerLayoutInfoEvents();
    this._registerPageEvents();
    this._layoutInfo.begin();
    this._layout();
    this._$scrollingContent.append(this._layoutInfo.getPage().element());
  };

  Menu.prototype._handleMouseDown = function(e) {
    var x = e.clientX;
    var y = e.clientY;
    var offset = this._$element.offset();
    var width = this._$element.width();
    var height = this._$element.height();
    if (x < offset.left || x > offset.left + width || y < offset.top ||
        y > offset.top + height) {
      this.hide();
    }
  };

  Menu.prototype._layout = function() {
    this._background.setMetrics(this._layoutInfo.getMetrics());
    this._$element.css(this._layoutInfo.cssForContainer());
    this._layoutInfo.getPage().element().css(this._layoutInfo.cssForPage());
    this._$scrollingContent.css(this._layoutInfo.cssForScroller());
  };

  Menu.prototype._registerLayoutInfoEvents = function() {
    this._layoutInfo.onUpdate = this._layout.bind(this);
    this._layoutInfo.onNewLayoutInfo = this._switchToLayoutInfo.bind(this);
  };

  Menu.prototype._registerPageEvents = function() {
    var page = this._layoutInfo.getPage();
    page._onShowHover = function(top, height) {
      this._hoverTop = top;
      this._hoverHeight = height;
      this._updateHighlight();
    }.bind(this);
    page._onHideHover = page._onShowHover.bind(this, 0, 0);
  };

  Menu.prototype._switchToLayoutInfo = function(layoutInfo) {
    this._layoutInfo.terminate();
    this._layoutInfo.getPage().element().detach();

    this._layoutInfo = layoutInfo;
    this._configureNewLayoutInfo();
  };

  Menu.prototype._updateHighlight = function() {
    var realTop = this._hoverTop - this._$scrollingContent.scrollTop();
    this._background.setHighlight(realTop, this._hoverHeight);
  };

  exports.Menu = Menu;
  // Metrics stores general information about where a Menu is located and how
  // large it is.
  function Metrics(attrs) {
    this.width = attrs.width;
    this.height = attrs.height;
    this.pointX = attrs.pointX;
    this.pointY = attrs.pointY;
    this.pixelsAboveArrow = attrs.pixelsAboveArrow;
    this.scrolls = attrs.scrolls;
  }

  Metrics.computeBestFittingMetrics = function(context, page) {
    var arrowPosition = constrainedArrowPosition(context);
    var bounds = context.containerBounds();

    var height = page.height();
    var width = page.width();
    var scrolls = false;
    if (height > bounds.height) {
      scrolls = true;
      height = bounds.height;
      width += scrollbarWidth();
    }

    var pixelsAboveArrow = height / 2;

    // Make sure the menu doesn't go out of the bounds.
    if (arrowPosition.top-(height/2) < bounds.top) {
      pixelsAboveArrow = arrowPosition.top - bounds.top;
    } else if (arrowPosition.top+height/2 > bounds.top+bounds.height) {
      pixelsAboveArrow = height - (bounds.top + bounds.height -
        arrowPosition.top);
    }

    return new Metrics({
      width: width,
      height: height,
      pointX: arrowPosition.left,
      pointY: arrowPosition.top,
      pixelsAboveArrow: pixelsAboveArrow,
      scrolls: scrolls
    });
  };

  Metrics.transition = function(m1, m2, fraction) {
    var attributes = ['width', 'height', 'pointX', 'pointY', 'pixelsAboveArrow'];
    var res = {};
    for (var i = 0, len = attributes.length; i < len; ++i) {
      var attribute = attributes[i];
      res[attribute] = m1[attribute] + (m2[attribute]-m1[attribute])*fraction;
    }
    res.scrolls = (fraction < 1 ? false : m2.scrolls);
    return new Metrics(res);
  };

  Metrics.prototype.equals = function(metrics) {
    var keys = ['width', 'height', 'pointX', 'pointY', 'pixelsAboveArrow',
      'scrolls'];
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      if (this[key] !== metrics[key]) {
        return false;
      }
    }
    return true;
  };

  function constrainedArrowPosition(context) {
    var arrowPosition = context.arrowPosition();
    var bounds = context.containerBounds();

    var minTop = bounds.top + Menu.ARROW_SIZE + Menu.MIN_ARROW_DISTANCE_FROM_EDGE;
    var maxTop = bounds.top + bounds.height - Menu.ARROW_SIZE -
      Menu.MIN_ARROW_DISTANCE_FROM_EDGE;

    arrowPosition.top = Math.min(Math.max(arrowPosition.top, minTop), maxTop);
    return arrowPosition;
  }

  function scrollbarWidth() {
    // Generate a small scrolling element.
    var element = $('<div></div>').css({
      width: 200,
      height: 100,
      overflowY: 'scroll',
      position: 'fixed',
      visibility: 'hidden'
    });

    // Generate a tall element to put inside the small one.
    var content = $('<div></div>').css({height: 300, width: '100%'});
    element.append(content);

    // Append the small element to the body and measure stuff.
    $(document.body).append(element);
    var result = element.width() - content.width();
    element.remove();

    return result;
  }
  // A Page represents a list of rows to show in a context menu.  A menu can have
  // multiple pages in the form of submenus.
  function Page(rows) {
    this._rows = rows;
    this._rowYValues = [];
    this._height = 0;
    this._width = 0;
    this._$element = $('<div></div>');

    this.onClick = null;

    // These events are used to tell the Menu to draw the hover highlight.
    this._onShowHover = null;
    this._onHideHover = null;

    for (var i = 0, len = rows.length; i < len; ++i) {
      var row = rows[i];
      this._rowYValues[i] = this._height;
      this._width = Math.max(this._width, row.minimumWidth());
      this._height += row.height();
      this._$element.append(row.element());
    }

    this._$element.css({width: this._width, height: this._height});

    this._registerUIEvents();
  }

  Page.prototype.element = function() {
    return this._$element;
  };

  Page.prototype.height = function() {
    return this._height;
  };

  Page.prototype.width = function() {
    return this._width;
  };

  Page.prototype._handleRowClick = function(index) {
    if ('function' === typeof this.onClick) {
      this.onClick(index);
    }
  };

  Page.prototype._handleRowMouseEnter = function(index) {
    if (this._rows[index].enabled()) {
      var rowYValue = this._rowYValues[index];
      var height = this._rows[index].height();
      this._onShowHover(rowYValue, height);
    }
  };

  Page.prototype._handleRowMouseLeave = function() {
    this._hoverRowIndex = -1;
    this._onHideHover();
  };

  Page.prototype._registerUIEvents = function() {
    for (var i = 0, len = this._rows.length; i < len; ++i) {
      var $rowElement = this._rows[i].element();
      $rowElement.click(this._handleRowClick.bind(this, i));
      $rowElement.mouseenter(this._handleRowMouseEnter.bind(this, i));
      $rowElement.mouseleave(this._handleRowMouseLeave.bind(this));
    }
  };

  exports.Page = Page;
  function TextRow(text, style) {
    this._$element = $('<div><label></label></div>').css({
      position: 'relative',
      cursor: 'pointer'
    });
    var $label = this._$element.find('label');
    $label.text(text).css(TextRow.DEFAULT_STYLE);
    if (style) {
      $label.css(style);
    }
    this._measure();
  }

  TextRow.DEFAULT_STYLE = {
    fontSize: 18,
    height: 30,
    lineHeight: '30px',
    position: 'relative',
    color: '#999999',
    paddingLeft: 10,
    paddingRight: 10,
    pointerEvents: 'none'
  };

  TextRow.prototype.element = function() {
    return this._$element;
  };

  TextRow.prototype.enabled = function() {
    return true;
  };

  TextRow.prototype.height = function() {
    return this._height;
  };

  TextRow.prototype.minimumWidth = function() {
    return this._minWidth;
  };

  TextRow.prototype.textColor = function() {
    return this.element().find('label').css('color');
  };

  TextRow.prototype._measure = function() {
    this._$element.css({
      display: 'inline-block',
      position: 'absolute',
      top: -10000,
      left: -10000,
      visibility: 'hidden'
    });
    $(document.body).append(this._$element);

    this._minWidth = this._$element.width();
    this._height = this._$element.height();

    this._$element.detach();
    this._$element.css({
      display: 'block',
      position: 'relative',
      top: '',
      left: '',
      visibility: 'visible'
    });
  };

  function ExpandableRow(text, style) {
    TextRow.call(this, text, style);
    this._$arrow = $('<canvas></canvas>').css({
      width: ExpandableRow.ARROW_WIDTH,
      height: ExpandableRow.ARROW_HEIGHT,
      position: 'absolute',
      right: ExpandableRow.ARROW_PADDING_RIGHT,
      top: 'calc(50% - ' + ExpandableRow.ARROW_HEIGHT/2 + 'px)',
      pointerEvents: 'none'
    });
    this.element().append(this._$arrow);
    this._fillCanvas();
  }

  ExpandableRow.ARROW_PADDING_RIGHT = 10;
  ExpandableRow.ARROW_WIDTH = 10;
  ExpandableRow.ARROW_HEIGHT = 15;
  ExpandableRow.ARROW_THICKNESS = 2;

  ExpandableRow.prototype = Object.create(TextRow.prototype);

  ExpandableRow.prototype.minimumWidth = function() {
    return ExpandableRow.ARROW_WIDTH + ExpandableRow.ARROW_PADDING_RIGHT +
      TextRow.prototype.minimumWidth.call(this);
  };

  ExpandableRow.prototype._fillCanvas = function() {
    var context = this._$arrow[0].getContext('2d');
    var ratio = Math.ceil(window.crystal.getRatio());
    var width = ratio * ExpandableRow.ARROW_WIDTH;
    var height = ratio * ExpandableRow.ARROW_HEIGHT;
    this._$arrow[0].width = width;
    this._$arrow[0].height = height;

    context.strokeStyle = this.textColor();
    context.lineWidth = ratio * ExpandableRow.ARROW_THICKNESS;
    context.beginPath();
    context.moveTo(ratio*ExpandableRow.ARROW_THICKNESS,
      ratio*ExpandableRow.ARROW_THICKNESS);
    context.lineTo(width-ratio*ExpandableRow.ARROW_THICKNESS, height/2);
    context.lineTo(ratio*ExpandableRow.ARROW_THICKNESS,
      height-ratio*ExpandableRow.ARROW_THICKNESS);
    context.stroke();
    context.closePath();
  };

  function BackRow(text, style) {
    if (!style) {
      style = {};
    }
    style.paddingLeft = BackRow.ARROW_WIDTH + BackRow.ARROW_PADDING_LEFT +
      BackRow.ARROW_PADDING_RIGHT;
    TextRow.call(this, text, style);

    this._$arrow = $('<canvas></canvas>').css({
      width: BackRow.ARROW_WIDTH,
      height: BackRow.ARROW_HEIGHT,
      position: 'absolute',
      left: BackRow.ARROW_PADDING_LEFT,
      top: 'calc(50% - ' + BackRow.ARROW_HEIGHT/2 + 'px)',
      pointerEvents: 'none'
    });
    this.element().append(this._$arrow);
    this._fillCanvas();
  }

  BackRow.ARROW_PADDING_LEFT = 10;
  BackRow.ARROW_PADDING_RIGHT = 10;
  BackRow.ARROW_WIDTH = 10;
  BackRow.ARROW_HEIGHT = 15;
  BackRow.ARROW_THICKNESS = 2;

  BackRow.prototype = Object.create(TextRow.prototype);

  BackRow.prototype._fillCanvas = function() {
    var context = this._$arrow[0].getContext('2d');
    var ratio = Math.ceil(window.crystal.getRatio());
    var width = ratio * BackRow.ARROW_WIDTH;
    var height = ratio * BackRow.ARROW_HEIGHT;
    this._$arrow[0].width = width;
    this._$arrow[0].height = height;

    context.strokeStyle = this.textColor();
    context.lineWidth = ratio * BackRow.ARROW_THICKNESS;
    context.beginPath();
    context.moveTo(width-ratio*BackRow.ARROW_THICKNESS,
      ratio*BackRow.ARROW_THICKNESS);
    context.lineTo(ratio*BackRow.ARROW_THICKNESS, height/2);
    context.lineTo(width-ratio*BackRow.ARROW_THICKNESS,
      height-ratio*BackRow.ARROW_THICKNESS);
    context.stroke();
    context.closePath();
  };

  function CheckRow(checked, text, style) {
    if (!style) {
      style = {};
    }
    style.paddingLeft = CheckRow.CHECK_PADDING_LEFT + CheckRow.CHECK_WIDTH +
      CheckRow.CHECK_PADDING_RIGHT;

    TextRow.call(this, text, style);

    if (checked) {
      this._$check = $('<canvas></canvas>').css({
        width: CheckRow.CHECK_WIDTH,
        height: CheckRow.CHECK_HEIGHT,
        position: 'absolute',
        left: CheckRow.CHECK_PADDING_LEFT,
        top: 'calc(50% - ' + CheckRow.CHECK_HEIGHT/2 + 'px)',
        pointerEvents: 'none'
      });
      this.element().append(this._$check);
      this._fillCanvas();
    }
  }

  CheckRow.CHECK_PADDING_LEFT = 5;
  CheckRow.CHECK_PADDING_RIGHT = 5;
  CheckRow.CHECK_WIDTH = 20;
  CheckRow.CHECK_HEIGHT = 15;
  CheckRow.CHECK_THICKNESS = 2;

  CheckRow.prototype = Object.create(TextRow.prototype);

  CheckRow.prototype._fillCanvas = function() {
    var context = this._$check[0].getContext('2d');
    var ratio = Math.ceil(window.crystal.getRatio());
    var width = ratio * CheckRow.CHECK_WIDTH;
    var height = ratio * CheckRow.CHECK_HEIGHT;
    this._$check[0].width = width;
    this._$check[0].height = height;

    var thickness = CheckRow.CHECK_THICKNESS * ratio;

    context.strokeStyle = this.textColor();
    context.lineWidth = thickness;
    context.beginPath();
    context.moveTo(thickness, height/2);
    context.lineTo(width/3, height-thickness);
    context.lineTo(width-thickness, thickness);
    context.stroke();
    context.closePath();
  };

  exports.TextRow = TextRow;
  exports.ExpandableRow = ExpandableRow;
  exports.BackRow = BackRow;
  exports.CheckRow = CheckRow;

})();
