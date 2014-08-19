part of timer_page;

class PuzzleIcon {
  final DivElement element;
  DivElement imageContainer;
  ImageElement image;
  LabelElement label;
  
  String get imageSource => image.src;
  
  void set imageSource(String str) {
    image.src = str;
  }
  
  String get name => label.text;
  
  void set name(String str) {
    label.text = str;
  }
  
  PuzzleIcon() : element = new DivElement() {
    imageContainer = new DivElement();
    image = new ImageElement();
    label = new LabelElement();
    
    element.className = 'dropdown-puzzle';
    imageContainer.className = 'image-container';
    
    imageContainer.append(image);
    element.append(imageContainer);
    element.append(label);
  }
}

class PuzzlesDropdown {
  final DivElement element;
  final DivElement container;
  
  PuzzlesDropdown(DivElement element) : element = element,
      container = element.querySelector('.dropdown-container') {
    
    for (int i = 0; i < 20; i++) {
      PuzzleIcon icon = new PuzzleIcon();
      icon.name = 'Puzzle$i';
      icon.imageSource = 'image/burger.png';
      container.append(icon.element);
    }
  }
}
