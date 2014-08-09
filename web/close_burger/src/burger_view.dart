part of close_burger;

class BurgerView {
  final CanvasElement canvas;
  final CanvasRenderingContext2D context;
  
  double start;
  double end;
  Timer timer = null;
  DateTime animStart;
  
  double progress = 1.0;
  
  int get width => canvas.width;
  int get height => canvas.height;
  
  BurgerView(CanvasElement canvas) : canvas = canvas,
      context = canvas.getContext('2d');
  
  void setClosed(bool closed) {
    if (!closed) {
      start = progress;
      end = 1.0;
    } else {
      start = progress;
      end = 0.0;
    }
    animStart = new DateTime.now();
    if (timer == null) {
      timer = new Timer.periodic(new Duration(milliseconds: 10), _timerTick);
    }
  }
  
  void draw() {
    context.clearRect(0, 0, width, height);
    
    double inset = 7.0;
    
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.strokeStyle = 'rgb(137, 137, 137)';
    
    context.beginPath();
    
    double xProg = pow(progress.abs(), 1.5);
    
    // top burger line
    context.moveTo(inset + (width - inset * 2) * progress, inset);
    context.lineTo(width - inset - (width - inset * 2) * xProg,
        inset + (height - inset * 2) * progress);
    
    // bottom burger line
    context.moveTo(inset + (width - inset * 2) * progress, height - inset);
    context.lineTo(width - inset - (width - inset * 2) * xProg,
        height - inset - (height - inset * 2) * progress);
    
    context.stroke();
    
    if (progress < 0.5) {
      context.strokeStyle = 'rgba(137, 137, 137, ${1.0 - progress * 2})';
      context.beginPath();
      context.moveTo(inset, height / 2);
      context.lineTo(width - inset, height / 2);
      context.stroke();
    }
  }
  
  _timerTick(_) {
    double secs = new DateTime.now().difference(animStart).inMilliseconds /
        1000;
    double scalar = secs * 3;
    if (scalar >= 1.0) {
      scalar = 1.0;
      timer.cancel();
      timer = null;
    }
    
    progress = start + (end - start) * scalar;
    draw();
  }
}
