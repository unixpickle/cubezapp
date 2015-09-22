(function() {

  function FilePicker() {
    this.onError = null;
    this.onData = null;

    window.addEventListener('load', function() {
      var input = document.getElementById('file');
      input.addEventListener('change', this._filePicked.bind(this), false);
    }.bind(this));
  }

  FilePicker.prototype._filePicked = function(evt) {
    var files = evt.target.files;
    if (files.length === 0) {
      this.onError('no files were chosen');
    } else if (files.length > 1) {
      this.onError('too many files chosen');
    } else {
      this._readFile(files[0]);
    }
  };

  FilePicker.prototype._readFile = function(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      this.onData(e.target.result);
    }.bind(this);
    reader.readAsText(file);
  };

  window.filePicker = new FilePicker();

})();
