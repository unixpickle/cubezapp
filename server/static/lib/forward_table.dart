part of static;

class ForwardRule {
  final String sourcePath;
  final String destPath;
  final bool caseSensitive;
  
  ForwardRule(this.sourcePath, this.destPath, {this.caseSensitive: true});
  
  bool matches(String path) {
    if (caseSensitive) {
      return sourcePath == path;
    } else {
      return sourcePath.toLowerCase() == path.toLowerCase();
    }
  }
}

class ForwardTable {
  final List<ForwardRule> rules;
  
  ForwardTable() : rules = <ForwardRule>[];
  
  String forwardPath(String path) {
    for (ForwardRule rule in rules) {
      if (rule.matches(path)) {
        return rule.destPath;
      }
    }
    return path;
  }
}
