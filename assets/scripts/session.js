(function() {
  
  function Session() {
    this.records = [];
  }
  
  Session.prototype.add = function(record) {
    this.records.push(record);
  };
  
  Session.prototype.count = function() {
    return this.records.length;
  };
  
  Session.prototype.delete = function(idx) {
    this.records.splice(idx, 1);
  };
  
  if (!window.app) {
    window.app = {};
  }
  
  window.app.Session = Session;
  
})();