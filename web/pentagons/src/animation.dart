part of pentagons;

abstract class Animation {
  DateTime _start;
  Completer _completer;
  final double duration;
  final Pentagon pentagon;
  bool done;
  
  double get timeRunning {
    return new DateTime.now().difference(_start).inMilliseconds / 1000;
  }
  
  double get percentage {
    double time = timeRunning;
    if (time >= duration) return 1.0;
    return time / duration;
  }
  
  Animation(this.duration, this.pentagon) {
    done = false;
  }
  
  Future run() {
    _start = new DateTime.now();
    _completer = new Completer();
    return _completer.future;
  }
  
  void step();
  
  void tick() {
    if (done) return;
    if (timeRunning > duration) {
      scheduleMicrotask(() => _completer.complete());
      done = true;
      return;
    }
    step();
  }
}

class SimpleAnimation extends Animation {
  double startX;
  double endX;
  double startY;
  double endY;
  double startAngle;
  double endAngle;
  double startOpacity;
  double endOpacity;
  double startRadius;
  double endRadius;
  
  SimpleAnimation(double a, Pentagon b) : super(a, b);
  
  void step() {
    pentagon.x = startX + (endX - startX) * percentage;
    pentagon.y = startY + (endY - startY) * percentage;
    pentagon.angle = startAngle + (endAngle - startAngle) * percentage;
    pentagon.opacity = startOpacity + (endOpacity - startOpacity) * percentage;
    pentagon.radius = startRadius + (endRadius - startRadius) * percentage;
  }
}
