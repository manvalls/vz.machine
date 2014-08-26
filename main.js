
var Machine,
    
    Property = require('vz.property'),
    nextTick = require('vz.next-tick'),
    Collection = require('vz.collection'),
    constants = require('vz.constants'),
    
    state = new Property(),
    listeners = new Property(),
    numberOfListeners = new Property(),
    
    event = new Property(),
    listener = new Property(),
    
    RE = /^([^:]*)(:(.*))?$/,
    
    propertiesBag;

module.exports = Machine = function(){
  state.of(this).value = '';
  event.of(this).value = null;
  listener.of(this).value = null;
  
  listeners.of(this).value = {};
  numberOfListeners.of(this).value = {};
};

function clear(that){
  event.of(that).value = null;
  listener.of(that).value = null;
}

function listenerCaller(lis,args,that,e){
  var ret;
  
  nextTick(clear,[that]);
  
  event.of(that).value = e;
  listener.of(that).value = lis;
  ret = lis.apply(that,args);
  clear(that);
  
  return ret;
}

propertiesBag = {
  on: {value: function(){
    var i,j,
        _events = [],
        _listeners = [],
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
          this.fire('event-listened',event);
        }else numberOfListeners.of(this).value[event]++;
      }
    }
    
    return this;
  }},
  fire: {value: function(){
    var event = arguments[0],
        lis,
        i,
        collection = new Collection(),
        args = [];
    
    for(i = 1;i < arguments.length;i++) args.push(arguments[i]);
    
    if(event != 'everything'){
      
      if(lis = listeners.of(this).value[event]) for(i = 0;i < lis.length;i++){
        collection.add(listenerCaller,[lis[i],args,this,arguments[0]]);
      }
      
      event += ':' + this.state;
      
      if(lis = listeners.of(this).value[event]) for(i = 0;i < lis.length;i++){
        collection.add(listenerCaller,[lis[i],args,this,arguments[0]]);
      }
      
      event = 'everything';
      
    }
    
    if(lis = listeners.of(this).value[event]) for(i = 0;i < lis.length;i++){
      collection.add(listenerCaller,[lis[i],args,this,arguments[0]]);
    }
    
    event += ':' + this.state;
    
    if(lis = listeners.of(this).value[event]) for(i = 0;i < lis.length;i++){
      collection.add(listenerCaller,[lis[i],args,this,arguments[0]]);
    }
    
    nextTick(collection.resolve,[],collection);
    
    return collection;
  }},
  detach: {value: function(){
    var _events = [],
        _event,
        _listeners = [],
        lis,
        keys,
        i,j,k;
    
    if(!arguments.length) return this.detach(this.event,this.listener);
    
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
                this.fire('event-ignored',_event);
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
          this.fire('event-ignored',_event);
        }
      }
    }else if(_listeners.length){
      lis = listeners.of(this).value;
      keys = Object.keys(lis);
      for(i = 0;i < _listeners.length;i++){
        for(j = 0;j < keys.length;j++) this.detach(keys[j],_listeners[i]);
      }
    }
    
    return this;
  }},
  
  eventListened: {
    value: function(event){
      return !!numberOfListeners.of(this).value[event];
    }
  },
  event: {
    get: function(){
      return event.of(this).value;
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
      
      this.fire(st0 + '->' + st1);
      this.fire(st0 + ' end',st1);
      this.fire(st1 + ' start',st0);
      
      state.of(this).value = st1;
    }
  }
};

Machine.mechanize = function(object){
  Object.defineProperties(object,propertiesBag);
  Machine.call(object);
};

Object.defineProperties(Machine.prototype,propertiesBag);
