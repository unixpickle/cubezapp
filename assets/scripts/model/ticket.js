(function() {

  // A Ticket is an object representing a cancellable async request. Tickets are
  // essential to the entire model.
  function Ticket(callback) {
    this._callback = callback || function(){};
    this._cancelled = false;
    this._done = false;
  }

  // cancel stops the request. If the request is already done, this does
  // nothing. If you override this in the subclass, you should call the
  // superclass's cancel() function.
  Ticket.prototype.cancel = function() {
    this._cancelled = true;
  };

  // fail should only be called by the subclass in order to report an error to
  // the callback.
  Ticket.prototype.fail = function(e) {
    if (this._done) {
      throw new Error('error called on a completed ticket.');
    } else if (this._cancelled) {
      return;
    }
    this._done = true;
    this._callback(e, null);
  };

  // finish should only be called by the subclass in order to report a
  // successful operation. The argument d is passed as the second argument to
  // the ticket's callback. The first argument (the error) will be null.
  Ticket.prototype.finish = function(d) {
    if (this._done) {
      throw new Error('finish called on a completed ticket.');
    } else if (this._cancelled) {
      return;
    }
    this._done = true;
    this._callback(null, d);
  };

  // A DataTicket reports a piece of specified data after a short timeout.
  // This is good for emulating asynchronous behavior for synchronous
  // operations.
  function DataTicket(callback, data) {
    Ticket.call(this, callback);
    setTimeout(function() {
      this.finish(data);
    }.bind(this), 10);
  }

  DataTicket.prototype = Object.create(Ticket.prototype);

  // An ErrorTicket reports a pre-defined error after a short timeout.
  // This is good for emulating asynchronous behavior for synchronous
  // operations.
  function ErrorTicket(callback, error) {
    Ticket.call(this, callback);
    setTimeout(function() {
      this.fail(error);
    }.bind(this), 10);
  }

  ErrorTicket.prototype = Object.create(Ticket.prototype);

  window.app.Ticket = Ticket;
  window.app.DataTicket = DataTicket;
  window.app.ErrorTicket = ErrorTicket;

})();
