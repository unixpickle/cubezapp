# Abstract

The EventEmitter is a base class which makes event management relatively simple.

# Inheriting EventEmitter

The EventEmitter class can be accessed as `window.app.EventEmitter`. You can "subclass" it using prototypal inheritance:

    function MyClass() {
        window.app.EventEmitter.call(this);
    }
    MyClass.prototype = Object.create(window.app.EventEmitter.prototype);

Once you have done this, `MyClass` will have the methods listed in the next section.

# API

The EventEmitter class defines the following methods:

 * **addListener**(name, func) - add a listener for an event
 * **emit**(name, [args...]) - call all listeners of an event, passing them an optional set of arguments
 * **listeners**(name) - get a list of listeners for an event
 * **on**(name, func) - an alias for **addListener**
 * **once**(name, func) - register a listener that is removed after the first event
 * **removeAllListeners**([name]) - remove all the listeners for the given name, or all the listeners in general if no name is specified
 * **removeListener**(name, func) - remove a listener for the given name