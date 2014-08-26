# vz Machine

[![NPM](https://nodei.co/npm/vz.machine.png?downloads=true)](https://nodei.co/npm/vz.machine/)

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


