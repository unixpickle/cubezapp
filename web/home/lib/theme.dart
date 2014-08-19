part of home_page;

class Theme {
  final List<int> color;
  
  Theme(this.color);
  
  String toStyleSheet() {
    String colorStr = 'rgb(${color[0]}, ${color[1]}, ${color[2]})';
    return """
.theme-background, .tab-selected {
  background-color: $colorStr;
}
.theme-color, .tab-unselected {
  color: $colorStr;
}
""";
  }
  
  void activate() {
    querySelector('#theme-style').remove();
    StyleElement el = new StyleElement();
    el.text = toStyleSheet();
    el.id = 'theme-style';
    querySelector('head').append(el);
  }
}
