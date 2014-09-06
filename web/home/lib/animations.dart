part of home_page;

Keyframes get footerPresentation {
  return transformFadeKeyframes('translate(0px, 30px)', 0.0,
      disableEvents: true);
}

Keyframes get headerPresentation {
  return transformFadeKeyframes('translate(0px, -30px)', 0.0,
      disableEvents: true);
}

Keyframes get pentagonsPresentation {
  return transformFadeKeyframes('scale(1.1, 1.1)', 0.0);
}

Keyframes get lsPagePresentation {
  return transformFadeKeyframes('none', 0.0, disableEvents: true,
      hideOnZero: true);
}
