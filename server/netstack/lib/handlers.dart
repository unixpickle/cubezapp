part of netstack;

typedef Future _PathHandlerMethod(Map<String, Object> info, HttpRequest req);
typedef Future<bool> _PassHandlerMethod(Map<String, Object> info,
    HttpRequest req);

abstract class _Handler {
  /**
   * The resulting future should complete with a value of `true` to continue
   * forwarding the request down the stack, or `false` to indicate that this
   * handler has assumed responsibility of the request.
   */
  Future<bool> run(Map<String, Object> info, HttpRequest request);
}

class _PathHandler extends _Handler {
  final String path;
  final bool caseSensitive;
  final _PathHandlerMethod handler;
  final String method;
  
  _PathHandler(this.method, this.path, this.handler, this.caseSensitive);
  
  bool matchPath(String aPath) {
    if (caseSensitive) {
      return aPath == path;
    } else {
      return aPath.toLowerCase() == path.toLowerCase();
    }
  }
  
  bool matchReq(HttpRequest req) {
    if (!matchPath(req.uri.path)) return false;
    return req.method == method;
  }
  
  Future<bool> run(Map<String, Object> obj, HttpRequest req) {
    if (!matchReq(req)) return new Future(() => true);
    return handler(obj, req).then((_) => false);
  }
}

class _PassHandler implements _Handler {
  final _PassHandlerMethod handler;
  
  _PassHandler(this.handler);
  
  Future<bool> run(Map<String, Object> obj, HttpRequest req) {
    return handler(obj, req);
  }
}
