part of static;

bool _hasExtension(String str, String ext) {
  return new RegExp('\\.$ext\$').hasMatch(str);
}

ContentType _contentTypeForPath(String path) {
  if (_hasExtension(path, 'html')) {
    return ContentType.parse('text/html');
  } else if (_hasExtension(path, 'css')) {
    return ContentType.parse('text/css');
  } else if (_hasExtension(path, 'dart')) {
    return ContentType.parse('application/dart');
  } else if (_hasExtension(path, 'js')) {
    return ContentType.parse('text/javascript');
  }
  return ContentType.parse('text/plain');
}