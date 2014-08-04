part of static;

class ProjectStatic extends Static {
  final String projectRoot;
  final String webRoot;
  
  ProjectStatic(this.projectRoot, this.webRoot, 
      {ForwardTable aliases: null}) : super(aliases: aliases);
  
  bool validatePath(String path) {
    if (path.contains('..')) return false;
    if (!(new RegExp(r'^\/[\a-z\.]*$')).hasMatch(path)) {
      print('doesnt match $path');
      return false;
    }
    return true;
  }
  
  String localPath(String path) {
    if ('/packages'.matchAsPrefix(path) != null) {
      return projectRoot + path;
    } else {
      return webRoot + path;
    }
  }
}