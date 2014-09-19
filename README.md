# vz Machine

[![NPM](https://nodei.co/npm/vz.machine.png?downloads=true)](https://nodei.co/npm/vz.machine/)

No piece of software is ever completed, feel free to contribute and be humble

## Sample usage:

```javascript

var Machine = require('vz.machine'),
    turnstile = new Machine();

turnstile.state = 'locked';

turnstile.on('coin:locked',function(){ this.state = 'unlocked'; });
turnstile.on('push:unlocked',function(){ this.state = 'locked'; });

turnstile.fire('coin'); // unlocked
turnstile.fire('push'); // locked again

```

## Reference

### Machine object

#### Constructor([dontInitialize])

Creates and initializes a Machine object. If *dontInitialize* evaluates to true, the machine isn't initialized and may be initialized later by calling `Machine.call(obj);`.

#### static Machine.mechanize(object[,dontInitialize])

Lets an arbitrary object to behave like a Machine, without touching its prototype.

#### Machine.on(event1[,event2,...],callback1[,callback2,...])

Adds all specified callbacks to the machine. These callbacks will be executed when any of the specified events happen. Events are strings having one of two patterns: '*event*:*state*', which will be triggered when *event* is fired while being in the *state* state, or '*event*', which will be triggered when *event* is fired, independently of the state of the machine.

As a result of this call, the '*event*-listened' event will be called and resolved immediately if one or more of the new events being listened for were not previously in said state. 'listened-event', receiving as only argument *event*, will also be called.

**Note:** a callback may only be added once to a particular event

#### Machine.fire([thisArg,]event[,argument1,argument2,...])
#### Machine.fireArray([thisArg,]event,arguments)

Adds the callbacks associated with an event to a new [Collection](https://www.npmjs.org/package/vz.collection "vz.collection") which will be resolved asynchronously unless said collection, returned as the result of this call, is resolved outside of the function.

This will execute callbacks associated with '*event*', '*event*:*state*', 'everything' and 'everything:*state*', with *thisArg* or the machine as the thisArg.

**Note:** in the context of this function, events are strings made of any character but ':', said character will be removed if included in the event name.

#### Machine.detach([event1[,event2,...]][,callback1[,callback2,...]])

Removes callbacks from the machine. If one or more events are specified, and one or more callbacks are specified too, said callbacks will be removed from said events. If one or more events are specified, but no callbacks are, all callbacks will be removed from said events. If one or more callbacks are specified, but no events are, said callbacks
will be removed from all events. If neither events nor callbacks are specified, the current callback being executed, if any, will be removed from the current event being processed, if any.

Analogously with Machine.on, this function will call and resolve immediately the '*event*-ignored' event if one or more of the specified events are left without callbacks as the result of this operation. 'ignored-event', receiving as only argument *event*, will also be called.

#### Machine.eventListened(event)

Returns wether the *event* event is being listened for or not.

**Note:** in the context of this function, events are strings made of any character but ':', said character will be removed if included in the event name.

#### Machine.event

If there's a callback currently running, this represents the event being processed, eg '*event*'.

#### Machine.actualEvent

If there's a callback currently running, this represents the event for which this callback was registered, eg '*event*:*state*'.

#### Machine.listener

If there's a callback currently running, this represents said callback.

#### Machine.state

The state of the machine. It defaults to ''. When changed it fires and resolves the following events in the following order:

* 'new-state', with *new state* as the only argument
* '*previous state*->*new state*', with no arguments
* '*previous state* end', with *new state* as the only argument
* '*new state* start', with *old state* as the only argument

