(function() {
  
  function TimesTable() {
    this.element = $('#times-table');
    this.ondelete = null;
    this.onopen = null;
    this.onselect = null;
    this._selected = -1;
    this._rows = [];
    
    // When the user clicks the background, the table is deselected.
    this.element.click(this._select.bind(this, -1));
  }
  
  TimesTable.prototype.add = function(record) {
    this.insert(record, 0);
  };
  
  TimesTable.prototype.count = function() {
    return this._rows.length;
  };
  
  TimesTable.prototype.delete = function(idx) {
    if (idx < 0 || idx >= this._rows.length) {
      return;
    }
    $(this._rows[idx]).remove();
    this._rows.splice(idx, 1);
    if (idx === this.selected) {
      this._select(-1);
    } else if (idx < this.selected) {
      this._select(this.selected - 1);
    }
  };
  
  TimesTable.prototype.insert = function(record, insertIdx) {
    var row = document.createElement('div');
    row.className = 'times-table-row';
    
    var time = document.createElement('label');
    time.className = 'times-table-time';
    time.innerHTML = record.toHTML();
    row.appendChild(time);
    
    var deleteButton = document.createElement('button');
    deleteButton.className = 'times-table-delete';
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
      this._rows[insertIdx-1].after(jRow);
    }
    this._rows.splice(insertIdx, 0, row);
  };
  
  TimesTable.prototype.select = function(idx) {
    if (idx >= this.count()) {
      this.select(-1);
      return;
    }
    
    // Deselect the currently selected row.
    if (this._selected >= 0 && this._selected < this.count()) {
      this._rows[this._selected].className = 'times-table-row';
    }
    
    // Select the new row.
    this._selected = idx;
    if (idx >= 0) {
      this._rows[idx].className = 'times-table-row times-table-selected';
      // TODO: scroll to the element in the list.
    }
  };
  
  TimesTable.prototype.selected = function() {
    return this._selected;
  };
  
  TimesTable.prototype._handleClick = function(row, e) {
    e.stopPropagation();
    this._select(this._rows.indexOf(row));
  };
  
  TimesTable.prototype._handleDelete = function(row, e) {
    e.stopPropagation();
    var idx = this._rows.indexOf(row);
    this.delete(idx);
    if (this.ondelete) {
      this.ondelete(idx);
    }
  };
  
  TimesTable.prototype._handleDouble = function(row, e) {
    e.stopPropagation();
    var idx = this._rows.indexOf(row);
    this._select(idx);
    if (this.onopen) {
      this.onopen(idx);
    }
  };
  
  TimesTable.prototype._select = function(idx) {
    var cur = this._selected;
    this.select(idx);
    if (this.onselect && cur !== this._selected) {
      this.onselect(this._selected);
    }
  };
  
  if (!window.app) {
    window.app = {};
  }
  
  window.app.TimesTable = TimesTable;
  
});