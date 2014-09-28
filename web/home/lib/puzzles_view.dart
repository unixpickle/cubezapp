part of home_page;

class PuzzlesView extends Animatable {
  List<PuzzleView> views = [];
  
  PuzzlesView(Element element) : super(element, headerPresentation) {
    for (int i = 0; i < 10; ++i) {
      var aView = new PuzzleView();
      aView.name = 'OH $i';
      aView.imageUrl =
          'http://willvideoforfood.com/wp-content/uploads/2012/12/poop.png';
      views.add(aView);
    }
    initialLayout();
  }
  
  void initialLayout() {
    var count = (window.innerWidth - PuzzleView.PADDING) ~/
        (PuzzleView.WIDTH + PuzzleView.PADDING);
    if (count > views.length) count = views.length;
    var usedWidth = (count * (PuzzleView.WIDTH + PuzzleView.PADDING)) +
        PuzzleView.PADDING;
    var startLeft = (window.innerWidth - usedWidth) ~/ 2 + PuzzleView.PADDING;
    for (int i = 0; i < count; ++i) {
      var aView = views[i];
      aView.element.style.left = '${i * (PuzzleView.WIDTH + PuzzleView.PADDING) + startLeft}px';
      element.append(aView.element);
    }
  }
  
  void handleResize() {
    // bad implementation
    for (PuzzleView v in views) {
      v.element.remove();
    }
    initialLayout();
  }
  
  void show() {
    run(true, duration: 0.5);
  }
  
  void hide() {
    run(false, duration: 0.5);
  }
}