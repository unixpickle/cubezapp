(function() {

  function GraphCheckbox(name, modelKey, changeEmitter) {
    this._name = name;
    this._modelKey = modelKey;
    this._changeEmitter = changeEmitter;
    
    this._checkbox = window.app.flavors.makeCheckbox(
      window.app.store.getActivePuzzle()[this._modelKey]
    );
    
    $(this._checkbox.element()).addClass('graph-settings-checkbox');
    
    this._$element = $('<div class="graph-settings-labeled-checkbox"></div>');
    this._$element.append(
      $('<label class="graph-settings-name-label"></label>').text(name),
      this._checkbox.element()
    );
    
    this._registerEvents();
  }
  
  GraphCheckbox.prototype.element = function() {
    return this._$element
  };
  
  GraphCheckbox.prototype._registerEvents = function() {
    this._checkbox.onChange = function() {
      this._changeEmitter.emit('settingChanged', this._modelKey,
        this._checkbox.getChecked());
    }.bind(this);
    
    window.app.observe.activePuzzle(this._modelKey, function() {
      this._checkbox.setChecked(
        window.app.store.getActivePuzzle()[this._modelKey]
      );
    }.bind(this));
  };
  
  window.app.GraphCheckbox = GraphCheckbox;

})();
