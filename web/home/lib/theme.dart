part of home_page;

class Theme {
  final List<int> color;
  final Application application;
  
  String get colorString => 'rgb(${color[0]}, ${color[1]}, ${color[2]})';
  
  Theme(this.color, this.application);
  
  String toStyleSheet() {
    return """
.theme-background, .tab-selected {
  background-color: $colorString;
}
.theme-color, .tab-unselected, .solve-status-unselected {
  color: $colorString;
}
""";
  }
  
  void activate() {
    querySelector('#theme-style').remove();
    StyleElement el = new StyleElement();
    el.text = toStyleSheet();
    el.id = 'theme-style';
    querySelector('head').append(el);
    application.addButton..strokeStyle = colorString
                         ..draw();
    application.minusButton..strokeStyle = colorString
                           ..draw();
  }
}
