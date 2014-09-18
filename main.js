
var Machine,
    
    Property = require('vz.property'),
    nextTick = require('vz.next-tick'),
    Collection = require('vz.collection'),
    constants = require('vz.constants'),
    
    state = new Property(),
    listeners = new Property(),
    numberOfListeners = new Property(),
    
    event = new Property(),
    actualEvent = new Property(),
    listener = new Property(),
    
    RE = /^([^:]*)(:(.*))?$/,
    
    propertiesBag;

module.exports = Machine = function(dontInitialize){
  if(dontInitialize) return;
  
  state.of(this).value = '';
  event.of(this).value = null;
  listener.of(this).value = null;
  
  listeners.of(this).value = {};
  numberOfListeners.of(this).value = {};
};

function clear(that){
  event.of(that).value = null;
  listener.of(that).value = null;
  actualEvent.of(that).value = null;
}

function listenerCaller(lis,args,that,e,actual){
  var ret;
  
  nextTick(clear,[that]);
  
  event.of(that).value = e;
  listener.of(that).value = lis;
  actualEvent.of(that).value = actual;
  
  ret = lis.apply(that,args);
  clear(that);
  
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
  fire: {value: function(){
    var e0 = arguments[0].replace(/:/g,''),
        event = e0,
        lis,
        i,
        collection = new Collection(),
        args = [];
    
    for(i = 1;i < arguments.length;i++) args.push(arguments[i]);
    
    if(event != 'everything'){
      
      if(lis = listeners.of(this).value[event]) for(i = 0;i < lis.length;i++){
        collection.add(listenerCaller,[lis[i],args,this,e0,event]);
      }
      
      event += ':' + this.state;
      
      if(lis = listeners.of(this).value[event]) for(i = 0;i < lis.length;i++){
        collection.add(listenerCaller,[lis[i],args,this,e0,event]);
      }
      
      event = 'everything';
      
    }
    
    if(lis = listeners.of(this).value[event]) for(i = 0;i < lis.length;i++){
      collection.add(listenerCaller,[lis[i],args,this,e0,event]);
    }
    
    event += ':' + this.state;
    
    if(lis = listeners.of(this).value[event]) for(i = 0;i < lis.length;i++){
      collection.add(listenerCaller,[lis[i],args,this,e0,event]);
    }
    
    nextTick(collection.resolve,[],collection);
    
    return collection;
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
      return event.of(this).value;
    },
    set: constants.NOOP
  },
  actualEvent: {
    get: function(){
      return actualEvent.of(this).value;
    },
    set: constants.NOOP
  },
  listener: {
    get: function(){
      return listener.of(this).value;
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

