part of static;

abstract class Static {
  final ForwardTable aliases;
  
  Static({this.aliases: null});
  
  Future serveFile(HttpRequest request) {
    String path = request.uri.path;
    
    // forward the path
    if (aliases != null) {
      path = aliases.forwardPath(path);
    }
    
    // validate the path
    if (!validatePath(path)) {
      StaticError err = new StaticError(404, 'invalid path $path');
      return new Future.error(err);
    }
    
    String relPath = localPath(path);
    
    return new File(relPath).readAsBytes().then((List<int> data) {
      request.response.headers.contentType = _contentTypeForPath(path);
      request.response.add(data);
      request.response.close();
    });
  }
  
  bool validatePath(String path);
  String localPath(String remotePath);
}
