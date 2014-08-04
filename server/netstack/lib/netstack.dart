part of netstack;

class NetStack {
  final List<_Handler> handlers;
  
  NetStack() : handlers = <_Handler>[];
  
  void next(_PassHandlerMethod handler) {
    handlers.add(new _PassHandler(handler));
  }
  
  void get(String path, _PathHandlerMethod handler,
      {bool caseSensitive: true}) {
    handlers.add(new _PathHandler('GET', path, handler, caseSensitive));
  }
  
  void post(String path, _PathHandlerMethod handler,
      {bool caseSensitive: true}) {
    handlers.add(new _PathHandler('POST', path, handler, caseSensitive));
  }
  
  Future handleRequest(HttpRequest request) {
    Map<String, Object> map = <String, Object>{};
    Completer completer = new Completer();
    int handlerIdx = 0;
    
    Function runNext;
    runNext = () {
      if (handlerIdx == handlers.length) {
        completer.completeError(new NetStackError(404,
            'Cannot ${request.method} ${request.uri.path}'));
        return;
      }
      
      _Handler handler = handlers[handlerIdx++];
      Future<bool> f = handler.run(map, request);
      f.then((bool b) {
        if (!b) completer.complete();
        else runNext();
      }).catchError((e) {
        completer.completeError(e);
      });
    };
    
    runNext();
    return completer.future;
  }
}
