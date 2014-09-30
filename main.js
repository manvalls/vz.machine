
var Machine,
    
    Property = require('vz.property'),
    nextTick = require('vz.next-tick'),
    Collection = require('vz.collection'),
    constants = require('vz.constants'),
    
    state = new Property(),
    listeners = new Property(),
    numberOfListeners = new Property(),
    
    event = [],
    actualEvent = [],
    listener = [],
    
    RE = /^([^:]*)(:(.*))?$/,
    
    propertiesBag;

module.exports = Machine = function(dontInitialize){
  if(dontInitialize) return;
  
  state.of(this).value = '';
  listeners.of(this).value = {};
  numberOfListeners.of(this).value = {};
};

function clear(){
  event.splice(0);
  listener.splice(0);
  actualEvent.splice(0);
}

function listenerCaller(lis,args,that,e,actual){
  var ret;
  
  nextTick(clear);
  
  event.push(e);
  listener.push(lis);
  actualEvent.push(actual);
  
  ret = lis.apply(that,args);
  
  event.pop();
  listener.pop();
  actualEvent.pop();
  
  return ret;
}

propertiesBag = {
  on: {value: function(){
    var i,j,
        _events = [],
        _listeners = [],
        collection = new Collection(),
        listener,
        event;
    
    for(i = 0;typeof arguments[i] == 'string';i++) _events.push(arguments[i]);
    for(;i < arguments.length;i++) _listeners.push(arguments[i]);
    
    if(!(_events.length && _listeners.length)) return this;
    
    for(i = 0;i < _events.length;i++){
      for(j = 0;j < _listeners.length;j++){
        event = _events[i];
        listener = _listeners[j];
        
        if(!listeners.of(this).value[event]) listeners.of(this).value[event] = [listener];
        else{
          if(listeners.of(this).value[event].indexOf(listener) != -1) continue;
          listeners.of(this).value[event].push(listener);
        }
        
        event = event.match(RE)[1];
        
        if(!numberOfListeners.of(this).value[event]){
          numberOfListeners.of(this).value[event] = 1;
          collection.add(this.fire,[event + '-listened'],this);
          collection.add(this.fire,['listened-event',event],this);
        }else numberOfListeners.of(this).value[event]++;
      }
    }
    
    collection = collection.resolve();
    for(i = 0;i < collection.length;i++) collection[i].resolve();
    
    return this;
  }},
  
  fireArray: {value: function(execute,that,event,args){
    var e0,
        lis,
        i,
        collection = new Collection();
    
    if(typeof execute != 'boolean'){
      args = event;
      event = that;
      that = execute;
      execute = true;
    }
    
    if(!args){
      args = event;
      event = that;
      that = this;
    }
    
    event = event.replace(/:/g,'');
    e0 = event;
    
    if(event != 'everything'){
      
      if(lis = listeners.get(this)[event]) for(i = 0;i < lis.length;i++){
        collection.add(listenerCaller,[lis[i],args,that,e0,event]);
      }
      
      event += ':' + this.state;
      
      if(lis = listeners.get(this)[event]) for(i = 0;i < lis.length;i++){
        collection.add(listenerCaller,[lis[i],args,that,e0,event]);
      }
      
      event = 'everything';
      
    }
    
    if(lis = listeners.get(this)[event]) for(i = 0;i < lis.length;i++){
      collection.add(listenerCaller,[lis[i],args,that,e0,event]);
    }
    
    event += ':' + this.state;
    
    if(lis = listeners.get(this)[event]) for(i = 0;i < lis.length;i++){
      collection.add(listenerCaller,[lis[i],args,that,e0,event]);
    }
    
    if(execute) nextTick(collection.resolve,[],collection);
    
    return collection;
  }},
  fire: {value: function(){
    var event,
        args = [],
        that,
        execute,
        i = 0;
    
    if(typeof arguments[i] == 'boolean'){
      execute = arguments[i];
      i++;
    }else execute = true;
    
    if(typeof arguments[i] == 'string'){
      event = arguments[i];
      that = this;
      i++;
    }else{
      event = arguments[i + 1];
      that = arguments[i];
      i += 2;
    }
    
    for(;i < arguments.length;i++) args.push(arguments[i]);
    
    return this.fireArray(execute,that,event,args);
  }},
  
  detach: {value: function(){
    var _events = [],
        _event,
        _listeners = [],
        collection = new Collection(),
        lis,
        keys,
        i,j,k;
    
    if(!arguments.length) return this.detach(this.actualEvent,this.listener);
    
    for(i = 0;typeof arguments[i] == 'string';i++) _events.push(arguments[i]);
    for(;i < arguments.length;i++) _listeners.push(arguments[i]);
    
    if(_events.length){
      if(_listeners.length) for(i = 0;i < _events.length;i++){
        if(!(lis = listeners.of(this).value[_events[i]])) continue;
        _event = _events[i].match(RE)[1];
        for(j = 0;j < _listeners.length;j++){
          k = lis.indexOf(_listeners[j]);
          if(k != -1){
            lis.splice(k,1);
            if(!lis.length){
              delete listeners.of(this).value[_events[i]];
              numberOfListeners.of(this).value[_event]--;
              if(!numberOfListeners.of(this).value[_event]){
                delete numberOfListeners.of(this).value[_event];
                collection.add(this.fire,[_event + '-ignored'],this);
                collection.add(this.fire,['ignored-event',_event],this);
              }
            }
          }
        }
      }
      else for(i = 0;i < _events.length;i++) if(listeners.of(this).value[_events[i]]){
        delete listeners.of(this).value[_events[i]];
        _event = _events[i].match(RE)[1];
        numberOfListeners.of(this).value[_event]--;
        if(!numberOfListeners.of(this).value[_event]){
          delete numberOfListeners.of(this).value[_event];
          collection.add(this.fire,[_event + '-ignored'],this);
          collection.add(this.fire,['ignored-event',_event],this);
        }
      }
    }else if(_listeners.length){
      lis = listeners.of(this).value;
      keys = Object.keys(lis);
      for(i = 0;i < _listeners.length;i++){
        for(j = 0;j < keys.length;j++) this.detach(keys[j],_listeners[i]);
      }
    }
    
    collection = collection.resolve();
    for(i = 0;i < collection.length;i++) collection[i].resolve();
    
    return this;
  }},
  
  eventListened: {
    value: function(event){
      event = event.replace(/:/g,'');
      return !!numberOfListeners.of(this).value[event];
    }
  },
  
  event: {
    get: function(){
      return event[event.length - 1];
    },
    set: constants.NOOP
  },
  actualEvent: {
    get: function(){
      return actualEvent[actualEvent.length - 1];
    },
    set: constants.NOOP
  },
  listener: {
    get: function(){
      return listener[listener.length - 1];
    },
    set: constants.NOOP
  },
  
  state: {
    get: function(){
      return state.of(this).value;
    },
    set: function(st1){
      var st0 = this.state;
      
      st1 = (st1 || '').toString();
      
      state.of(this).value = st1;
      
      this.fire('new-state',st1).resolve();
      this.fire(st0 + '->' + st1).resolve();
      this.fire(st0 + ' end',st1).resolve();
      this.fire(st1 + ' start',st0).resolve();
    }
  }
};

Machine.mechanize = function(object,dontInitialize){
  Object.defineProperties(object,propertiesBag);
  if(dontInitialize) return;
  Machine.call(object);
};

Object.defineProperties(Machine.prototype,propertiesBag);

