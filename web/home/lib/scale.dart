part of home_page;

double screenScale() {
  if (window.devicePixelRatio == 0) {
    return 1.0;
  }
  return window.devicePixelRatio;
}
