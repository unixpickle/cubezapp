part of netstack;

class NetStackError extends Error {
  final int code;
  final String message;
  
  NetStackError(this.code, this.message);
  
  String toString() {
    return 'NetStackError (code=$code, message=$message)';
  }
}