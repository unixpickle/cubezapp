(function() {
  
  function Animation(start, end, duration) {
    this.start = start;
    this.end = end;
    this.duration = duration;
    this.timestamp = (new Date()).getTime();
  }
  
  Animation.prototype.elapsed = function() {
    return (new Date()).getTime() - this.timestamp;
  };
  
  Animation.prototype.intermediate = function(pg) {
    percentage = Math.min(this.elapsed() / this.duration, 1);
    pg.x = this.start.x + (this.end.x-this.start.x)*percentage;
    pg.y = this.start.y + (this.end.y-this.start.y)*percentage;
    pg.radius = this.start.radius +
      (this.end.radius-this.start.radius)*percentage;
    pg.rotation = this.start.rotation +
      (this.end.rotation-this.start.rotation)*percentage;
    pg.opacity = this.start.opacity +
      (this.end.opacity-this.start.opacity)*percentage;
  };
  
  Animation.prototype.isDone = function() {
    return this.elapsed() >= this.duration;
  };
  
  function MovingPentagon(initial) {
    this.pentagon = initial.copy();
    this.animation = new Animation(initial, initial, 0);
  }
  
  function Pentagon(x, y, radius, rotation, opacity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.rotation = rotation;
    this.opacity = opacity;
  }
  
  Pentagon.prototype.copy = function() {
    return new Pentagon(this.x, this.y, this.radius, this.rotation,
      this.opacity);
  };
  
  Pentagon.prototype.draw = function(ctx, width, height) {
    var radius = this.radius;
    var rotation = this.rotation;
    var x = this.x;
    var y = this.y;
    var size = Math.min(width, height);
    
    // TODO: use this.___ in here instead of local variables.
    
    ctx.fillStyle = 'rgba(255, 255, 255, ' + this.opacity + ')';
    ctx.beginPath();
    for (var i = 0; i < 5; ++i) {
      var ang = rotation + i * Math.PI * 2 / 5.0;
      if (i == 0) {
        ctx.moveTo((x + Math.cos(ang) * radius) * size,
            (y + Math.sin(ang) * radius) * size);
      } else {
        ctx.lineTo((x + Math.cos(ang) * radius) * size,
            (y + Math.sin(ang) * radius) * size);
      }
    }
    ctx.closePath();
    ctx.fill();
  };
  
  function Pentagons(canvas, count) {
    this.canvas = canvas;
    this.movingPentagons = [];
    
    // Generate some pentagons to start
    for (var i = 0; i < (count || 10); ++i) {
      var pent = this.randomPentagon();
      var moving = new MovingPentagon(initial);
      this.movingPentagons.push(moving);
    }
  }
  
  Pentagons.prototype.draw = function() {
    var context = this.canvas.getContext('2d');
    var width = this.canvas.width;
    var height = this.canvas.height;
    
    context.clear(0, 0, width, height);
    
    // Animate and draw the pentagons
    for (var i = 0, len = this.movingPentagons.length; i < len; ++i) {
      var p = this.movingPentagons[i];
      p.animation.intermediate(p.pentagon);
      
      // Draw the pentagon
      p.pentagon.draw(context, width, height);
      
      if (p.animation.isDone()) {
        // Generate a new animation
        var newPent = this.random(i);
        var duration = 30 + 30*Math.random();
        p.animation = new Animation(p.pentagon, newPent, duration);
      }
    }
  };
  
  Pentagons.prototype.random = function(ignoreIdx) {
    // This is sloppy and is sure to be improved...
    return new Pentagon(Math.random(), Math.random(), Math.random(),
      Math.random(), Math.random());
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Pentagons = Pentagons;
  
})();