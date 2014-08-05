part of pentagons;

class Pentagon {
  double opacity;
  double _angle;
  double radius;
  double x;
  double y;
  
  static double randomRadius(Random r) {
    double first = pow(r.nextDouble(), 15) + 1.0;
    return 0.05 + first * 0.075;
  }
  
  double get angle => _angle;
  void set angle(double a) {
    _angle = a;
    while (_angle > PI * 2) _angle -= PI * 2;
    while (_angle < 0) _angle += PI * 2;
  }
  
  Pentagon() {
    opacity = 0.2;
    angle = 0.0;
    radius = 0.0;
    x = 0.0;
    y = 0.0;
  }
  
  void fill(CanvasRenderingContext2D context, double size) {
    context.fillStyle = "rgba(255, 255, 255, $opacity)";
    context.beginPath();
    for (int i = 0; i < 5; i++) {
      double ang = angle + i.toDouble() * PI * 2 / 5.0;
      if (i == 0) {
        context.moveTo((x + cos(ang) * radius) * size,
            (y + sin(ang) * radius) * size);
      } else {
        context.lineTo((x + cos(ang) * radius) * size,
            (y + sin(ang) * radius) * size);
      }
    }
    context.closePath();
    context.fill();
  }
  
  Animation generateAnimation(List<Pentagon> pentagons) {
    Random r = new Random();
    
    double xForce = 0.0;
    double yForce = 0.0;
    
    xForce = (1 / pow(x, 2)) - (1 / pow(1 - x, 2));
    yForce = (1 / pow(y, 2)) - (1 / pow(1 - y, 2));
    
    for (Pentagon p in pentagons) {
      if (p == this) continue;
      double distSquared = pow(p.x - x, 2) + pow(p.y - y, 2);
      double forceMag = 1 / distSquared;
      double distance = sqrt(distSquared);
      xForce -= forceMag * (p.x - x) / distance;
      yForce -= forceMag * (p.y - y) / distance;
    }
    
    xForce += (r.nextDouble() - 0.5) * 20;
    yForce += (r.nextDouble() - 0.5) * 20;
    
    double maxMag = 100.0;
    double magDiv = 500.0;
    xForce = max(min(xForce, maxMag), -maxMag) / magDiv;
    yForce = max(min(yForce, maxMag), -maxMag) / magDiv;
    
    SimpleAnimation anim = new SimpleAnimation(r.nextDouble() * 20.0 + 20.0,
        this);
    anim.startX = x;
    anim.startY = y;
    anim.endX = max(min(x + xForce, 1.0), 0.0);
    anim.endY = max(min(y + yForce, 1.0), 0.0);
    
    double newAngle = angle + r.nextDouble();
    anim.startAngle = angle;
    anim.endAngle = newAngle;
    
    double newOpacity = opacity + (r.nextDouble() - 0.5) / 2;
    anim.startOpacity = opacity;
    anim.endOpacity = max(min(newOpacity, 0.2), 0.0);
    
    anim.startRadius = radius;
    anim.endRadius = Pentagon.randomRadius(r);
    
    return anim;
  }
}
