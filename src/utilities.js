var $isplainobject = function( obj ) {
  // Not own constructor property must be Object
  if ( obj.constructor &&
    !obj.hasOwnProperty('constructor') &&
    !obj.constructor.prototype.hasOwnProperty('isPrototypeOf')) {
    return false;
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.

  var key;
  for ( key in obj ) {}

  return key === undefined || obj.hasOwnProperty(key);
};

var $extend = function(destination) {
  var source, i,property;
  for(i=1; i<arguments.length; i++) {
    source = arguments[i];
    for (property in source) {
      if(!source.hasOwnProperty(property)) continue;
      if(source[property] && $isplainobject(source[property])) {
        if(!destination.hasOwnProperty(property)) destination[property] = {};
        $extend(destination[property], source[property]);
      }
      else {
        destination[property] = source[property];
      }
    }
  }
  return destination;
};

var $shallowCopy = function(obj) {
  var res = {};
  for (var property in obj) {
    if (!obj.hasOwnProperty(property)) {
      continue;
    }
    res[property] = obj[property];
  }
  return res;
};

var $isEmpty = function(obj) {
  for (var property in obj) {
    if (obj.hasOwnProperty(property)) {
      return false;
    }
  }
  return true;
};

var $extendPersistentArr = function(obj, sources, sources_start) {
  // optimization for empty obj
  if ($isEmpty(obj) && sources.length > sources_start) {
    return $extendPersistentArr(sources[sources_start], sources, sources_start + 1);
  }
  
  // we'll make a copy of obj the first time we need to change it
  var copied = false;
  
  for (var i = sources_start; i < sources.length; i++) {
    var source = sources[i];
    
    for (var property in source) {
      if (!source.hasOwnProperty(property)) {
        continue;
      }
      
      // compute new value of this property
      var new_value;
      if (obj.hasOwnProperty(property) && $isplainobject(obj[property]) && $isplainobject(source[property])) {
        new_value = $extendPersistentArr(obj[property], [source[property]], 0);
      } else {
        new_value = source[property];
      }
      
      // possibly do the assigment of the new value to the old value
      if (!obj.hasOwnProperty(property) || new_value !== obj[property]) {
        if (!copied) {
          obj = $shallowCopy(obj);
          copied = true;
        }
        obj[property] = new_value;
      }
    }
  }
  
  return obj;
};

var $extendPersistent = function(obj) {
  return $extendPersistentArr(obj, arguments, 1);
};

var $each = function(obj,callback) {
  if(!obj) return;
  var i;
  if(typeof obj.length !== 'undefined') {
    for(i=0; i<obj.length; i++) {
      if(callback(i,obj[i])===false) return;
    }
  }
  else {
    for(i in obj) {
      if(!obj.hasOwnProperty(i)) continue;
      if(callback(i,obj[i])===false) return;
    }
  }
};

var $trigger = function(el,event) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(event, true, true);
  el.dispatchEvent(e);
};
