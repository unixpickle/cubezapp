part of pentagons;

class PentagonView {
  final CanvasElement element;
  final List<Pentagon> pentagons;
  CanvasRenderingContext2D context;
  
  List<Animation> animations;
  
  int get width => element.width;
  int get height => element.height;
  double get size => (width > height ? width : height).toDouble();
  
  PentagonView(this.element) : pentagons = <Pentagon>[] {
    context = element.getContext('2d');
  }
  
  void start() {
    Random r = new Random();
    List<List<double>> points = [[0.2, 0.3], [0.5, 0.2], [0.9, 0.3],
                                 [0.6, 0.8], [0.3, 0.9], [0.5, 0.5],
                                 [0.1, 0.6], [0.8, 0.6], [0.0, 0.0],
                                 [0.5, 0.7]];
    double minSize = 0.15;
    double maxSize = 0.2;
    for (List<double> point in points) {
      Pentagon p = new Pentagon();
      p.radius = Pentagon.randomRadius(r);
      p.x = point[0];
      p.y = point[1];
      p.angle = r.nextDouble() * PI * 2;
      pentagons.add(p);
    }
    
    for (int i = 0; i < 5; i++) {
      Pentagon p = new Pentagon();
      p.radius = Pentagon.randomRadius(r);
      p.x = r.nextDouble();
      p.y = r.nextDouble();
      p.angle = r.nextDouble() * PI * 2;
      pentagons.add(p);
    }
    
    animations = [];
    for (Pentagon p in pentagons) {
      Function gen;
      gen = () {
        Animation a = p.generateAnimation(pentagons);
        animations.add(a);
        a.run().then((_) {
          animations.remove(a);
          gen();
        });
      };
      gen();
    }
    new Timer.periodic(new Duration(milliseconds: 35), (_) => draw());
  }
  
  void draw() {
    context.clearRect(0, 0, width, height);
    for (Pentagon p in pentagons) {
      p.fill(context, size);
    }
    for (Animation a in animations) {
      a.tick();
    }
  }
}
