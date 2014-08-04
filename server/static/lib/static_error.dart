part of static;

class StaticError extends Error {
  final String message;
  final int code;
  
  StaticError(this.code, this.message);
}