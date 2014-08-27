part of home_page;

class VolumeButton extends ScalableCanvas {
  static const double ANIMATION_DURATION = 0.5;
  
  final int size;
  final bool addButton;
  CanvasRenderingContext2D context;
  
  double _progress;
  bool _focused;
  Timer _animateTimer;
  DateTime _animateStart;
  double _startProgress;
  double _endProgress;
  
  bool get focused => _focused;
  
  void set focused(bool flag) {
    _focused = flag;
    if (_animateTimer != null) {
      _animateTimer.cancel();
    }
    _startProgress = _progress;
    _endProgress = flag ? 1.0 : 0.0;
    _animateStart = new DateTime.now();
    _animateTimer = new Timer.periodic(new Duration(milliseconds: 33), _tick);
  }
  
  VolumeButton(CanvasElement canvas, int size, this.addButton,
               {bool initFocused: false})
      : super(canvas, size, size), size = size {
    context = canvas.getContext('2d');
    _focused = initFocused;
    _progress = initFocused ? 1.0 : 0.0;
    draw();
  }
  
  void draw() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    
    if (_progress > 0 && _progress < 1.0) {
      int innerSize = canvasWidth - 2;
      double width = _progress * innerSize / 2;
      context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      context.lineWidth = width;
      context.beginPath();
      context.arc(canvasWidth / 2, canvasWidth / 2, innerSize / 2 - width / 2,
          0, PI * 2);
      context.stroke();
    } else if (_progress == 1.0) {
      context.fillStyle = 'rgba(0, 0, 0, 0.3)';
      context.beginPath();
      context.arc(canvasWidth / 2, canvasWidth / 2, canvasWidth / 2, 0, PI * 2);
      context.fill();
    }
    
    context.lineCap = 'round';
    context.strokeStyle = 'rgba(255, 255, 255, 1.0)';
    context.lineWidth = 2 * pixelRatio;
    context.beginPath();
    context.arc(canvasWidth / 2, canvasWidth / 2, canvasWidth / 2 -
        context.lineWidth / 2, 0, PI * 2);
    
    double textInset = 9 * pixelRatio;
    context.moveTo(textInset, canvasWidth / 2);
    context.lineTo(canvasWidth - textInset, canvasWidth / 2);
    
    if (addButton) {
      context.moveTo(canvasWidth / 2, textInset);
      context.lineTo(canvasWidth / 2, canvasWidth - textInset);
    }
    
    context.stroke();
  }
  
  void _tick(_) {
    double delay = new DateTime.now().difference(_animateStart).inMilliseconds
        / 1000;
    if (delay > ANIMATION_DURATION) {
      delay = ANIMATION_DURATION;
      _animateTimer.cancel();
      _animateTimer = null;
      _animateStart = null;
    }
    double percent = pow(delay / ANIMATION_DURATION, 1/2);
    _progress = min(max(_startProgress + (_endProgress - _startProgress) *
                        percent, 0), 1.0);
    draw();
  }
}
