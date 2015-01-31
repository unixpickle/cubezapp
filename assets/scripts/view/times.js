(function() {
  
  function Times(element) {
    this.element = element;
    this.onDelete = null;
    this.onOpen = null;
    this.onSelect = null;
    this._selected = -1;
    this._rows = [];
    
    // When the user clicks the background, the table is deselected.
    this.element.click(this._select.bind(this, -1));
  }
  
  Times.prototype.add = function(solve) {
    this._select(-1);
    this.insert(solve, 0);
  };
  
  Times.prototype.count = function() {
    return this._rows.length;
  };
  
  Times.prototype.delete = function(idx) {
    if (idx < 0 || idx >= this._rows.length) {
      return;
    }
    $(this._rows[idx]).remove();
    this._rows.splice(idx, 1);
    if (idx === this._selected) {
      this._select(-1);
    } else if (idx < this._selected) {
      this._select(this._selected - 1);
    }
  };
  
  Times.prototype.deleteAll = function() {
    this._rows = [];
    this.element.html('');
  };
  
  Times.prototype.insert = function(solve, insertIdx) {
    var row = document.createElement('div');
    row.className = 'row';
    
    var time = document.createElement('label');
    time.className = 'time';
    time.innerHTML = window.app.solveToHTML(solve);
    row.appendChild(time);
    
    var deleteButton = document.createElement('button');
    deleteButton.className = 'delete';
    deleteButton.innerHTML = 'x';
    row.appendChild(deleteButton);
    
    // Register events.
    var jRow = $(row);
    jRow.click(this._handleClick.bind(this, row));
    jRow.dblclick(this._handleDouble.bind(this, row));
    $(deleteButton).click(this._handleDelete.bind(this, row));
    
    // Insert the row in the list.
    if (insertIdx === 0) {
      this.element.prepend(jRow);
    } else {
      this._rows[insertIdx - 1].after(jRow);
    }
    this._rows.splice(insertIdx, 0, row);
  };
  
  Times.prototype.select = function(idx) {
    if (idx >= this.count()) {
      this.select(-1);
      return;
    }
    
    // Deselect the currently selected row.
    if (this._selected >= 0 && this._selected < this.count()) {
      this._rows[this._selected].className = 'row';
    }
    
    // Select the new row.
    this._selected = idx;
    if (idx >= 0) {
      this._rows[idx].className = 'row row-selected';
      // TODO: scroll to the element in the list.
    }
  };
  
  Times.prototype.selected = function() {
    return this._selected;
  };
  
  Times.prototype._handleClick = function(row, e) {
    e.stopPropagation();
    this._select(this._rows.indexOf(row));
  };
  
  Times.prototype._handleDelete = function(row, e) {
    e.stopPropagation();
    var idx = this._rows.indexOf(row);
    this.delete(idx);
    if ('function' === typeof this.onDelete) {
      this.onDelete(idx);
    }
  };
  
  Times.prototype._handleDouble = function(row, e) {
    e.stopPropagation();
    var idx = this._rows.indexOf(row);
    this._select(idx);
    if ('function' === typeof this.onOpen) {
      this.onOpen(idx);
    }
  };
  
  Times.prototype._select = function(idx) {
    var cur = this._selected;
    this.select(idx);
    if ('function' === typeof this.onSelect && cur !== this._selected) {
      this.onSelect(this._selected);
    }
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Times = Times;
  
})();