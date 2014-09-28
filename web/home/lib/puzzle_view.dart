part of home_page;

class PuzzleView {
  final DivElement element = new DivElement();
  final DivElement imageContainer = new DivElement();
  final LabelElement nameElement = new LabelElement();
  final ImageElement imageElement = new ImageElement();
  
  static const int WIDTH = 186;
  static const int HEIGHT = 154;
  static const int PADDING = 30;
  
  String _bgColor;
  
  String get name => nameElement.innerHtml;
  String get imageUrl => imageElement.src;
  
  void set name(String value) {
    nameElement.innerHtml = value;
  }
  
  void set imageUrl(String value) {
    imageElement.src = value;
    imageElement.width = 125;
    imageElement.height = 125;
  }
  
  PuzzleView() {
    imageElement.style.pointerEvents = 'none';
    imageContainer.className = 'image-container';
    element.className = 'puzzle-view';
    element.append(imageContainer);
    element.append(nameElement);
    imageContainer.append(imageElement);
  }
}
