/*! JSON Editor v0.7.10 - JSON Schema -> HTML Editor
 * By Jeremy Dorn - https://github.com/jdorn/json-editor/
 * Released under the MIT license
 *
 * Date: 2014-09-15
 */

/**
 * See README.md for requirements and usage info
 */

(function() {

/*jshint loopfunc: true */
/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
var Class;
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){window.postMessage("xyz");}) ? /\b_super\b/ : /.*/;
 
  // The base Class implementation (does nothing)
  Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;
 
    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
  
  return Class;
})();

// CustomEvent constructor polyfill
// From MDN
(function () {
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || 
                                      window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// Array.isArray polyfill
// From MDN
(function() {
	if(!Array.isArray) {
	  Array.isArray = function(arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	  };
	}
}());
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
var $triggerc = function(el,event) {
  var e = new CustomEvent(event,{
    bubbles: true,
    cancelable: true
  });

  el.dispatchEvent(e);
};

var JSONEditor = function(element,options) {
  this.element = element;
  this.options = $extendPersistent(JSONEditor.defaults.options, options || {});
  this.init();
};
JSONEditor.prototype = {
  init: function() {
    var self = this;
    
    this.ready = false;

    var theme_class = JSONEditor.defaults.themes[this.options.theme || JSONEditor.defaults.theme];
    if(!theme_class) throw "Unknown theme " + (this.options.theme || JSONEditor.defaults.theme);
    
    this.schema = this.options.schema;
    this.theme = new theme_class();
    this.template = this.options.template;
    this.uuid = 0;
    this.__data = {};
    
    var icon_class = JSONEditor.defaults.iconlibs[this.options.iconlib || JSONEditor.defaults.iconlib];
    if(icon_class) this.iconlib = new icon_class();

    this.root_container = this.theme.getContainer();
    this.element.appendChild(this.root_container);
    
    this.translate = this.options.translate || JSONEditor.defaults.translate;

    self.validator = new JSONEditor.Validator(self);
    
    // Create the root editor
    var editor_class = self.getEditorClass(self.schema);
    self.root = self.createEditor(editor_class, {
      jsoneditor: self,
      schema: self.schema,
      required: true,
      container: self.root_container
    });
    
    self.root.build();

    // Starting data
    if(self.options.startval) self.root.setValue(self.options.startval);

    self.validation_results = self.validator.validate(self.root.getValue());
    self.root.showValidationErrors(self.validation_results);
    self.ready = true;

    // Fire ready event asynchronously
    window.requestAnimationFrame(function() {
      if (!self.ready) {
        return;
      }
      self.validation_results = self.validator.validate(self.root.getValue());
      self.root.showValidationErrors(self.validation_results);
      self.trigger('ready');
      self.trigger('change');
    });
  },
  getValue: function() {
    if(!this.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before getting the value";

    return this.root.getFinalValue();
  },
  setValue: function(value) {
    if(!this.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before setting the value";

    this.root.setValue(value);
    return this;
  },
  validate: function(value) {
    if(!this.ready) throw "JSON Editor not ready yet.  Listen for 'ready' event before validating";
    
    // Custom value
    if(arguments.length === 1) {
      return this.validator.validate(value);
    }
    // Current value (use cached result)
    else {
      return this.validation_results;
    }
  },
  destroy: function() {
    if(this.destroyed) return;
    if(!this.ready) return;
    
    this.schema = null;
    this.options = null;
    this.root.destroy();
    this.root = null;
    this.root_container = null;
    this.validator = null;
    this.validation_results = null;
    this.theme = null;
    this.iconlib = null;
    this.template = null;
    this.__data = null;
    this.ready = false;
    this.element.innerHTML = '';
    
    this.destroyed = true;
  },
  on: function(event, callback) {
    this.callbacks = this.callbacks || {};
    this.callbacks[event] = this.callbacks[event] || [];
    this.callbacks[event].push(callback);
  },
  off: function(event, callback) {
    // Specific callback
    if(event && callback) {
      this.callbacks = this.callbacks || {};
      this.callbacks[event] = this.callbacks[event] || [];
      var newcallbacks = [];
      for(var i=0; i<this.callbacks[event].length; i++) {
        if(this.callbacks[event][i]===callback) continue;
        newcallbacks.push(this.callbacks[event][i]);
      }
      this.callbacks[event] = newcallbacks;
    }
    // All callbacks for a specific event
    else if(event) {
      this.callbacks = this.callbacks || {};
      this.callbacks[event] = [];
    }
    // All callbacks for all events
    else {
      this.callbacks = {};
    }
  },
  trigger: function(event) {
    if(this.callbacks && this.callbacks[event] && this.callbacks[event].length) {
      for(var i=0; i<this.callbacks[event].length; i++) {
        this.callbacks[event][i]();
      }
    }
  },
  getEditorClass: function(schema) {
    var classname;

    $each(JSONEditor.defaults.resolvers,function(i,resolver) {
      var tmp = resolver(schema);
      if(tmp) {
        if(JSONEditor.defaults.editors[tmp]) {
          classname = tmp;
          return false;
        }
      }
    });

    if(!classname) throw "Unknown editor for schema "+JSON.stringify(schema);
    if(!JSONEditor.defaults.editors[classname]) throw "Unknown editor "+classname;

    return JSONEditor.defaults.editors[classname];
  },
  createEditor: function(editor_class, options) {
    if (editor_class.options) {
      options = $extendPersistent(editor_class.options, options);
    }
    return new editor_class(options);
  },
  onChange: function() {
    if(!this.ready) return;
    
    if(this.firing_change) return;
    this.firing_change = true;
    
    var self = this;
    
    window.requestAnimationFrame(function() {
      self.firing_change = false;
      if(!self.ready) return;

      // Validate and cache results
      self.validation_results = self.validator.validate(self.root.getValue());
      
      if(self.options.show_errors !== "never") {
        self.root.showValidationErrors(self.validation_results);
      }
      
      // Fire change event
      self.trigger('change');
    });
  },
  compileTemplate: function(template, name) {
    name = name || JSONEditor.defaults.template;

    var engine;

    // Specifying a preset engine
    if(typeof name === 'string') {
      if(!JSONEditor.defaults.templates[name]) throw "Unknown template engine "+name;
      engine = JSONEditor.defaults.templates[name]();

      if(!engine) throw "Template engine "+name+" missing required library.";
    }
    // Specifying a custom engine
    else {
      engine = name;
    }

    if(!engine) throw "No template engine set";
    if(!engine.compile) throw "Invalid template engine set";

    return engine.compile(template);
  },
  _data: function(el,key,value) {
    // Setting data
    if(arguments.length === 3) {
      var uuid;
      if(el.hasAttribute('data-jsoneditor-'+key)) {
        uuid = el.getAttribute('data-jsoneditor-'+key);
      }
      else {
        uuid = this.uuid++;
        el.setAttribute('data-jsoneditor-'+key,uuid);
      }

      this.__data[uuid] = value;
    }
    // Getting data
    else {
      // No data stored
      if(!el.hasAttribute('data-jsoneditor-'+key)) return null;
      
      return this.__data[el.getAttribute('data-jsoneditor-'+key)];
    }
  },
  registerEditor: function(editor) {
    this.editors = this.editors || {};
    this.editors[editor.path] = editor;
    return this;
  },
  unregisterEditor: function(editor) {
    this.editors = this.editors || {};
    this.editors[editor.path] = null;
    return this;
  },
  getEditor: function(path) {
    if(!this.editors) return;
    return this.editors[path];
  },
  doWatch: function(path,callback) {
    this.watchlist = this.watchlist || {};
    this.watchlist[path] = this.watchlist[path] || [];
    this.watchlist[path].push(callback);
    
    return this;
  },
  doUnwatch: function(path,callback) {
    if(!this.watchlist || !this.watchlist[path]) return this;
    // If removing all callbacks for a path
    if(!callback) {
      this.watchlist[path] = null;
      return this;
    }
    
    var newlist = [];
    for(var i=0; i<this.watchlist[path].length; i++) {
      if(this.watchlist[path][i] === callback) continue;
      else newlist.push(this.watchlist[path][i]);
    }
    this.watchlist[path] = newlist.length? newlist : null;
    return this;
  },
  notifyWatchers: function(path) {
    if(!this.watchlist || !this.watchlist[path]) return this;
    for(var i=0; i<this.watchlist[path].length; i++) {
      this.watchlist[path][i]();
    }
  },
  isEnabled: function() {
    return !this.root || this.root.isEnabled();
  },
  enable: function() {
    this.root.enable();
  },
  disable: function() {
    this.root.disable();
  }
};

JSONEditor.defaults = {
  themes: {},
  templates: {},
  iconlibs: {},
  editors: {},
  languages: {},
  resolvers: [],
  custom_validators: []
};

JSONEditor.Validator = Class.extend({
  init: function(jsoneditor,schema) {
    this.jsoneditor = jsoneditor;
    this.schema = schema || this.jsoneditor.schema;
    this.options = {};
    this.translate = this.jsoneditor.translate || JSONEditor.defaults.translate;
  },
  validate: function(value) {
    return this._validateSchema(this.schema, value);
  },
  _validateSchema: function(schema,value,path) {
    var errors = [];
    var valid, i, j;
    var stringified = JSON.stringify(value);

    path = path || 'root';

    // Work on a copy of the schema
    schema = $extend({}, schema);

    /*
     * Type Agnostic Validation
     */

    // Version 3 `required`
    if(schema.required && schema.required === true) {
      if(typeof value === "undefined") {
        errors.push({
          path: path,
          property: 'required',
          message: this.translate("error_notset")
        });

        // Can't do any more validation at this point
        return errors;
      }
    }
    // Value not defined
    else if(typeof value === "undefined") {
      // If required_by_default is set, all fields are required
      if(this.jsoneditor.options.required_by_default) {
        errors.push({
          path: path,
          property: 'required',
          message: this.translate("error_notset")
        });
      }
      // Not required, no further validation needed
      else {
        return errors;
      }
    }

    // `enum`
    if(schema.enum) {
      valid = false;
      for(i=0; i<schema.enum.length; i++) {
        if(stringified === JSON.stringify(schema.enum[i])) valid = true;
      }
      if(!valid) {
        errors.push({
          path: path,
          property: 'enum',
          message: this.translate("error_enum")
        });
      }
    }

    // `extends` (version 3)
    if(schema.extends) {
      for(i=0; i<schema.extends.length; i++) {
        errors = errors.concat(this._validateSchema(schema.extends[i],value,path));
      }
    }

    // `allOf`
    if(schema.allOf) {
      for(i=0; i<schema.allOf.length; i++) {
        errors = errors.concat(this._validateSchema(schema.allOf[i],value,path));
      }
    }

    // `anyOf`
    if(schema.anyOf) {
      valid = false;
      for(i=0; i<schema.anyOf.length; i++) {
        if(!this._validateSchema(schema.anyOf[i],value,path).length) {
          valid = true;
          break;
        }
      }
      if(!valid) {
        errors.push({
          path: path,
          property: 'anyOf',
          message: this.translate('error_anyOf')
        });
      }
    }

    // `oneOf`
    if(schema.oneOf) {
      valid = 0;
      var oneof_errors = [];
      for(i=0; i<schema.oneOf.length; i++) {
        // Set the error paths to be path.oneOf[i].rest.of.path
        var tmp = this._validateSchema(schema.oneOf[i],value,path);
        if(!tmp.length) {
          valid++;
        }

        for(j=0; j<tmp.length; j++) {
          tmp[j].path = path+'.oneOf['+i+']'+tmp[j].path.substr(path.length);
        }
        oneof_errors = oneof_errors.concat(tmp);

      }
      if(valid !== 1) {
        errors.push({
          path: path,
          property: 'oneOf',
          message: this.translate('error_oneOf', [valid])
        });
        errors = errors.concat(oneof_errors);
      }
    }

    // `not`
    if(schema.not) {
      if(!this._validateSchema(schema.not,value,path).length) {
        errors.push({
          path: path,
          property: 'not',
          message: this.translate('error_not')
        });
      }
    }

    // `type` (both Version 3 and Version 4 support)
    if(schema.type) {
      // Union type
      if(Array.isArray(schema.type)) {
        valid = false;
        for(i=0;i<schema.type.length;i++) {
          if(this._checkType(schema.type[i], value)) {
            valid = true;
            break;
          }
        }
        if(!valid) {
          errors.push({
            path: path,
            property: 'type',
            message: this.translate('error_type_union')
          });
        }
      }
      // Simple type
      else {
        if(!this._checkType(schema.type, value)) {
          errors.push({
            path: path,
            property: 'type',
            message: this.translate('error_type', [schema.type])
          });
        }
      }
    }


    // `disallow` (version 3)
    if(schema.disallow) {
      // Union type
      if(Array.isArray(schema.disallow)) {
        valid = true;
        for(i=0;i<schema.disallow.length;i++) {
          if(this._checkType(schema.disallow[i], value)) {
            valid = false;
            break;
          }
        }
        if(!valid) {
          errors.push({
            path: path,
            property: 'disallow',
            message: this.translate('error_disallow_union')
          });
        }
      }
      // Simple type
      else {
        if(this._checkType(schema.disallow, value)) {
          errors.push({
            path: path,
            property: 'disallow',
            message: this.translate('error_disallow', [schema.disallow])
          });
        }
      }
    }

    /*
     * Type Specific Validation
     */

    // Number Specific Validation
    if(typeof value === "number") {
      // `multipleOf` and `divisibleBy`
      if(schema.multipleOf || schema.divisibleBy) {
        valid = value / (schema.multipleOf || schema.divisibleBy);
        if(valid !== Math.floor(valid)) {
          errors.push({
            path: path,
            property: schema.multipleOf? 'multipleOf' : 'divisibleBy',
            message: this.translate('error_multipleOf', [schema.multipleOf || schema.divisibleBy])
          });
        }
      }

      // `maximum`
      if(schema.hasOwnProperty('maximum')) {
        if(schema.exclusiveMaximum && value >= schema.maximum) {
          errors.push({
            path: path,
            property: 'maximum',
            message: this.translate('error_maximum_excl', [schema.maximum])
          });
        }
        else if(!schema.exclusiveMaximum && value > schema.maximum) {
          errors.push({
            path: path,
            property: 'maximum',
            message: this.translate('error_maximum_incl', [schema.maximum])
          });
        }
      }

      // `minimum`
      if(schema.hasOwnProperty('minimum')) {
        if(schema.exclusiveMinimum && value <= schema.minimum) {
          errors.push({
            path: path,
            property: 'minimum',
            message: this.translate('error_minimum_excl', [schema.minimum])
          });
        }
        else if(!schema.exclusiveMinimum && value < schema.minimum) {
          errors.push({
            path: path,
            property: 'minimum',
            message: this.translate('error_minimum_incl', [schema.minimum])
          });
        }
      }
    }
    // String specific validation
    else if(typeof value === "string") {
      // `maxLength`
      if(schema.maxLength) {
        if((value+"").length > schema.maxLength) {
          errors.push({
            path: path,
            property: 'maxLength',
            message: this.translate('error_maxLength', [schema.maxLength])
          });
        }
      }

      // `minLength`
      if(schema.minLength) {
        if((value+"").length < schema.minLength) {          
          errors.push({
            path: path,
            property: 'minLength',
            message: this.translate((schema.minLength===1?'error_notempty':'error_minLength'), [schema.minLength])
          });
        }
      }

      // `pattern`
      if(schema.pattern) {
        if(!(new RegExp(schema.pattern)).test(value)) {
          errors.push({
            path: path,
            property: 'pattern',
            message: this.translate('error_pattern')
          });
        }
      }
    }
    // Array specific validation
    else if(typeof value === "object" && value !== null && Array.isArray(value)) {
      // `items` and `additionalItems`
      if(schema.items) {
        // `items` is an array
        if(Array.isArray(schema.items)) {
          for(i=0; i<value.length; i++) {
            // If this item has a specific schema tied to it
            // Validate against it
            if(schema.items[i]) {
              errors = errors.concat(this._validateSchema(schema.items[i],value[i],path+'.'+i));
            }
            // If all additional items are allowed
            else if(schema.additionalItems === true) {
              break;
            }
            // If additional items is a schema
            // TODO: Incompatibility between version 3 and 4 of the spec
            else if(schema.additionalItems) {
              errors = errors.concat(this._validateSchema(schema.additionalItems,value[i],path+'.'+i));
            }
            // If no additional items are allowed
            else if(schema.additionalItems === false) {
              errors.push({
                path: path,
                property: 'additionalItems',
                message: this.translate('error_additionalItems')
              });
              break;
            }
            // Default for `additionalItems` is an empty schema
            else {
              break;
            }
          }
        }
        // `items` is a schema
        else {
          // Each item in the array must validate against the schema
          for(i=0; i<value.length; i++) {
            errors = errors.concat(this._validateSchema(schema.items,value[i],path+'.'+i));
          }
        }
      }

      // `maxItems`
      if(schema.maxItems) {
        if(value.length > schema.maxItems) {
          errors.push({
            path: path,
            property: 'maxItems',
            message: this.translate('error_maxItems', [schema.maxItems])
          });
        }
      }

      // `minItems`
      if(schema.minItems) {
        if(value.length < schema.minItems) {
          errors.push({
            path: path,
            property: 'minItems',
            message: this.translate('error_minItems', [schema.minItems])
          });
        }
      }

      // `uniqueItems`
      if(schema.uniqueItems) {
        var seen = {};
        for(i=0; i<value.length; i++) {
          valid = JSON.stringify(value[i]);
          if(seen[valid]) {
            errors.push({
              path: path,
              property: 'uniqueItems',
              message: this.translate('error_uniqueItems')
            });
            break;
          }
          seen[valid] = true;
        }
      }
    }
    // Object specific validation
    else if(typeof value === "object" && value !== null) {
      // `maxProperties`
      if(schema.maxProperties) {
        valid = 0;
        for(i in value) {
          if(!value.hasOwnProperty(i)) continue;
          valid++;
        }
        if(valid > schema.maxProperties) {
          errors.push({
            path: path,
            property: 'maxProperties',
            message: this.translate('error_maxProperties', [schema.maxProperties])
          });
        }
      }

      // `minProperties`
      if(schema.minProperties) {
        valid = 0;
        for(i in value) {
          if(!value.hasOwnProperty(i)) continue;
          valid++;
        }
        if(valid < schema.minProperties) {
          errors.push({
            path: path,
            property: 'minProperties',
            message: this.translate('error_minProperties', [schema.minProperties])
          });
        }
      }

      // Version 4 `required`
      if(schema.required && Array.isArray(schema.required)) {
        for(i=0; i<schema.required.length; i++) {
          if(typeof value[schema.required[i]] === "undefined") {
            errors.push({
              path: path,
              property: 'required',
              message: this.translate('error_required', [schema.required[i]])
            });
          }
        }
      }

      // `properties`
      var validated_properties = {};
      if(schema.properties) {
        for(i in schema.properties) {
          if(!schema.properties.hasOwnProperty(i)) continue;
          validated_properties[i] = true;
          errors = errors.concat(this._validateSchema(schema.properties[i],value[i],path+'.'+i));
        }
      }

      // `patternProperties`
      if(schema.patternProperties) {
        for(i in schema.patternProperties) {
          if(!schema.patternProperties.hasOwnProperty(i)) continue;

          var regex = new RegExp(i);

          // Check which properties match
          for(j in value) {
            if(!value.hasOwnProperty(j)) continue;
            if(regex.test(j)) {
              validated_properties[j] = true;
              errors = errors.concat(this._validateSchema(schema.patternProperties[i],value[j],path+'.'+j));
            }
          }
        }
      }

      // The no_additional_properties option currently doesn't work with extended schemas that use oneOf or anyOf
      if(typeof schema.additionalProperties === "undefined" && this.jsoneditor.options.no_additional_properties && !schema.oneOf && !schema.anyOf) {
        schema.additionalProperties = false;
      }

      // `additionalProperties`
      if(typeof schema.additionalProperties !== "undefined") {
        for(i in value) {
          if(!value.hasOwnProperty(i)) continue;
          if(!validated_properties[i]) {
            // No extra properties allowed
            if(!schema.additionalProperties) {
              errors.push({
                path: path,
                property: 'additionalProperties',
                message: this.translate('error_additional_properties', [i])
              });
              break;
            }
            // Allowed
            else if(schema.additionalProperties === true) {
              break;
            }
            // Must match schema
            // TODO: incompatibility between version 3 and 4 of the spec
            else {
              errors = errors.concat(this._validateSchema(schema.additionalProperties,value[i],path+'.'+i));
            }
          }
        }
      }

      // `dependencies`
      if(schema.dependencies) {
        for(i in schema.dependencies) {
          if(!schema.dependencies.hasOwnProperty(i)) continue;

          // Doesn't need to meet the dependency
          if(typeof value[i] === "undefined") continue;

          // Property dependency
          if(Array.isArray(schema.dependencies[i])) {
            for(j=0; j<schema.dependencies[i].length; j++) {
              if(typeof value[schema.dependencies[i][j]] === "undefined") {
                errors.push({
                  path: path,
                  property: 'dependencies',
                  message: this.translate('error_dependency', [schema.dependencies[i][j]])
                });
              }
            }
          }
          // Schema dependency
          else {
            errors = errors.concat(this._validateSchema(schema.dependencies[i],value,path));
          }
        }
      }
    }

    // Custom type validation
    $each(JSONEditor.defaults.custom_validators,function(i,validator) {
      errors = errors.concat(validator(schema,value,path));
    });

    return errors;
  },
  _checkType: function(type, value) {
    // Simple types
    if(typeof type === "string") {
      if(type==="string") return typeof value === "string";
      else if(type==="number") return typeof value === "number";
      else if(type==="integer") return typeof value === "number" && value === Math.floor(value);
      else if(type==="boolean") return typeof value === "boolean";
      else if(type==="array") return Array.isArray(value);
      else if(type === "object") return value !== null && !(Array.isArray(value)) && typeof value === "object";
      else if(type === "null") return value === null;
      else return true;
    }
    // Schema
    else {
      return !this._validateSchema(type,value).length;
    }
  }
});

/**
 * All editors should extend from this class
 */
JSONEditor.AbstractEditor = Class.extend({
  onChildEditorChange: function(editor) {
    this.onChange();
  },
  isAnyParentProcessing: function() {
    for (var editor = this; editor; editor = editor.parent) {
      if (editor.processing_active) {
        return true;
      }
    }
    return false;
  },
  onChange: function() {
    console.assert(this.processing_active, "onChange called outside of processing context??");
    
    this.processing_dirty = true;
  },
  init: function(options) {
    this.jsoneditor = options.jsoneditor;
    
    this.theme = this.jsoneditor.theme;
    this.template_engine = this.jsoneditor.template;
    this.iconlib = this.jsoneditor.iconlib;
    this.schema = options.schema;
    
    this.options = $extendPersistent((options.schema.options || {}), options);
    
    this.path = options.path || 'root';
    this.formname = options.formname || this.path.replace(/\.([^.]+)/g,'[$1]');
    if(this.jsoneditor.options.form_name_root) this.formname = this.formname.replace(/^root\[/,this.jsoneditor.options.form_name_root+'[');
    this.key = this.path.split('.').pop();
    this.parent = options.parent;
    this.watch_id = this.schema.id || null;
    
    this.processing_active = false;
    this.processing_dirty = false;
    this.processing_watch_dirty = false;
    
    if (options.container) {
      this.container = options.container;
    }
  },
  debugPrint: function(msg) {
    console.log(this.path + ': ' + msg);
  },
  build: function() {
    var self = this;
    self.withProcessingContext(function() {
      self.buildImpl();
      self.jsoneditor.registerEditor(self);
      self.setupWatchListeners();
      self.updateHeaderText();
      self.onChange();
    }, 'build');
  },
  setupWatchListeners: function() {
    var self = this;
    
    // Watched fields
    this.watched = {};
    this.watched_values = {};
    this.watch_listener = function() {
      self.withProcessingContext(function() {
        self.processing_watch_dirty = true;
      }, 'watch_listener');
    };
    
    if(this.schema.hasOwnProperty('watch')) {
      for(var name in this.schema.watch) {
        if(!this.schema.watch.hasOwnProperty(name)) continue;
        var path = this.schema.watch[name];

        // Get the ID of the first node and the path within.
        if (typeof path != 'string') throw "Watch path must be a string";
        var path_parts = path.split('.');
        var first_id = path_parts.shift();
        
        // Look for the first node in the ancestor nodes.
        var first_node = null;
        for (var node = self.parent; node; node = node.parent) {
          if (node.watch_id == first_id) {
            first_node = node;
            break;
          }
        }
        if (!first_node) {
          throw "Could not find ancestor node with id " + first_id;
        }
        
        // Construct the final watch path.
        var adjusted_path = first_node.path + (path_parts.length === 0 ? '' : ('.' + path_parts.join('.')));
        
        self.jsoneditor.doWatch(adjusted_path, self.watch_listener);
        
        self.watched[name] = adjusted_path;
      }
    }
    
    // Dynamic header
    if(this.schema.headerTemplate) {
      this.header_template = this.jsoneditor.compileTemplate(this.schema.headerTemplate, this.template_engine);
    }
  },
  getButton: function(text, icon, title) {
    var btnClass = 'json-editor-btn-'+icon;
    if(!this.iconlib) icon = null;
    else icon = this.iconlib.getIcon(icon);
    
    if(!icon && title) {
      text = title;
      title = null;
    }
    
    var btn = this.theme.getButton(text, icon, title);
    btn.className += ' ' + btnClass + ' ';
    return btn;
  },
  setButtonText: function(button, text, icon, title) {
    if(!this.iconlib) icon = null;
    else icon = this.iconlib.getIcon(icon);
    
    if(!icon && title) {
      text = title;
      title = null;
    }
    
    return this.theme.setButtonText(button, text, icon, title);
  },
  refreshWatchedFieldValues: function() {
    if(!this.watched_values) return;
    var watched = {};
    var changed = false;
    var self = this;
    
    if(this.watched) {
      var val,editor;
      for(var name in this.watched) {
        if(!this.watched.hasOwnProperty(name)) continue;
        editor = self.jsoneditor.getEditor(this.watched[name]);
        val = editor? editor.getValue() : null;
        if(self.watched_values[name] !== val) changed = true;
        watched[name] = val;
      }
    }
    
    watched.self = this.getValue();
    if(this.watched_values.self !== watched.self) changed = true;
    
    this.watched_values = watched;
    
    return changed;
  },
  getWatchedFieldValues: function() {
    return this.watched_values;
  },
  updateHeaderText: function() {
    if(this.header) {
      this.header.textContent = this.getHeaderText();
    }
  },
  getHeaderText: function(title_only) {
    if(this.header_text) return this.header_text;
    else if(title_only) return this.schema.title;
    else return this.getTitle();
  },
  onWatchedFieldChange: function() {
    var vars;
    if(this.header_template) {      
      vars = $extendPersistent(this.getWatchedFieldValues(), {
        key: this.key,
        i: this.key,
        i0: (this.key*1),
        i1: (this.key*1+1),
        title: this.getTitle()
      });
      var header_text = this.header_template(vars);
      
      if(header_text !== this.header_text) {
        this.header_text = header_text;
        this.updateHeaderText();
        this.onChange();
      }
    }
  },
  withProcessingContext: function(func, name) {
    var self = this;
    console.assert(!self.processing_active, "already processing??");
    
    var tpro = !!self.jsoneditor.options.trace_processing;
    if (tpro) {
      if (typeof name === 'undefined') {
        name = 'unknown_context';
      }
      self.debugPrint(name + ' ' + '{');
    }
    
    self.processing_active = true;
    self.processing_dirty = false;
    self.processing_watch_dirty = false;
    
    func();
    
    if (self.processing_dirty || self.processing_watch_dirty) {
      if (self.refreshWatchedFieldValues()) {
        self.onWatchedFieldChange();
      }
    }
    
    self.processing_active = false;    
    
    if (tpro) {
      self.debugPrint('}');
    }
    
    if (self.processing_dirty) {
      self.jsoneditor.notifyWatchers(self.path);
      
      if (!self.isAnyParentProcessing()) {
        if (self.parent) {
          self.parent.withProcessingContext(function() {
            self.parent.onChildEditorChange(self);
          }, 'child_editor_change');
        } else {
          self.jsoneditor.onChange();
        }
      }
    }
  },
  setValue: function(value) {
    var self = this;
    self.withProcessingContext(function() {
      self.setValueImpl(value);
    }, 'setValue');
  },
  setValueImpl: function(value) {
    this.value = value;
    this.onChange();
  },
  getValue: function() {
    return this.value;
  },
  getFinalValue: function() {
    return this.getValue();
  },
  refreshValue: function() {

  },
  destroy: function() {
    var self = this;
    $each(this.watched,function(name,adjusted_path) {
      self.jsoneditor.doUnwatch(adjusted_path,self.watch_listener);
    });
    this.jsoneditor.unregisterEditor(this);
    this.watched = null;
    this.watched_values = null;
    this.watch_listener = null;
    this.header_text = null;
    this.header_template = null;
    this.value = null;
    if(this.container && this.container.parentNode) this.container.parentNode.removeChild(this.container);
    this.container = null;
    this.jsoneditor = null;
    this.schema = null;
    this.path = null;
    this.key = null;
    this.parent = null;
  },
  getDefault: function() {
    if(this.schema.default) return this.schema.default;
    if(this.schema.enum) return this.schema.enum[0];
    
    var type = this.schema.type || this.schema.oneOf;
    if(type && Array.isArray(type)) type = type[0];
    if(type && typeof type === "object") type = type.type;
    if(type && Array.isArray(type)) type = type[0];
    
    if(typeof type === "string") {
      if(type === "number") return 0.0;
      if(type === "boolean") return false;
      if(type === "integer") return 0;
      if(type === "string") return "";
      if(type === "object") return {};
      if(type === "array") return [];
    }
    
    return null;
  },
  getTitle: function() {
    return this.schema.title || this.key;
  },
  enable: function() {
    this.disabled = false;
  },
  disable: function() {
    this.disabled = true;
  },
  isEnabled: function() {
    return !this.disabled;
  },
  getDisplayText: function(arr) {
    var disp = [];
    var used = {};
    
    // Determine how many times each attribute name is used.
    // This helps us pick the most distinct display text for the schemas.
    $each(arr,function(i,el) {
      if(el.title) {
        used[el.title] = used[el.title] || 0;
        used[el.title]++;
      }
      if(el.description) {
        used[el.description] = used[el.description] || 0;
        used[el.description]++;
      }
      if(el.format) {
        used[el.format] = used[el.format] || 0;
        used[el.format]++;
      }
      if(el.type) {
        used[el.type] = used[el.type] || 0;
        used[el.type]++;
      }
    });
    
    // Determine display text for each element of the array
    $each(arr,function(i,el)  {
      var name;
      
      // If it's a simple string
      if(typeof el === "string") name = el;
      // Object
      else if(el.title && used[el.title]<=1) name = el.title;
      else if(el.format && used[el.format]<=1) name = el.format;
      else if(el.type && used[el.type]<=1) name = el.type;
      else if(el.description && used[el.description]<=1) name = el.descripton;
      else if(el.title) name = el.title;
      else if(el.format) name = el.format;
      else if(el.type) name = el.type;
      else if(el.description) name = el.description;
      else if(JSON.stringify(el).length < 50) name = JSON.stringify(el);
      else name = "type";
      
      disp.push(name);
    });
    
    // Replace identical display text with "text 1", "text 2", etc.
    var inc = {};
    $each(disp,function(i,name) {
      inc[name] = inc[name] || 0;
      inc[name]++;
      
      if(used[name] > 1) disp[i] = name + " " + inc[name];
    });
    
    return disp;
  },
  showValidationErrors: function(errors) {

  }
});

JSONEditor.defaults.editors.string = JSONEditor.AbstractEditor.extend({
  setValueImpl: function(value) {
    if (this.template) {
      return;
    }
    this.mySetValue(value, false);
  },
  mySetValue: function(value) {
    var self = this;
    
    if(value === null) value = "";
    else if(typeof value === "object") value = JSON.stringify(value);
    else if(typeof value !== "string") value = ""+value;
    
    // Sanitize value before setting it
    var sanitized = this.sanitize(value);

    if(this.input.value === sanitized) {
      return;
    }

    this.input.value = sanitized;
    
    this.refreshValue();
    
    if(this.initial) this.is_dirty = false;
    else if(this.jsoneditor.options.show_errors === "change") this.is_dirty = true;
    this.initial = false;

    this.onChange();
  },
  buildImpl: function() {
    var self = this, i;
    
    this.initial = true;
    
    if(!this.options.compact) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    this.format = this.schema.format;
    if(!this.format && this.schema.media && this.schema.media.type) {
      this.format = this.schema.media.type.replace(/(^(application|text)\/(x-)?(script\.)?)|(-source$)/g,'');
    }
    if(!this.format && this.options.default_format) {
      this.format = this.options.default_format;
    }
    if(this.options.format) {
      this.format = this.options.format;
    }

    // Specific format
    if(this.format) {
      // Text Area
      if(this.format === 'textarea') {
        this.input_type = 'textarea';
        this.input = this.theme.getTextareaInput();
      }
      // Range Input
      else if(this.format === 'range') {
        this.input_type = 'range';
        var min = this.schema.minimum || 0;
        var max = this.schema.maximum || Math.max(100,min+1);
        var step = 1;
        if(this.schema.multipleOf) {
          if(min%this.schema.multipleOf) min = Math.ceil(min/this.schema.multipleOf)*this.schema.multipleOf;
          if(max%this.schema.multipleOf) max = Math.floor(max/this.schema.multipleOf)*this.schema.multipleOf;
          step = this.schema.multipleOf;
        }

        this.input = this.theme.getRangeInput(min,max,step);
      }
      // HTML5 Input type
      else {
        this.input_type = this.format;
        this.input = this.theme.getFormInputField(this.input_type);
      }
    }
    // Normal text input
    else {
      this.input_type = 'text';
      this.input = this.theme.getFormInputField(this.input_type);
    }
    
    this.input.setAttribute('name',this.formname);
    
    // minLength, maxLength, and pattern
    if(typeof this.schema.maxLength !== "undefined") this.input.setAttribute('maxlength',this.schema.maxLength);
    if(typeof this.schema.pattern !== "undefined") this.input.setAttribute('pattern',this.schema.pattern);
    else if(typeof this.schema.minLength !== "undefined") this.input.setAttribute('pattern','.{'+this.schema.minLength+',}');

    if(this.options.compact) this.container.setAttribute('class',this.container.getAttribute('class')+' compact');

    if(this.schema.readOnly || this.schema.readonly || this.schema.template) {
      this.always_disabled = true;
      this.input.disabled = true;
    }

    this.input
      .addEventListener('change',function(e) {        
        e.preventDefault();
        e.stopPropagation();
        
        // Don't allow changing if this field is a template
        if(self.schema.template) {
          this.value = self.value;
          return;
        }

        var val = this.value;
        
        // sanitize value
        var sanitized = self.sanitize(val);
        if(val !== sanitized) {
          this.value = sanitized;
        }
        
        self.withProcessingContext(function() {
          self.is_dirty = true;
          self.refreshValue();
          self.onChange();
        }, 'input_change');
      });

    this.control = this.theme.getFormControl(this.label, this.input, this.description);
    this.container.appendChild(this.control);

    // Any special formatting that needs to happen after the input is added to the dom
    window.requestAnimationFrame(function() {
      // Skip in case the input is only a temporary editor,
      // otherwise, in the case of an ace_editor creation,
      // it will generate an error trying to append it to the missing parentNode
      if(self.input.parentNode) self.afterInputReady();
    });

    // Compile and store the template
    if(this.schema.template) {
      this.template = this.jsoneditor.compileTemplate(this.schema.template, this.template_engine);
    }
    
    this.refreshValue();
  },
  enable: function() {
    if(!this.always_disabled) {
      this.input.disabled = false;
    }
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    this._super();
  },
  afterInputReady: function() {
    var self = this;
    self.theme.afterInputReady(self.input);
  },
  refreshValue: function() {
    this.value = this.input.value;
    if(typeof this.value !== "string") this.value = '';
  },
  destroy: function() {
    this.template = null;
    if(this.input && this.input.parentNode) this.input.parentNode.removeChild(this.input);
    if(this.label && this.label.parentNode) this.label.parentNode.removeChild(this.label);
    if(this.description && this.description.parentNode) this.description.parentNode.removeChild(this.description);

    this._super();
  },
  /**
   * This is overridden in derivative editors
   */
  sanitize: function(value) {
    return value;
  },
  /**
   * Re-calculates the value if needed
   */
  onWatchedFieldChange: function() {    
    var self = this, vars, j;
    
    // If this editor needs to be rendered by a macro template
    if(this.template) {
      vars = this.getWatchedFieldValues();
      this.mySetValue(this.template(vars), false);
    }
    
    this._super();
  },
  showValidationErrors: function(errors) {
    var self = this;
    
    if(this.jsoneditor.options.show_errors === "always") {}
    else if(!this.is_dirty) return;
    
    

    var messages = [];
    $each(errors,function(i,error) {
      if(error.path === self.path) {
        messages.push(error.message);
      }
    });

    if(messages.length) {
      this.theme.addInputError(this.input, messages.join('. ')+'.');
    }
    else {
      this.theme.removeInputError(this.input);
    }
  }
});

JSONEditor.defaults.editors.number = JSONEditor.defaults.editors.string.extend({
  sanitize: function(value) {
    return (value+"").replace(/[^0-9\.\-eE]/g,'');
  },
  getValue: function() {
    return this.value*1;
  }
});

JSONEditor.defaults.editors.integer = JSONEditor.defaults.editors.number.extend({
  sanitize: function(value) {
    value = value + "";
    return value.replace(/[^0-9\-]/g,'');
  }
});

JSONEditor.defaults.editors.object = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return $extend({},this.schema.default || {});
  },
  enable: function() {
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) continue;
        this.editors[i].enable();
      }
    }
  },
  disable: function() {
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) continue;
        this.editors[i].disable();
      }
    }
  },
  layoutEditors: function() {
    var self = this, i, j;
    
    if(!this.row_container) return;

    var container = document.createElement('div');
    $each(this.computeOrder(), function(i,key) {
      var editor = self.editors[key];
      var row = self.theme.getGridRow();
      container.appendChild(row);
      
      if(editor.options.hidden) editor.container.style.display = 'none';
      else self.theme.setGridColumnSize(editor.container,12);
      editor.container.className += ' container-' + key;
      row.appendChild(editor.container);
    });
    
    this.row_container.innerHTML = '';
    this.row_container.appendChild(container);
  },
  buildImpl: function() {
    this.editors = {};
    var self = this;

    this.schema_properties = this.schema.properties || {};

    // If the object should be rendered as a table row
    if(this.options.table_row) {
      this.editor_holder = this.container;
    }
    // If the object should be rendered as a div
    else {
      this.defaultProperties = this.schema.defaultProperties || Object.keys(this.schema_properties);

      this.header = document.createElement('span');
      this.header.textContent = this.getTitle();
      this.title = this.theme.getHeader(this.header);
      if (this.options.no_header) {
        this.title.style.display = 'none';
      }
      this.container.appendChild(this.title);
      this.container.style.position = 'relative';
      
      // Description
      if(this.schema.description) {
        this.description = this.theme.getDescription(this.schema.description);
        this.container.appendChild(this.description);
      }
      
      // Validation error placeholder area
      this.error_holder = document.createElement('div');
      this.container.appendChild(this.error_holder);
      
      // Container for child editor area
      this.editor_holder = this.theme.getIndentedPanel();
      this.editor_holder.style.paddingBottom = '0';
      this.container.appendChild(this.editor_holder);

      // Container for rows of child editors
      this.row_container = this.theme.getGridContainer();
      this.editor_holder.appendChild(this.row_container);

      // Control buttons
      this.title_controls = this.theme.getHeaderButtonHolder();
      this.title.appendChild(this.title_controls);

      // Show/Hide button
      this.collapsed = false;
      this.toggle_button = this.getButton('','collapse','Collapse');
      this.title_controls.appendChild(this.toggle_button);
      this.toggle_button.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        if(self.collapsed) {
          self.editor_holder.style.display = '';
          self.collapsed = false;
          self.setButtonText(self.toggle_button,'','collapse','Collapse');
        }
        else {
          self.editor_holder.style.display = 'none';
          self.collapsed = true;
          self.setButtonText(self.toggle_button,'','expand','Expand');
        }
      });

      // If it should start collapsed
      if(this.options.collapsed) {
        $trigger(this.toggle_button,'click');
      }
      
      // Collapse button disabled
      if(this.schema.options && typeof this.schema.options.disable_collapse !== "undefined") {
        if(this.schema.options.disable_collapse) this.toggle_button.style.display = 'none';
      }
      else if(this.jsoneditor.options.disable_collapse) {
        this.toggle_button.style.display = 'none';
      }
    }
    
    // Set the initial value, creating editors.
    this.mySetValue({}, true);

    // Fix table cell ordering
    if(this.options.table_row) {
      $each(this.computeOrder(), function(i,key) {
        self.editor_holder.appendChild(self.editors[key].container);
      });
    }
    // Layout object editors in grid if needed
    else {
      // Do the layout again now that we know the approximate heights of elements
      this.layoutEditors();
    }
  },
  addObjectProperty: function(name) {
    var self = this;
    
    // Property is already added
    if(this.editors[name]) return;
    
    var holder;
    var extra_opts = {};
    if (self.options.table_row) {
      holder = self.theme.getTableCell();
      extra_opts.compact = true;
      extra_opts.required = true;
    } else {
      holder = self.theme.getChildEditorHolder();
    }
    
    var schema = self.schema_properties[name];
    var editor = self.jsoneditor.getEditorClass(schema);
    self.editor_holder.appendChild(holder);
    self.editors[name] = self.jsoneditor.createEditor(editor, $extendPersistent({
      jsoneditor: self.jsoneditor,
      schema: schema,
      path: self.path+'.'+name,
      parent: self,
      container: holder
    }, extra_opts));
    self.editors[name].build();
    
    if (self.options.table_row) {
      if (self.editors[name].options.hidden) {
        holder.style.display = 'none';
      }
    }
  },
  onChildEditorChange: function(editor) {
    this.refreshValue();
    this.onChange();
  },
  destroy: function() {
    $each(this.editors, function(i,el) {
      el.destroy();
    });
    if(this.editor_holder) this.editor_holder.innerHTML = '';
    if(this.title && this.title.parentNode) this.title.parentNode.removeChild(this.title);
    if(this.error_holder && this.error_holder.parentNode) this.error_holder.parentNode.removeChild(this.error_holder);

    this.editors = null;
    if(this.editor_holder && this.editor_holder.parentNode) this.editor_holder.parentNode.removeChild(this.editor_holder);
    this.editor_holder = null;

    this._super();
  },
  getFinalValue: function() {
    var result = {};
    for (var i in this.editors) {
      if (!this.editors.hasOwnProperty(i)) {
        continue;
      }
      if (!this.editors[i].schema.excludeFromFinalValue) {
        result[i] = this.editors[i].getFinalValue();
      }
    }
    return result;
  },
  refreshValue: function() {
    this.value = {};
    var self = this;
    
    for(var i in this.editors) {
      if(!this.editors.hasOwnProperty(i)) continue;
      this.value[i] = this.editors[i].getValue();
    }
  },
  setValueImpl: function(value) {
    this.mySetValue(value, false);
  },
  mySetValue: function(value, initial) {
    var self = this;
    value = value || {};
    
    if(typeof value !== "object" || Array.isArray(value)) value = {};
    
    // Collect set-actions here so we can sort them.
    var setActions = [];

    // First, set the values for all of the defined properties
    $each(this.editors, function(i,editor) {
      // Value explicitly set
      if(typeof value[i] !== "undefined") {
        setActions.push({name: i, value: value[i]});
      }
      // Otherwise, set the value to the default
      else {
        setActions.push({name: i});
      }
    });

    // For the initial value, we need to make sure we actually have the editors.
    if (initial) {
      $each(self.schema_properties, function(i, schema) {
        if (!self.editors.hasOwnProperty(i)) {
          setActions.push({name: i});
        }
      });
    }
    
    // Add processingOrder to set-actions.
    $each(setActions, function(ind,action) {
      var i = action.name;
      action.processingOrder = 0;
      if (self.schema_properties && self.schema_properties[i] && typeof self.schema_properties[i].processingOrder !== "undefined") {
        action.processingOrder = self.schema_properties[i].processingOrder;
      }
    });
    
    // Sort the set-actions.
    setActions.sort(function(x,y) { return (x.processingOrder > y.processingOrder) - (x.processingOrder < y.processingOrder); });
    
    // Execute the set-actions.
    $each(setActions, function(ind, action) {
      var i = action.name;
      self.addObjectProperty(i);
      var set_value = action.hasOwnProperty('value') ? action.value : self.editors[i].getDefault();
      self.editors[i].setValue(set_value);
    });
    
    this.refreshValue();
    this.layoutEditors();
    this.onChange();
  },
  showValidationErrors: function(errors) {
    var self = this;

    // Get all the errors that pertain to this editor
    var my_errors = [];
    var other_errors = [];
    $each(errors, function(i,error) {
      if(error.path === self.path) {
        my_errors.push(error);
      }
      else {
        other_errors.push(error);
      }
    });

    // Show errors for this editor
    if(this.error_holder) {
      if(my_errors.length) {
        var message = [];
        this.error_holder.innerHTML = '';
        this.error_holder.style.display = '';
        $each(my_errors, function(i,error) {
          self.error_holder.appendChild(self.theme.getErrorMessage(error.message));
        });
      }
      // Hide error area
      else {
        this.error_holder.style.display = 'none';
      }
    }

    // Show error for the table row if this is inside a table
    if(this.options.table_row) {
      if(my_errors.length) {
        this.theme.addTableRowError(this.container);
      }
      else {
        this.theme.removeTableRowError(this.container);
      }
    }

    // Show errors for child editors
    $each(this.editors, function(i,editor) {
      editor.showValidationErrors(other_errors);
    });
  },
  computeOrder: function() {
    var self = this;
    var property_order = Object.keys(self.editors);
    property_order = property_order.sort(function(a,b) {
      var ordera = self.editors[a].schema.propertyOrder;
      var orderb = self.editors[b].schema.propertyOrder;
      if(typeof ordera !== "number") ordera = 1000;
      if(typeof orderb !== "number") orderb = 1000;
      return ordera - orderb;
    });
    return property_order;
  }
});

JSONEditor.defaults.editors.array = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || [];
  },
  enable: function() {
    if(this.add_row_button) this.add_row_button.disabled = false;
    if(this.remove_all_rows_button) this.remove_all_rows_button.disabled = false;
    
    if(this.rows) {
      for(var i=0; i<this.rows.length; i++) {
        this.rows[i].enable();
        
        if(this.rows[i].moveup_button) this.rows[i].moveup_button.disabled = false;
        if(this.rows[i].movedown_button) this.rows[i].movedown_button.disabled = false;
        if(this.rows[i].delete_button) this.rows[i].delete_button.disabled = false;
      }
    }
    this._super();
  },
  disable: function() {
    if(this.add_row_button) this.add_row_button.disabled = true;
    if(this.remove_all_rows_button) this.remove_all_rows_button.disabled = true;

    if(this.rows) {
      for(var i=0; i<this.rows.length; i++) {
        this.rows[i].disable();
        
        if(this.rows[i].moveup_button) this.rows[i].moveup_button.disabled = true;
        if(this.rows[i].movedown_button) this.rows[i].movedown_button.disabled = true;
        if(this.rows[i].delete_button) this.rows[i].delete_button.disabled = true;
      }
    }
    this._super();
  },
  arrayBaseBuildImpl: function() {
    this.rows = [];
    this.force_refresh = true;

    this.hide_delete_buttons = this.options.disable_array_delete || this.jsoneditor.options.disable_array_delete;
    this.hide_move_buttons = this.options.disable_array_reorder || this.jsoneditor.options.disable_array_reorder;
    this.hide_add_button = this.options.disable_array_add || this.jsoneditor.options.disable_array_add;
  },
  buildImpl: function() {
    var self = this;
    
    self.arrayBaseBuildImpl();
    
    if(!this.options.compact) {
      this.header = document.createElement('span');
      this.header.textContent = this.getTitle();
      this.title = this.theme.getHeader(this.header);
      this.container.appendChild(this.title);
      this.title_controls = this.theme.getHeaderButtonHolder();
      this.title.appendChild(this.title_controls);
      if(this.schema.description) {
        this.description = this.theme.getDescription(this.schema.description);
        this.container.appendChild(this.description);
      }
      this.error_holder = document.createElement('div');
      this.container.appendChild(this.error_holder);

      this.panel = this.theme.getIndentedPanel();
      this.container.appendChild(this.panel);
      this.row_holder = document.createElement('div');
      this.panel.appendChild(this.row_holder);
      this.controls = this.theme.getButtonHolder();
      this.panel.appendChild(this.controls);
    }
    else {
        this.panel = this.theme.getIndentedPanel();
        this.container.appendChild(this.panel);
        this.controls = this.theme.getButtonHolder();
        this.panel.appendChild(this.controls);
        this.row_holder = document.createElement('div');
        this.panel.appendChild(this.row_holder);
    }

    // Add controls
    this.addControls();
    
    // Set initial value.
    this.setValueImpl([]);
  },
  onChildEditorChange: function(editor) {
    this.refreshValue();
    this.onChange();
  },
  getItemTitle: function() {
    if(!this.item_title) {
      this.item_title = this.schema.items.title || 'item';
    }
    return this.item_title;
  },
  getElementEditor: function(i) {
    var schema = $extendPersistent(this.schema.items, {
      title: this.getItemTitle() + ' ' + (i + 1)
    });

    var editor = this.jsoneditor.getEditorClass(schema);

    var holder;
    if(schema.properties || schema.items) {
      holder = this.theme.getChildEditorHolder();
    }
    else {
      holder = this.theme.getIndentedPanel();
    }

    this.row_holder.appendChild(holder);

    var ret = this.jsoneditor.createEditor(editor,{
      jsoneditor: this.jsoneditor,
      schema: schema,
      container: holder,
      path: this.path+'.'+i,
      parent: this,
      required: true
    });
    ret.build();

    if(!ret.title_controls) {
      ret.array_controls = this.theme.getButtonHolder();
      holder.appendChild(ret.array_controls);
    }
    
    return ret;
  },
  destroy: function() {
    this.empty(true);
    if(this.title && this.title.parentNode) this.title.parentNode.removeChild(this.title);
    if(this.description && this.description.parentNode) this.description.parentNode.removeChild(this.description);
    if(this.row_holder && this.row_holder.parentNode) this.row_holder.parentNode.removeChild(this.row_holder);
    if(this.controls && this.controls.parentNode) this.controls.parentNode.removeChild(this.controls);
    if(this.panel && this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
    
    this.rows = this.title = this.description = this.row_holder = this.panel = this.controls = null;

    this._super();
  },
  empty: function() {
    if(!this.rows) return;
    var self = this;
    $each(this.rows,function(i,row) {
      self.destroyRow(row);
      self.rows[i] = null;
    });
    self.rows = [];
  },
  destroyRow: function(row) {
    var holder = row.container;
    row.destroy();
    if(holder.parentNode) holder.parentNode.removeChild(holder);
  },
  setValueImpl: function(value) {
    // Update the array's value, adding/removing rows when necessary
    value = value || [];
    
    if(!(Array.isArray(value))) value = [value];
    
    var self = this;
    $each(value,function(i,val) {
      if (self.rows[i]) {
        self.rows[i].setValue(val);
      } else {
        self.addRow(val);
      }
    });

    for(var j=value.length; j<self.rows.length; j++) {
      self.destroyRow(self.rows[j]);
      self.rows[j] = null;
    }
    self.rows = self.rows.slice(0,value.length);

    self.refreshValue();

    self.onChange();
    
    // TODO: sortable
  },
  getFinalValue: function() {
    var result = [];
    $each(this.rows,function(i,editor) {
      result[i] = editor.getFinalValue();
    });
    return result;
  },
  refreshValue: function() {
    var self = this;
    var oldi = this.value? this.value.length : 0;
    this.value = [];
    
    var force = self.force_refresh;
    self.force_refresh = false;

    $each(this.rows,function(i,editor) {
      // Get the value for this editor
      self.value[i] = editor.getValue();
    });
    
    if(oldi !== this.value.length || force) {
      self.refreshButtons();
    }
  },
  refreshButtons: function() {
    var self = this;
    
    var need_row_buttons = false;
    $each(this.rows,function(i,editor) {
      // Hide the move down button for the last row
      if(editor.movedown_button) {
        if(i === self.rows.length - 1) {
          editor.movedown_button.style.display = 'none';
        }
        else {
          need_row_buttons = true;
          editor.movedown_button.style.display = '';
        }
      }

      if(editor.delete_button) {
        need_row_buttons = true;
        editor.delete_button.style.display = '';
      }
      
      if (self.refreshButtonsExtraEditor(i, editor)) {
        need_row_buttons = true;
      }
    });
    
    var controls_needed = false;
    
    if (this.rows.length === 0 || this.hide_delete_buttons) {
      this.remove_all_rows_button.style.display = 'none';
    } else {
      this.remove_all_rows_button.style.display = '';
      controls_needed = true;
    }

    this.add_row_button.style.display = '';
    controls_needed = true;
    
    self.refreshButtonsExtra(need_row_buttons, controls_needed);
  },
  refreshButtonsExtraEditor: function(i, editor) {
    return false;
  },
  refreshButtonsExtra: function(need_row_buttons, controls_needed) {
    if(!this.collapsed && controls_needed) {
      this.controls.style.display = 'inline-block';
    }
    else {
      this.controls.style.display = 'none';
    }
  },
  addRow: function(value) {
    this.addRowBase(value, true, function(row) { return row.title_controls || row.array_controls; });
  },
  addRowBase: function(value, titled_delete, controls_holder_func) {
    var self = this;
    var i = this.rows.length;
    
    self.rows[i] = this.getElementEditor(i);

    var controls_holder = controls_holder_func(self.rows[i]);
    
    // Buttons to delete row, move row up, and move row down
    if(!self.hide_delete_buttons) {
      var delete_title1 = titled_delete ? self.getItemTitle() : '';
      var delete_title2 = 'Delete' + (titled_delete ? (' ' + self.getItemTitle()) : '');
      self.rows[i].delete_button = this.getButton(delete_title1,'delete',delete_title2);
      self.rows[i].delete_button.className += ' delete';
      self.rows[i].delete_button.setAttribute('data-i',i);
      self.rows[i].delete_button.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        var i = this.getAttribute('data-i')*1;

        var value = self.getValue();

        var newval = [];
        $each(value,function(j,row) {
          if(j===i) {
            return; // If this is the one we're deleting
          }
          newval.push(row);
        });
        
        self.withProcessingContext(function() {
          self.setValueImpl(newval);
        }, 'delete_button_click');
      });
      
      if(controls_holder) {
        controls_holder.appendChild(self.rows[i].delete_button);
      }
    }
    
    if(i && !self.hide_move_buttons) {
      self.rows[i].moveup_button = this.getButton('','moveup','Move up');
      self.rows[i].moveup_button.className += ' moveup';
      self.rows[i].moveup_button.setAttribute('data-i',i);
      self.rows[i].moveup_button.addEventListener('click',function(e) {
        self.moveClickHandler(e, this, false);
      });
      
      if(controls_holder) {
        controls_holder.appendChild(self.rows[i].moveup_button);
      }
    }
    
    if(!self.hide_move_buttons) {
      self.rows[i].movedown_button = this.getButton('','movedown','Move down');
      self.rows[i].movedown_button.className += ' movedown';
      self.rows[i].movedown_button.setAttribute('data-i',i);
      self.rows[i].movedown_button.addEventListener('click',function(e) {
        self.moveClickHandler(e, this, true);
      });
      
      if(controls_holder) {
        controls_holder.appendChild(self.rows[i].movedown_button);
      }
    }

    if(value) self.rows[i].setValue(value);
  },
  moveClickHandler: function(e, button, down) {
    var self = this;
    
    e.preventDefault();
    e.stopPropagation();
    var i = button.getAttribute('data-i')*1;
    if (down) {
      i++;
    }

    if(i<=0) return;
    var rows = self.getValue();
    var tmp = rows[i-1];
    rows[i-1] = rows[i];
    rows[i] = tmp;

    self.withProcessingContext(function() {
      self.setValueImpl(rows);
    }, 'move_button_click');
  },
  addRowButtons: function() {
  },
  addControls: function() {
    var self = this;
    
    this.collapsed = false;
    if (this.title_controls) {
      this.toggle_button = this.getButton('','collapse','Collapse');
      this.title_controls.appendChild(this.toggle_button);
      this.toggleSetup();
      this.toggle_button.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if(self.collapsed) {
          self.collapsed = false;
          if(self.panel) self.panel.style.display = '';
          self.toggleHandlerExtra(true);
          self.setButtonText(this,'','collapse','Collapse');
        }
        else {
          self.collapsed = true;
          self.toggleHandlerExtra(false);
          if(self.panel) self.panel.style.display = 'none';
          self.setButtonText(this,'','expand','Expand');
        }
      });

      // If it should start collapsed
      if(this.options.collapsed) {
        $trigger(this.toggle_button,'click');
      }
      
      // Collapse button disabled
      if(this.schema.options && typeof this.schema.options.disable_collapse !== "undefined") {
        if(this.schema.options.disable_collapse) this.toggle_button.style.display = 'none';
      }
      else if(this.jsoneditor.options.disable_collapse) {
        this.toggle_button.style.display = 'none';
      }
    }
    
    this.add_row_button = this.getButton(this.getItemTitle(),'add','Add '+this.getItemTitle());
    this.add_row_button.addEventListener('click',function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.withProcessingContext(function() {
        self.addRowButtonHandler();
      }, 'add_row_button_click');
    });
    self.controls.appendChild(this.add_row_button);

    this.remove_all_rows_button = this.getButton('All','delete','Delete All');
    this.remove_all_rows_button.addEventListener('click',function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      self.withProcessingContext(function() {
        self.setValueImpl([]);
      }, 'delete_all_rows_button_click');
    });
    self.controls.appendChild(this.remove_all_rows_button);
  },
  showValidationErrors: function(errors) {
    var self = this;

    // Get all the errors that pertain to this editor
    var my_errors = [];
    var other_errors = [];
    $each(errors, function(i,error) {
      if(error.path === self.path) {
        my_errors.push(error);
      }
      else {
        other_errors.push(error);
      }
    });

    // Show errors for this editor
    if(this.error_holder) {
      if(my_errors.length) {
        var message = [];
        this.error_holder.innerHTML = '';
        this.error_holder.style.display = '';
        $each(my_errors, function(i,error) {
          self.error_holder.appendChild(self.theme.getErrorMessage(error.message));
        });
      }
      // Hide error area
      else {
        this.error_holder.style.display = 'none';
      }
    }

    // Show errors for child editors
    $each(this.rows, function(i,row) {
      row.showValidationErrors(other_errors);
    });
  },
  addRowButtonHandler: function() {
    var self = this;
    var i = self.rows.length;
    self.addRow();
    self.refreshValue();
    self.onChange();
  },
  toggleSetup: function() {
    var self = this;
    self.row_holder_display = self.row_holder.style.display;
    self.controls_display = self.controls.style.display;
  },
  toggleHandlerExtra: function(expanding) {
    var self = this;
    if (expanding) {
      self.row_holder.style.display = self.row_holder_display;
      self.controls.style.display = self.controls_display;
    } else {
      self.row_holder.style.display = 'none';
      self.controls.style.display = 'none';
    }
  }
});

JSONEditor.defaults.editors.table = JSONEditor.defaults.editors.array.extend({
  buildImpl: function() {
    var self = this;
    
    self.arrayBaseBuildImpl();
    
    var item_schema = this.schema.items || {};
    
    this.item_title = item_schema.title || 'row';
    this.item_default = item_schema.default || null;
    this.item_has_child_editors = item_schema.properties;
    this.initial = true;
    
    this.table = this.theme.getTable();
    this.container.appendChild(this.table);
    this.thead = this.theme.getTableHead();
    this.table.appendChild(this.thead);
    this.header_row = this.theme.getTableRow();
    this.thead.appendChild(this.header_row);
    this.row_holder = this.theme.getTableBody();
    this.table.appendChild(this.row_holder);

    if(!this.options.compact) {
      this.title = this.theme.getHeader(this.getTitle());
      this.container.appendChild(this.title);
      this.title_controls = this.theme.getHeaderButtonHolder();
      this.title.appendChild(this.title_controls);
      if(this.schema.description) {
        this.description = this.theme.getDescription(this.schema.description);
        this.container.appendChild(this.description);
      }
      this.panel = this.theme.getIndentedPanel();
      this.container.appendChild(this.panel);
      this.error_holder = document.createElement('div');
      this.panel.appendChild(this.error_holder);
    }
    else {
      this.panel = document.createElement('div');
      this.container.appendChild(this.panel);
    }

    this.panel.appendChild(this.table);
    this.controls = this.theme.getButtonHolder();
    this.panel.appendChild(this.controls);

    if(this.item_has_child_editors) {
      $each(item_schema.properties, function(prop_name, prop_schema) {
        var title = prop_schema.title ? prop_schema.title : prop_name;
        var th = self.theme.getTableHeaderCell(title);
        if (typeof prop_schema.options !== 'undefined' && prop_schema.options.hidden) {
          th.style.display = 'none';
        }
        self.header_row.appendChild(th);
      });
    }
    else {
      self.header_row.appendChild(self.theme.getTableHeaderCell(this.item_title));
    }

    this.row_holder.innerHTML = '';

    // Row Controls column
    this.controls_header_cell = self.theme.getTableHeaderCell(" ");
    self.header_row.appendChild(this.controls_header_cell);

    // Add controls
    this.addControls();
    
    // Set initial value.
    this.setValueImpl([]);
  },
  getItemDefault: function() {
    return $extend({},{default:this.item_default}).default;
  },
  getItemTitle: function() {
    return this.item_title;
  },
  getElementEditor: function(i) {
    var schema = this.schema.items;
    var editor = this.jsoneditor.getEditorClass(schema);
    var row = this.row_holder.appendChild(this.theme.getTableRow());
    var holder = row;
    if(!this.item_has_child_editors) {
      holder = this.theme.getTableCell();
      row.appendChild(holder);
    }

    var ret = this.jsoneditor.createEditor(editor,{
      jsoneditor: this.jsoneditor,
      schema: schema,
      container: holder,
      path: this.path+'.'+i,
      parent: this,
      compact: true,
      table_row: true
    });
    ret.build();
    
    ret.controls_cell = row.appendChild(this.theme.getTableCell());
    ret.row = row;
    ret.table_controls = this.theme.getButtonHolder();
    ret.controls_cell.appendChild(ret.table_controls);
    ret.table_controls.style.margin = 0;
    ret.table_controls.style.padding = 0;
    
    return ret;
  },
  destroy: function() {
    this.innerHTML = '';
    if(this.table && this.table.parentNode) this.table.parentNode.removeChild(this.table);
    this.table = null;
    
    this._super();
  },
  setValueImpl: function(value) {
    // Update the array's value, adding/removing rows when necessary
    value = value || [];

    var numrows_changed = false;

    var self = this;
    $each(value,function(i,val) {
      if(self.rows[i]) {
        self.rows[i].setValue(val);
      }
      else {
        self.addRow(val);
        numrows_changed = true;
      }
    });

    for(var j=value.length; j<self.rows.length; j++) {
      var holder = self.rows[j].container;
      if(!self.item_has_child_editors) {
        self.rows[j].row.parentNode.removeChild(self.rows[j].row);
      }
      self.rows[j].destroy();
      if(holder.parentNode) holder.parentNode.removeChild(holder);
      self.rows[j] = null;
      numrows_changed = true;
    }
    self.rows = self.rows.slice(0,value.length);

    self.refreshValue();
    if(numrows_changed || self.initial) self.refreshButtons();
    self.initial = false;

    self.onChange();
          
    // TODO: sortable
  },
  refreshButtonsExtraEditor: function(i, editor) {
    return !!editor.moveup_button;
  },
  refreshButtonsExtra: function(need_row_buttons, controls_needed) {
    // Show/hide controls column in table
    $each(this.rows,function(i,editor) {
      if(need_row_buttons) {
        editor.controls_cell.style.display = '';
      }
      else {
        editor.controls_cell.style.display = 'none';
      }
    });
    if(need_row_buttons) {
      this.controls_header_cell.style.display = '';
    }
    else {
      this.controls_header_cell.style.display = 'none';
    }
    
    this.table.style.display = this.value.length === 0 ? 'none' : '';
    this.controls.style.display = controls_needed ? '' : 'none';
  },
  refreshValue: function() {
    var self = this;
    this.value = [];

    $each(this.rows,function(i,editor) {
      // Get the value for this editor
      self.value[i] = editor.getValue();
    });
  },
  addRow: function(value) {
    this.addRowBase(value, false, function(row) { return row.table_controls; });
  },
  addRowButtonHandler: function() {
    var self = this;
    self.addRow();
    self.refreshValue();
    self.refreshButtons();
    self.onChange();
  },
  toggleSetup: function() {
  },
  toggleHandlerExtra: function(expanding) {
  }
});

// Multiple Editor (for when `type` is an array)
JSONEditor.defaults.editors.multiple = JSONEditor.AbstractEditor.extend({
  enable: function() {
    this.editor.enable();
    this.switcher.disabled = false;
    this._super();
  },
  disable: function() {
    this.editor.disable();
    this.switcher.disabled = true;
    this._super();
  },
  switchEditor: function(i) {
    var self = this;
    
    if (self.editor && self.type !== i) {
      self.editor.destroy();
      self.editor = null;
    }
    
    if (!self.editor) {
      self.buildChildEditor(i);
    }
    
    self.type = i;

    self.editor.setValue(self.value);
    
    self.editor.container.style.display = '';
    
    self.refreshValue();
    self.refreshHeaderText();
  },
  buildChildEditor: function(i) {
    var self = this;
    var type = this.types[i];
    var holder = self.theme.getChildEditorHolder();
    self.editor_holder.appendChild(holder);

    var schema_ext = [];
    if(typeof type === "string") {
      schema_ext.push({type: type});
    }
    else {
      schema_ext.push(type);

      // If we need to merge `required` arrays
      if(type.required && Array.isArray(type.required) && self.child_schema.required && Array.isArray(self.child_schema.required)) {
        schema_ext.push({required: self.child_schema.required.concat(type.required)});
      }
    }
    var schema = $extendPersistentArr(self.child_schema, schema_ext, 0);

    var editor_class = self.jsoneditor.getEditorClass(schema);

    self.editor = self.jsoneditor.createEditor(editor_class,{
      jsoneditor: self.jsoneditor,
      schema: schema,
      container: holder,
      path: self.path,
      parent: self,
      required: true
    });
    self.editor.build();
    
    if(self.editor.header) self.editor.header.style.display = 'none';
    
    self.editor.option = self.switcher_options[i];
    
    holder.addEventListener('change_header_text',function() {
      self.refreshHeaderText();
    });
  },
  buildImpl: function() {
    var self = this;

    this.types = [];
    this.type = 0;
    this.editor = null;
    this.validators = [];
    this.value = null;
    this.child_schema = $shallowCopy(this.schema);
    
    if(this.schema.oneOf) {
      this.oneOf = true;
      this.types = this.schema.oneOf;
      $each(this.types,function(i,oneof) {
        //self.types[i] = self.jsoneditor.expandSchema(oneof);
      });
      delete this.child_schema.oneOf;
    }
    else {
      if(!this.schema.type || this.schema.type === "any") {
        this.types = ['string','number','integer','boolean','object','array','null'];

        // If any of these primitive types are disallowed
        if(this.schema.disallow) {
          var disallow = this.schema.disallow;
          if(typeof disallow !== 'object' || !(Array.isArray(disallow))) {
            disallow = [disallow];
          }
          var allowed_types = [];
          $each(this.types,function(i,type) {
            if(disallow.indexOf(type) === -1) allowed_types.push(type);
          });
          this.types = allowed_types;
        }
      }
      else if(Array.isArray(this.schema.type)) {
        this.types = this.schema.type;
      }
      else {
        this.types = [this.schema.type];
      }
      delete this.child_schema.type;
    }

    this.display_text = this.getDisplayText(this.types);
    
    var container = this.container;

    this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    this.container.appendChild(this.header);

    this.switcher = this.theme.getSwitcher(this.display_text);
    container.appendChild(this.switcher);
    this.switcher.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      self.withProcessingContext(function() {
        self.switchEditor(self.display_text.indexOf(self.switcher.value));
        self.onChange();
      }, 'switcher_input');
    });
    this.switcher.style.marginBottom = 0;
    this.switcher.style.width = 'auto';
    this.switcher.style.display = 'inline-block';
    this.switcher.style.marginLeft = '5px';

    this.editor_holder = document.createElement('div');
    container.appendChild(this.editor_holder);

    this.switcher_options = this.theme.getSwitcherOptions(this.switcher);
    $each(this.types,function(i,type) {
      var schema_ext = [];
      if(typeof type === "string") {
        schema_ext.push({type: type});
      }
      else {
        schema_ext.push(type);
        
        // If we need to merge `required` arrays
        if(type.required && Array.isArray(type.required) && self.child_schema.required && Array.isArray(self.child_schema.required)) {
          schema_ext.push({required: self.child_schema.required.concat(type.required)});
        }
      }
      var schema = $extendPersistentArr(self.child_schema, schema_ext, 0);

      self.validators[i] = new JSONEditor.Validator(self.jsoneditor,schema);
    });
    
    this.switchEditor(0);
  },
  onChildEditorChange: function(editor) {
    this.refreshValue();
    this.refreshHeaderText();
    this.onChange();
  },
  refreshHeaderText: function() {
    var display_text = this.getDisplayText(this.types);
    $each(this.switcher_options, function(i,option) {
      option.textContent = display_text[i];
    });
  },
  refreshValue: function() {
    this.value = this.editor.getValue();
  },
  setValueImpl: function(val) {
    var self = this;
    
    // Determine type by getting the first one that validates
    var type = 0;
    $each(this.validators, function(i,validator) {
      if(!validator.validate(val).length) {
        type = i;
        return false;
      }
    });
    
    self.switcher.value = self.display_text[type];
    
    this.value = val;
    this.switchEditor(type);

    self.onChange();
  },
  destroy: function() {
    if (this.editor) {
      this.editor.destroy();
    }
    if(this.editor_holder && this.editor_holder.parentNode) this.editor_holder.parentNode.removeChild(this.editor_holder);
    if(this.switcher && this.switcher.parentNode) this.switcher.parentNode.removeChild(this.switcher);
    this._super();
  },
  showValidationErrors: function(errors) {
    var self = this;
    
    // oneOf error paths need to remove the oneOf[i] part before passing to child editor
    var new_errors = errors;
    if (this.oneOf) {
      var check = self.path+'.oneOf['+this.type+']';
      new_errors = [];
      $each(errors, function(j,error) {
        if(error.path.substr(0,check.length)===check) {
          var new_error = $extend({},error);
          new_error.path = self.path+new_error.path.substr(check.length);
          new_errors.push(new_error);
        }
      });
    }
    
    this.editor.showValidationErrors(new_errors);
  }
});

JSONEditor.defaults.editors.select = JSONEditor.AbstractEditor.extend({
  setValueImpl: function(value) {
    value = this.typecast(value||'');

    // Sanitize value before setting it
    var sanitized = value;
    if(this.enum_values.indexOf(sanitized) < 0) {
      sanitized = this.enum_values[0];
    }
    
    if(this.value === sanitized) {
      return;
    }

    this.input.value = this.enum_options[this.enum_values.indexOf(sanitized)];
    this.value = sanitized;
    
    this.onChange();
  },
  typecast: function(value) {
    if(this.schema.type === "boolean") {
      return !!value;
    }
    else if(this.schema.type === "number") {
      return 1*value;
    }
    else if(this.schema.type === "integer") {
      return Math.floor(value*1);
    }
    else {
      return ""+value;
    }
  },
  getValue: function() {
    return this.value;
  },
  buildImpl: function() {
    var self = this;
    this.input_type = 'select';
    this.enum_options = [];
    this.enum_values = [];
    this.enum_display = [];

    // Enum options enumerated
    if(this.schema.enum) {
      var display = this.schema.options && this.schema.options.enum_titles || [];
      
      $each(this.schema.enum,function(i,option) {
        self.enum_options[i] = ""+option;
        self.enum_display[i] = ""+(display[i] || option);
        self.enum_values[i] = self.typecast(option);
      });
    }
    // Boolean
    else if(this.schema.type === "boolean") {
      self.enum_display = ['true','false'];
      self.enum_options = ['1',''];
      self.enum_values = [true,false];
    }
    // Dynamic Enum
    else if(this.schema.enumSource) {
      this.enum_source_template = this.jsoneditor.compileTemplate(this.schema.enumSource.sourceTemplate, this.template_engine);
      this.enum_value_template = this.jsoneditor.compileTemplate(this.schema.enumSource.value, this.template_engine);
      this.enum_title_template = this.jsoneditor.compileTemplate(this.schema.enumSource.title, this.template_engine);
    }
    // Other, not supported
    else {
      throw "'select' editor requires the enum property to be set.";
    }
    
    if(!this.options.compact) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description);

    if(this.options.compact) this.container.setAttribute('class',this.container.getAttribute('class')+' compact');

    this.input = this.theme.getSelectInput(this.enum_options);
    this.theme.setSelectOptions(this.input,this.enum_options,this.enum_display);
    this.input.setAttribute('name',this.formname);

    if(this.schema.readOnly || this.schema.readonly) {
      this.always_disabled = true;
      this.input.disabled = true;
    }

    this.input.addEventListener('change',function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.onInputChange();
    });

    this.control = this.theme.getFormControl(this.label, this.input, this.description);
    this.container.appendChild(this.control);

    this.value = this.enum_values[0];
    
    this.theme.afterInputReady(this.input);
  },
  onInputChange: function() {
    var self = this;
    self.withProcessingContext(function() {
      var val = self.input.value;

      var sanitized = val;
      if(self.enum_options.indexOf(val) === -1) {
        sanitized = self.enum_options[0];
      }

      self.value = self.enum_values[self.enum_options.indexOf(val)];

      self.onChange();
    }, 'input_change');
  },
  onWatchedFieldChange: function() {
    // If this editor uses a dynamic select box
    if (this.enum_source_template) {
      var vars = this.getWatchedFieldValues();
      
      var items = this.enum_source_template(vars);
      
      var select_options = [];
      var select_titles = [];
      for (var j = 0; j < items.length; j++) {
        var item_vars = {watch_vars: vars, i: j, item: items[j]};
        select_options[j] = this.enum_value_template(item_vars);
        select_titles[j] = this.enum_title_template(item_vars);
      }
      
      var prev_value = this.value;
      
      this.theme.setSelectOptions(this.input, select_options, select_titles);
      this.enum_options = select_options;
      this.enum_display = select_titles;
      this.enum_values = select_options;
      
      // If the previous value is still in the new select options, stick with it
      if(select_options.indexOf(prev_value) !== -1) {
        this.input.value = prev_value;
        this.value = prev_value;
      }
      // Otherwise, set the value to the first select option
      else {
        this.input.value = select_options[0];
        this.value = select_options[0] || "";
        this.onChange();
      }
    }

    this._super();
  },
  enable: function() {
    if(!this.always_disabled) {
      this.input.disabled = false;
    }
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    this._super();
  },
  destroy: function() {
    if(this.label && this.label.parentNode) this.label.parentNode.removeChild(this.label);
    if(this.description && this.description.parentNode) this.description.parentNode.removeChild(this.description);
    if(this.input && this.input.parentNode) this.input.parentNode.removeChild(this.input);

    this._super();
  }
});

JSONEditor.defaults.editors.derived = JSONEditor.AbstractEditor.extend({
    buildImpl: function() {
        this.always_disabled = true;
        if (!this.schema.template && !this.schema.hasOwnProperty('constantValue')) {
            throw "'derived' editor requires the template or constantValue property to be set.";
        }
        if (this.schema.template) {
            this.derived_mode = 'template';
            this.template = this.jsoneditor.compileTemplate(this.schema.template, this.template_engine);
            this.myValue = null;
        } else {
            this.derived_mode = 'constant';
            this.myValue = this.schema.constantValue;
        }
    },
    destroy: function() {
        this.myValue = null;
        this.template = null;
        this._super();
    },
    getValue: function() {
        return this.myValue;
    },
    setValueImpl: function(val) {
    },
    onWatchedFieldChange: function() {
        if (this.derived_mode == 'template') {
            var vars = this.getWatchedFieldValues();
            this.myValue = this.template(vars);
            this.onChange();
        }
        this._super();
    }
});

JSONEditor.AbstractTheme = Class.extend({
  getContainer: function() {
    return document.createElement('div');
  },
  getFloatRightLinkHolder: function() {
    var el = document.createElement('div');
    el.style = el.style || {};
    el.style.cssFloat = 'right';
    el.style.marginLeft = '10px';
    return el;
  },
  getModal: function() {
    var el = document.createElement('div');
    el.style.backgroundColor = 'white';
    el.style.border = '1px solid black';
    el.style.boxShadow = '3px 3px black';
    el.style.position = 'absolute';
    el.style.zIndex = '10';
    el.style.display = 'none';
    return el;
  },
  getGridContainer: function() {
    var el = document.createElement('div');
    return el;
  },
  getGridRow: function() {
    var el = document.createElement('div');
    el.className = 'row';
    return el;
  },
  getGridColumn: function() {
    var el = document.createElement('div');
    return el;
  },
  setGridColumnSize: function(el,size) {
    
  },
  getLink: function(text) {
    var el = document.createElement('a');
    el.setAttribute('href','#');
    el.appendChild(document.createTextNode(text));
    return el;
  },
  disableHeader: function(header) {
    header.style.color = '#ccc';
  },
  disableLabel: function(label) {
    label.style.color = '#ccc';
  },
  enableHeader: function(header) {
    header.style.color = '';
  },
  enableLabel: function(label) {
    label.style.color = '';
  },
  getFormInputLabel: function(text) {
    var el = document.createElement('label');
    el.appendChild(document.createTextNode(text));
    return el;
  },
  getCheckboxLabel: function(text) {
    var el = this.getFormInputLabel(text);
    el.style.fontWeight = 'normal';
    return el;
  },
  getHeader: function(text) {
    var el = document.createElement('h3');
    if(typeof text === "string") {
      el.textContent = text;
    }
    else {
      el.appendChild(text);
    }
    
    return el;
  },
  getCheckbox: function() {
    var el = this.getFormInputField('checkbox');
    el.style.display = 'inline-block';
    el.style.width = 'auto';
    return el;
  },
  getMultiCheckboxHolder: function(controls,label,description) {
    var el = document.createElement('div');

    if(label) {
      label.style.display = 'block';
      el.appendChild(label);
    }

    for(var i in controls) {
      if(!controls.hasOwnProperty(i)) continue;
      controls[i].style.display = 'inline-block';
      controls[i].style.marginRight = '20px';
      el.appendChild(controls[i]);
    }

    if(description) el.appendChild(description);

    return el;
  },
  getSelectInput: function(options) {
    var select = document.createElement('select');
    if(options) this.setSelectOptions(select, options);
    return select;
  },
  getSwitcher: function(options) {
    var switcher = this.getSelectInput(options);
    switcher.style.backgroundColor = 'transparent';
    switcher.style.height = 'auto';
    switcher.style.fontStyle = 'italic';
    switcher.style.fontWeight = 'normal';
    switcher.style.padding = '0 0 0 3px';
    return switcher;
  },
  getSwitcherOptions: function(switcher) {
    return switcher.getElementsByTagName('option');
  },
  setSwitcherOptions: function(switcher, options, titles) {
    this.setSelectOptions(switcher, options, titles);
  },
  setSelectOptions: function(select, options, titles) {
    titles = titles || [];
    select.innerHTML = '';
    for(var i=0; i<options.length; i++) {
      var option = document.createElement('option');
      option.setAttribute('value',options[i]);
      option.textContent = titles[i] || options[i];
      select.appendChild(option);
    }
  },
  getTextareaInput: function() {
    var el = document.createElement('textarea');
    el.style = el.style || {};
    el.style.width = '100%';
    el.style.height = '300px';
    el.style.boxSizing = 'border-box';
    return el;
  },
  getRangeInput: function(min,max,step) {
    var el = this.getFormInputField('range');
    el.setAttribute('min',min);
    el.setAttribute('max',max);
    el.setAttribute('step',step);
    return el;
  },
  getFormInputField: function(type) {
    var el = document.createElement('input');
    el.setAttribute('type',type);
    return el;
  },
  afterInputReady: function(input) {
    
  },
  getFormControl: function(label, input, description) {
    var el = document.createElement('div');
    el.className = 'form-control';
    if(label) el.appendChild(label);
    if(input.type === 'checkbox') {
      label.insertBefore(input,label.firstChild);
    }
    else {
      el.appendChild(input);
    }
    
    if(description) el.appendChild(description);
    return el;
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.style = el.style || {};
    el.style.paddingLeft = '10px';
    el.style.marginLeft = '10px';
    el.style.borderLeft = '1px solid #ccc';
    return el;
  },
  getChildEditorHolder: function() {
    return document.createElement('div');
  },
  getDescription: function(text) {
    var el = document.createElement('p');
    el.appendChild(document.createTextNode(text));
    return el;
  },
  getCheckboxDescription: function(text) {
    return this.getDescription(text);
  },
  getFormInputDescription: function(text) {
    return this.getDescription(text);
  },
  getHeaderButtonHolder: function() {
    return this.getButtonHolder();
  },
  getButtonHolder: function() {
    return document.createElement('div');
  },
  getButton: function(text, icon, title) {
    var el = document.createElement('button');
    this.setButtonText(el,text,icon,title);
    return el;
  },
  setButtonText: function(button, text, icon, title) {
    button.innerHTML = '';
    if(icon) {
      button.appendChild(icon);
      button.innerHTML += ' ';
    }
    button.appendChild(document.createTextNode(text));
    if(title) button.setAttribute('title',title);
  },
  getTable: function() {
    return document.createElement('table');
  },
  getTableRow: function() {
    return document.createElement('tr');
  },
  getTableHead: function() {
    return document.createElement('thead');
  },
  getTableBody: function() {
    return document.createElement('tbody');
  },
  getTableHeaderCell: function(text) {
    var el = document.createElement('th');
    el.textContent = text;
    return el;
  },
  getTableCell: function() {
    var el = document.createElement('td');
    return el;
  },
  getErrorMessage: function(text) {
    var el = document.createElement('p');
    el.style = el.style || {};
    el.style.color = 'red';
    el.appendChild(document.createTextNode(text));
    return el;
  },
  addInputError: function(input, text) {
  },
  removeInputError: function(input) {
  },
  addTableRowError: function(row) {
  },
  removeTableRowError: function(row) {
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.innerHTML = "<div style='float: left; width: 130px;' class='tabs'></div><div class='content' style='margin-left: 130px;'></div><div style='clear:both;'></div>";
    return el;
  },
  applyStyles: function(el,styles) {
    el.style = el.style || {};
    for(var i in styles) {
      if(!styles.hasOwnProperty(i)) continue;
      el.style[i] = styles[i];
    }
  },
  closest: function(elem, selector) {
    var matchesSelector = elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;

    while (elem && elem !== document) {
      try {
        var f = matchesSelector.bind(elem);
        if (f(selector)) {
          return elem;
        } else {
          elem = elem.parentNode;
        }
      }
      catch(e) {
        return false;
      }
    }
    return false;
  },
  getTab: function(span) {
    var el = document.createElement('div');
    el.appendChild(span);
    el.style = el.style || {};
    this.applyStyles(el,{
      border: '1px solid #ccc',
      borderWidth: '1px 0 1px 1px',
      textAlign: 'center',
      lineHeight: '30px',
      borderRadius: '5px',
      borderBottomRightRadius: 0,
      borderTopRightRadius: 0,
      fontWeight: 'bold',
      cursor: 'pointer'
    });
    return el;
  },
  getTabContentHolder: function(tab_holder) {
    return tab_holder.children[1];
  },
  getTabContent: function() {
    return this.getIndentedPanel();
  },
  markTabActive: function(tab) {
    this.applyStyles(tab,{
      opacity: 1,
      background: 'white'
    });
  },
  markTabInactive: function(tab) {
    this.applyStyles(tab,{
      opacity:0.5,
      background: ''
    });
  },
  addTab: function(holder, tab) {
    holder.children[0].appendChild(tab);
  },
  getBlockLink: function() {
    var link = document.createElement('a');
    link.style.display = 'block';
    return link;
  },
  getBlockLinkHolder: function() {
    var el = document.createElement('div');
    return el;
  },
  getLinksHolder: function() {
    var el = document.createElement('div');
    return el;
  },
  createMediaLink: function(holder,link,media) {
    holder.appendChild(link);
    media.style.width='100%';
    holder.appendChild(media);
  },
  createImageLink: function(holder,link,image) {
    holder.appendChild(link);
    link.appendChild(image);
  }
});

JSONEditor.defaults.themes.bootstrap2 = JSONEditor.AbstractTheme.extend({
  getRangeInput: function(min, max, step) {
    // TODO: use bootstrap slider
    return this._super(min, max, step);
  },
  getGridContainer: function() {
    var el = document.createElement('div');
    el.className = 'container-fluid';
    return el;
  },
  getGridRow: function() {
    var el = document.createElement('div');
    el.className = 'row-fluid';
    return el;
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.display = 'inline-block';
    el.style.fontWeight = 'bold';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = 'span'+size;
  },
  getSelectInput: function(options) {
    var input = this._super(options);
    input.style.width = 'auto';
    input.style.maxWidth = '98%';
    return input;
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    el.style.width = '98%';
    return el;
  },
  afterInputReady: function(input) {
    if(input.controlgroup) return;
    input.controlgroup = this.closest(input,'.control-group');
    input.controls = this.closest(input,'.controls');
    if(this.closest(input,'.compact')) {
      input.controlgroup.className = input.controlgroup.className.replace(/control-group/g,'').replace(/[ ]{2,}/g,' ');
      input.controls.className = input.controlgroup.className.replace(/controls/g,'').replace(/[ ]{2,}/g,' ');
      input.style.marginBottom = 0;
    }

    // TODO: use bootstrap slider
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'well well-small';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = document.createElement('p');
    el.className = 'help-inline';
    el.textContent = text;
    return el;
  },
  getFormControl: function(label, input, description) {
    var ret = document.createElement('div');
    ret.className = 'control-group';

    var controls = document.createElement('div');
    controls.className = 'controls';

    if(label && input.getAttribute('type') === 'checkbox') {
      ret.appendChild(controls);
      label.className += ' checkbox';
      label.appendChild(input);
      controls.appendChild(label);
      controls.style.height = '30px';
    }
    else {
      if(label) {
        label.className += ' control-label';
        ret.appendChild(label);
      }
      controls.appendChild(input);
      ret.appendChild(controls);
    }

    if(description) controls.appendChild(description);

    return ret;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.marginLeft = '10px';
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'btn-group';
    return el;
  },
  getButton: function(text, icon, title) {
    var el =  this._super(text, icon, title);
    el.className += ' btn btn-default';
    return el;
  },
  getTable: function() {
    var el = document.createElement('table');
    el.className = 'table table-bordered';
    el.style.width = 'auto';
    el.style.maxWidth = 'none';
    return el;
  },
  addInputError: function(input,text) {
    if(!input.controlgroup || !input.controls) return;
    input.controlgroup.className += ' error';
    if(!input.errmsg) {
      input.errmsg = document.createElement('p');
      input.errmsg.className = 'help-block errormsg';
      input.controls.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = '';
    }

    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
    if(!input.errmsg) return;
    input.errmsg.style.display = 'none';
    input.controlgroup.className = input.controlgroup.className.replace(/\s?error/g,'');
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.className = 'tabbable tabs-left';
    el.innerHTML = "<ul class='nav nav-tabs span2' style='margin-right: 0;'></ul><div class='tab-content span10' style='overflow:visible;'></div>";
    return el;
  },
  getTab: function(text) {
    var el = document.createElement('li');
    var a = document.createElement('a');
    a.setAttribute('href','#');
    a.appendChild(text);
    el.appendChild(a);
    return el;
  },
  getTabContentHolder: function(tab_holder) {
    return tab_holder.children[1];
  },
  getTabContent: function() {
    var el = document.createElement('div');
    el.className = 'tab-pane active';
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s?active/g,'');
  },
  addTab: function(holder, tab) {
    holder.children[0].appendChild(tab);
  },
  getProgressBar: function() {
    var container = document.createElement('div');
    container.className = 'progress';

    var bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = '0%';
    container.appendChild(bar);

    return container;
  },
  updateProgressBar: function(progressBar, progress) {
    if (!progressBar) return;

    progressBar.firstChild.style.width = progress + "%";
  },
  updateProgressBarUnknown: function(progressBar) {
    if (!progressBar) return;

    progressBar.className = 'progress progress-striped active';
    progressBar.firstChild.style.width = '100%';
  }
});

JSONEditor.defaults.themes.bootstrap3 = JSONEditor.AbstractTheme.extend({
  getSelectInput: function(options) {
    var el = this._super(options);
    el.className += 'form-control';
    //el.style.width = 'auto';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = 'col-md-'+size;
  },
  afterInputReady: function(input) {
    if(input.controlgroup) return;
    input.controlgroup = this.closest(input,'.form-group');
    if(this.closest(input,'.compact')) {
      input.controlgroup.style.marginBottom = 0;
    }

    // TODO: use bootstrap slider
  },
  getTextareaInput: function() {
    var el = document.createElement('textarea');
    el.className = 'form-control';
    return el;
  },
  getRangeInput: function(min, max, step) {
    // TODO: use better slider
    return this._super(min, max, step);
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    if(type !== 'checkbox') {
      el.className += 'form-control';
    }
    return el;
  },
  getFormControl: function(label, input, description) {
    var group = document.createElement('div');

    if(label && input.type === 'checkbox') {
      group.className += ' checkbox';
      label.appendChild(input);
      label.style.fontSize = '14px';
      group.style.marginTop = '0';
      group.appendChild(label);
      input.style.position = 'relative';
      input.style.cssFloat = 'left';
    } 
    else {
      group.className += ' form-group';
      if(label) {
        label.className += ' control-label';
        group.appendChild(label);
      }
      group.appendChild(input);
    }

    if(description) group.appendChild(description);

    return group;
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'well well-sm';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = document.createElement('p');
    el.className = 'help-block';
    el.textContent = text;
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.marginLeft = '10px';
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'btn-group';
    return el;
  },
  getButton: function(text, icon, title) {
    var el = this._super(text, icon, title);
    el.className += 'btn btn-default';
    return el;
  },
  getTable: function() {
    var el = document.createElement('table');
    el.className = 'table table-bordered';
    el.style.width = 'auto';
    el.style.maxWidth = 'none';
    return el;
  },

  addInputError: function(input,text) {
    if(!input.controlgroup) return;
    input.controlgroup.className += ' has-error';
    if(!input.errmsg) {
      input.errmsg = document.createElement('p');
      input.errmsg.className = 'help-block errormsg';
      input.controlgroup.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = '';
    }

    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
    if(!input.errmsg) return;
    input.errmsg.style.display = 'none';
    input.controlgroup.className = input.controlgroup.className.replace(/\s?has-error/g,'');
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.innerHTML = "<div class='tabs list-group col-md-2'></div><div class='col-md-10'></div>";
    el.className = 'rows';
    return el;
  },
  getTab: function(text) {
    var el = document.createElement('a');
    el.className = 'list-group-item';
    el.setAttribute('href','#');
    el.appendChild(text);
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s?active/g,'');
  },
  getProgressBar: function() {
    var min = 0, max = 100, start = 0;

    var container = document.createElement('div');
    container.className = 'progress';

    var bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', start);
    bar.setAttribute('aria-valuemin', min);
    bar.setAttribute('aria-valuenax', max);
    bar.innerHTML = start + "%";
    container.appendChild(bar);

    return container;
  },
  updateProgressBar: function(progressBar, progress) {
    if (!progressBar) return;

    var bar = progressBar.firstChild;
    var percentage = progress + "%";
    bar.setAttribute('aria-valuenow', progress);
    bar.style.width = percentage;
    bar.innerHTML = percentage;
  },
  updateProgressBarUnknown: function(progressBar) {
    if (!progressBar) return;

    var bar = progressBar.firstChild;
    progressBar.className = 'progress progress-striped active';
    bar.removeAttribute('aria-valuenow');
    bar.style.width = '100%';
    bar.innerHTML = '';
  }
});

// Base Foundation theme
JSONEditor.defaults.themes.foundation = JSONEditor.AbstractTheme.extend({
  getChildEditorHolder: function() {
    var el = document.createElement('div');
    el.style.marginBottom = '15px';
    return el;
  },
  getSelectInput: function(options) {
    var el = this._super(options);
    el.style.minWidth = 'none';
    el.style.padding = '5px';
    el.style.marginTop = '3px';
    return el;
  },
  getSwitcher: function(options) {
    var el = this._super(options);
    el.style.paddingRight = '8px';
    return el;
  },
  afterInputReady: function(input) {
    if(this.closest(input,'.compact')) {
      input.style.marginBottom = 0;
    }
    input.group = this.closest(input,'.form-control');
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.display = 'inline-block';
    return el;
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    el.style.width = '100%';
    el.style.marginBottom = type==='checkbox'? '0' : '12px';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = document.createElement('p');
    el.textContent = text;
    el.style.marginTop = '-10px';
    el.style.fontStyle = 'italic';
    return el;
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'panel';
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.display = 'inline-block';
    el.style.marginLeft = '10px';
    el.style.verticalAlign = 'middle';
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'button-group';
    return el;
  },
  getButton: function(text, icon, title) {
    var el = this._super(text, icon, title);
    el.className += ' small button';
    return el;
  },
  addInputError: function(input,text) {
    if(!input.group) return;
    input.group.className += ' error';
    
    if(!input.errmsg) {
      input.insertAdjacentHTML('afterend','<small class="error"></small>');
      input.errmsg = input.parentNode.getElementsByClassName('error')[0];
    }
    else {
      input.errmsg.style.display = '';
    }
    
    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
    if(!input.errmsg) return;
    input.group.className = input.group.className.replace(/ error/g,'');
    input.errmsg.style.display = 'none';
  },
  getProgressBar: function() {
    var progressBar = document.createElement('div');
    progressBar.className = 'progress';

    var meter = document.createElement('span');
    meter.className = 'meter';
    meter.style.width = '0%';
    progressBar.appendChild(meter);
    return progressBar;
  },
  updateProgressBar: function(progressBar, progress) {
    if (!progressBar) return;
    progressBar.firstChild.style.width = progress + '%';
  },
  updateProgressBarUnknown: function(progressBar) {
    if (!progressBar) return;
    progressBar.firstChild.style.width = '100%';
  }
});

// Foundation 3 Specific Theme
JSONEditor.defaults.themes.foundation3 = JSONEditor.defaults.themes.foundation.extend({
  getHeaderButtonHolder: function() {
    var el = this._super();
    el.style.fontSize = '.6em';
    return el;
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.fontWeight = 'bold';
    return el;
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.className = 'row';
    el.innerHTML = "<dl class='tabs vertical two columns'></dl><div class='tabs-content ten columns'></div>";
    return el;
  },
  setGridColumnSize: function(el,size) {
    var sizes = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
    el.className = 'columns '+sizes[size];
  },
  getTab: function(text) {
    var el = document.createElement('dd');
    var a = document.createElement('a');
    a.setAttribute('href','#');
    a.appendChild(text);
    el.appendChild(a);
    return el;
  },
  getTabContentHolder: function(tab_holder) {
    return tab_holder.children[1];
  },
  getTabContent: function() {
    var el = document.createElement('div');
    el.className = 'content active';
    el.style.paddingLeft = '5px';
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s*active/g,'');
  },
  addTab: function(holder, tab) {
    holder.children[0].appendChild(tab);
  }
});

// Foundation 4 Specific Theme
JSONEditor.defaults.themes.foundation4 = JSONEditor.defaults.themes.foundation.extend({
  getHeaderButtonHolder: function() {
    var el = this._super();
    el.style.fontSize = '.6em';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = 'columns large-'+size;
  },
  getFormInputDescription: function(text) {
    var el = this._super(text);
    el.style.fontSize = '.8rem';
    return el;
  },
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.fontWeight = 'bold';
    return el;
  }
});

// Foundation 5 Specific Theme
JSONEditor.defaults.themes.foundation5 = JSONEditor.defaults.themes.foundation.extend({
  getFormInputDescription: function(text) {
    var el = this._super(text);
    el.style.fontSize = '.8rem';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = 'columns medium-'+size;
  },
  getButton: function(text, icon, title) {
    var el = this._super(text,icon,title);
    el.className = el.className.replace(/\s*small/g,'') + ' tiny';
    return el;
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.innerHTML = "<dl class='tabs vertical'></dl><div class='tabs-content'></div>";
    return el;
  },
  getTab: function(text) {
    var el = document.createElement('dd');
    var a = document.createElement('a');
    a.setAttribute('href','#');
    a.appendChild(text);
    el.appendChild(a);
    return el;
  },
  getTabContentHolder: function(tab_holder) {
    return tab_holder.children[1];
  },
  getTabContent: function() {
    var el = document.createElement('div');
    el.className = 'content active';
    el.style.paddingLeft = '5px';
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s*active/g,'');
  },
  addTab: function(holder, tab) {
    holder.children[0].appendChild(tab);
  }
});

JSONEditor.defaults.themes.html = JSONEditor.AbstractTheme.extend({
  getFormInputLabel: function(text) {
    var el = this._super(text);
    el.style.display = 'block';
    el.style.marginBottom = '3px';
    el.style.fontWeight = 'bold';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = this._super(text);
    el.style.fontSize = '.8em';
    el.style.margin = 0;
    el.style.display = 'inline-block';
    el.style.fontStyle = 'italic';
    return el;
  },
  getIndentedPanel: function() {
    var el = this._super();
    el.style.border = '1px solid #ddd';
    el.style.padding = '5px';
    el.style.margin = '5px';
    el.style.borderRadius = '3px';
    return el;
  },
  getChildEditorHolder: function() {
    var el = this._super();
    el.style.marginBottom = '8px';
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.display = 'inline-block';
    el.style.marginLeft = '10px';
    el.style.fontSize = '.8em';
    el.style.verticalAlign = 'middle';
    return el;
  },
  getTable: function() {
    var el = this._super();
    el.style.borderBottom = '1px solid #ccc';
    el.style.marginBottom = '5px';
    return el;
  },
  addInputError: function(input, text) {
    input.style.borderColor = 'red';
    
    if(!input.errmsg) {
      var group = this.closest(input,'.form-control');
      input.errmsg = document.createElement('div');
      input.errmsg.setAttribute('class','errmsg');
      input.errmsg.style = input.errmsg.style || {};
      input.errmsg.style.color = 'red';
      group.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = 'block';
    }
    
    input.errmsg.innerHTML = '';
    input.errmsg.appendChild(document.createTextNode(text));
  },
  removeInputError: function(input) {
    input.style.borderColor = '';
    if(input.errmsg) input.errmsg.style.display = 'none';
  },
  getProgressBar: function() {
    var max = 100, start = 0;

    var progressBar = document.createElement('progress');
    progressBar.setAttribute('max', max);
    progressBar.setAttribute('value', start);
    return progressBar;
  },
  updateProgressBar: function(progressBar, progress) {
    if (!progressBar) return;
    progressBar.setAttribute('value', progress);
  },
  updateProgressBarUnknown: function(progressBar) {
    if (!progressBar) return;
    progressBar.removeAttribute('value');
  }
});

JSONEditor.defaults.themes.jqueryui = JSONEditor.AbstractTheme.extend({
  getTable: function() {
    var el = this._super();
    el.setAttribute('cellpadding',5);
    el.setAttribute('cellspacing',0);
    return el;
  },
  getTableHeaderCell: function(text) {
    var el = this._super(text);
    el.className = 'ui-state-active';
    el.style.fontWeight = 'bold';
    return el;
  },
  getTableCell: function() {
    var el = this._super();
    el.className = 'ui-widget-content';
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.marginLeft = '10px';
    el.style.fontSize = '.6em';
    el.style.display = 'inline-block';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = this.getDescription(text);
    el.style.marginLeft = '10px';
    el.style.display = 'inline-block';
    return el;
  },
  getFormControl: function(label, input, description) {
    var el = this._super(label,input,description);
    if(input.type === 'checkbox') {
      el.style.lineHeight = '25px';
      
      el.style.padding = '3px 0';
    }
    else {
      el.style.padding = '4px 0 8px 0';
    }
    return el;
  },
  getDescription: function(text) {
    var el = document.createElement('span');
    el.style.fontSize = '.8em';
    el.style.fontStyle = 'italic';
    el.textContent = text;
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'ui-buttonset';
    el.style.fontSize = '.7em';
    return el;
  },
  getFormInputLabel: function(text) {
    var el = document.createElement('label');
    el.style.fontWeight = 'bold';
    el.style.display = 'block';
    el.textContent = text;
    return el;
  },
  getButton: function(text, icon, title) {
    var button = document.createElement("button");
    button.className = 'ui-button ui-widget ui-state-default ui-corner-all';

    // Icon only
    if(icon && !text) {
      button.className += ' ui-button-icon-only';
      icon.className += ' ui-button-icon-primary ui-icon-primary';
      button.appendChild(icon);
    }
    // Icon and Text
    else if(icon) {
      button.className += ' ui-button-text-icon-primary';
      icon.className += ' ui-button-icon-primary ui-icon-primary';
      button.appendChild(icon);
    }
    // Text only
    else {
      button.className += ' ui-button-text-only';
    }

    var el = document.createElement('span');
    el.className = 'ui-button-text';
    el.textContent = text||title||".";
    button.appendChild(el);

    button.setAttribute('title',title);
    
    return button;
  },
  setButtonText: function(button,text, icon, title) {
    button.innerHTML = '';
    button.className = 'ui-button ui-widget ui-state-default ui-corner-all';

    // Icon only
    if(icon && !text) {
      button.className += ' ui-button-icon-only';
      icon.className += ' ui-button-icon-primary ui-icon-primary';
      button.appendChild(icon);
    }
    // Icon and Text
    else if(icon) {
      button.className += ' ui-button-text-icon-primary';
      icon.className += ' ui-button-icon-primary ui-icon-primary';
      button.appendChild(icon);
    }
    // Text only
    else {
      button.className += ' ui-button-text-only';
    }

    var el = document.createElement('span');
    el.className = 'ui-button-text';
    el.textContent = text||title||".";
    button.appendChild(el);

    button.setAttribute('title',title);
  },
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'ui-widget-content ui-corner-all';
    el.style.padding = '1em 1.4em';
    el.style.marginBottom = '20px';
    return el;
  },
  afterInputReady: function(input) {
    if(input.controls) return;
    input.controls = this.closest(input,'.form-control');
  },
  addInputError: function(input,text) {
    if(!input.controls) return;
    if(!input.errmsg) {
      input.errmsg = document.createElement('div');
      input.errmsg.className = 'ui-state-error';
      input.controls.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = '';
    }

    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
    if(!input.errmsg) return;
    input.errmsg.style.display = 'none';
  },
  markTabActive: function(tab) {
    tab.className = tab.className.replace(/\s*ui-widget-header/g,'')+' ui-state-active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s*ui-state-active/g,'')+' ui-widget-header';
  }
});

JSONEditor.AbstractIconLib = Class.extend({
  mapping: {
    collapse: '',
    expand: '',
    delete: '',
    edit: '',
    add: '',
    cancel: '',
    save: '',
    moveup: '',
    movedown: ''
  },
  icon_prefix: '',
  getIconClass: function(key) {
    if(this.mapping[key]) return this.icon_prefix+this.mapping[key];
    else return null;
  },
  getIcon: function(key) {
    var iconclass = this.getIconClass(key);
    
    if(!iconclass) return null;
    
    var i = document.createElement('i');
    i.className = iconclass;
    return i;
  }
});

JSONEditor.defaults.iconlibs.bootstrap2 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'chevron-down',
    expand: 'chevron-up',
    delete: 'trash',
    edit: 'pencil',
    add: 'plus',
    cancel: 'ban-circle',
    save: 'ok',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'icon-'
});

JSONEditor.defaults.iconlibs.bootstrap3 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'chevron-down',
    expand: 'chevron-right',
    delete: 'remove',
    edit: 'pencil',
    add: 'plus',
    cancel: 'floppy-remove',
    save: 'floppy-saved',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'glyphicon glyphicon-'
});

JSONEditor.defaults.iconlibs.fontawesome3 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'chevron-down',
    expand: 'chevron-right',
    delete: 'remove',
    edit: 'pencil',
    add: 'plus',
    cancel: 'ban-circle',
    save: 'save',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'icon-'
});

JSONEditor.defaults.iconlibs.fontawesome4 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'caret-square-o-down',
    expand: 'caret-square-o-right',
    delete: 'times',
    edit: 'pencil',
    add: 'plus',
    cancel: 'ban',
    save: 'save',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'fa fa-'
});

JSONEditor.defaults.iconlibs.foundation2 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'minus',
    expand: 'plus',
    delete: 'remove',
    edit: 'edit',
    add: 'add-doc',
    cancel: 'error',
    save: 'checkmark',
    moveup: 'up-arrow',
    movedown: 'down-arrow'
  },
  icon_prefix: 'foundicon-'
});

JSONEditor.defaults.iconlibs.foundation3 = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'minus',
    expand: 'plus',
    delete: 'x',
    edit: 'pencil',
    add: 'page-add',
    cancel: 'x-circle',
    save: 'save',
    moveup: 'arrow-up',
    movedown: 'arrow-down'
  },
  icon_prefix: 'fi-'
});

JSONEditor.defaults.iconlibs.jqueryui = JSONEditor.AbstractIconLib.extend({
  mapping: {
    collapse: 'triangle-1-s',
    expand: 'triangle-1-e',
    delete: 'trash',
    edit: 'pencil',
    add: 'plusthick',
    cancel: 'closethick',
    save: 'disk',
    moveup: 'arrowthick-1-n',
    movedown: 'arrowthick-1-s'
  },
  icon_prefix: 'ui-icon ui-icon-'
});

JSONEditor.defaults.templates.javascript = function() {
  return {
    compile: function(template) {
      /* jshint ignore:start */
      return Function("vars", template);
      /* jshint ignore:end */
    }
  };
};

// Set the default theme
JSONEditor.defaults.theme = 'html';

// Set the default template engine
JSONEditor.defaults.template = 'default';

// Default options when initializing JSON Editor
JSONEditor.defaults.options = {};

// String translate function
JSONEditor.defaults.translate = function(key, variables) {
  var lang = JSONEditor.defaults.languages[JSONEditor.defaults.language];
  if(!lang) throw "Unknown language "+JSONEditor.defaults.language;
  
  var string = lang[key] || JSONEditor.defaults.languages[JSONEditor.defaults.default_language][key];
  
  if(typeof string === "undefined") throw "Unknown translate string "+key;
  
  if(variables) {
    for(var i=0; i<variables.length; i++) {
      string = string.replace(new RegExp('\\{\\{'+i+'}}','g'),variables[i]);
    }
  }
  
  return string;
};

// Translation strings and default languages
JSONEditor.defaults.default_language = 'en';
JSONEditor.defaults.language = JSONEditor.defaults.default_language;
JSONEditor.defaults.languages.en = {
  /**
   * When a property is not set
   */
  error_notset: "Property must be set",
  /**
   * When a string must not be empty
   */
  error_notempty: "Value required",
  /**
   * When a value is not one of the enumerated values
   */
  error_enum: "Value must be one of the enumerated values",
  /**
   * When a value doesn't validate any schema of a 'anyOf' combination
   */
  error_anyOf: "Value must validate against at least one of the provided schemas",
  /**
   * When a value doesn't validate
   * @variables This key takes one variable: The number of schemas the value does not validate
   */
  error_oneOf: 'Value must validate against exactly one of the provided schemas. It currently validates against {{0}} of the schemas.',
  /**
   * When a value does not validate a 'not' schema
   */
  error_not: "Value must not validate against the provided schema",
  /**
   * When a value does not match any of the provided types
   */
  error_type_union: "Value must be one of the provided types",
  /**
   * When a value does not match the given type
   * @variables This key takes one variable: The type the value should be of
   */
  error_type: "Value must be of type {{0}}",
  /**
   *  When the value validates one of the disallowed types
   */
  error_disallow_union: "Value must not be one of the provided disallowed types",
  /**
   *  When the value validates a disallowed type
   * @variables This key takes one variable: The type the value should not be of
   */
  error_disallow: "Value must not be of type {{0}}",
  /**
   * When a value is not a multiple of or divisible by a given number
   * @variables This key takes one variable: The number mentioned above
   */
  error_multipleOf: "Value must be a multiple of {{0}}",
  /**
   * When a value is greater than it's supposed to be (exclusive)
   * @variables This key takes one variable: The maximum
   */
  error_maximum_excl: "Value must be less than {{0}}",
  /**
   * When a value is greater than it's supposed to be (inclusive
   * @variables This key takes one variable: The maximum
   */
  error_maximum_incl: "Value must at most {{0}}",
  /**
   * When a value is lesser than it's supposed to be (exclusive)
   * @variables This key takes one variable: The minimum
   */
  error_minimum_excl: "Value must be greater than {{0}}",
  /**
   * When a value is lesser than it's supposed to be (inclusive)
   * @variables This key takes one variable: The minimum
   */
  error_minimum_incl: "Value must be at least {{0}}",
  /**
   * When a value have too many characters
   * @variables This key takes one variable: The maximum character count
   */
  error_maxLength: "Value must be at most {{0}} characters long",
  /**
   * When a value does not have enough characters
   * @variables This key takes one variable: The minimum character count
   */
  error_minLength: "Value must be at least {{0}} characters long",
  /**
   * When a value does not match a given pattern
   */
  error_pattern: "Value must match the provided pattern",
  /**
   * When an array has additional items whereas it is not supposed to
   */
  error_additionalItems: "No additional items allowed in this array",
  /**
   * When there are to many items in an array
   * @variables This key takes one variable: The maximum item count
   */
  error_maxItems: "Value must have at most {{0}} items",
  /**
   * When there are not enough items in an array
   * @variables This key takes one variable: The minimum item count
   */
  error_minItems: "Value must have at least {{0}} items",
  /**
   * When an array is supposed to have unique items but has duplicates
   */
  error_uniqueItems: "Array must have unique items",
  /**
   * When there are too many properties in an object
   * @variables This key takes one variable: The maximum property count
   */
  error_maxProperties: "Object must have at most {{0}} properties",
  /**
   * When there are not enough properties in an object
   * @variables This key takes one variable: The minimum property count
   */
  error_minProperties: "Object must have at least {{0}} properties",
  /**
   * When a required property is not defined
   * @variables This key takes one variable: The name of the missing property
   */
  error_required: "Object is missing the required property '{{0}}'",
  /**
   * When there is an additional property is set whereas there should be none
   * @variables This key takes one variable: The name of the additional property
   */
  error_additional_properties: "No additional properties allowed, but property {{0}} is set",
  /**
   * When a dependency is not resolved
   * @variables This key takes one variable: The name of the missing property for the dependency
   */
  error_dependency: "Must have property {{0}}"
};

// Miscellaneous Plugin Settings
JSONEditor.plugins = {
  ace: {
    theme: ''
  },
  epiceditor: {

  },
  sceditor: {

  },
  select2: {
    
  }
};

// Default per-editor options
for(var i in JSONEditor.defaults.editors) {
  if(!JSONEditor.defaults.editors.hasOwnProperty(i)) continue;
  JSONEditor.defaults.editors[i].options = JSONEditor.defaults.editors.options || {};
}

// Set the default resolvers
// Use "multiple" as a fall back for everything
JSONEditor.defaults.resolvers.unshift(function(schema) {
  if(typeof schema.type !== "string") return "multiple";
});
// If the type is set and it's a basic type, use the primitive editor
JSONEditor.defaults.resolvers.unshift(function(schema) {
  // If the schema is a simple type
  if(typeof schema.type === "string") return schema.type;
});
// Use the select editor for all boolean values
JSONEditor.defaults.resolvers.unshift(function(schema) {
  if(schema.type === 'boolean') {
    return "select";
  }
});
// Use the multiple editor for schemas where the `type` is set to "any"
JSONEditor.defaults.resolvers.unshift(function(schema) {
  // If the schema can be of any type
  if(schema.type === "any") return "multiple";
});
// Use the table editor for arrays with the format set to `table`
JSONEditor.defaults.resolvers.unshift(function(schema) {
  // Type `array` with format set to `table`
  if(schema.type == "array" && schema.format == "table") {
    return "table";
  }
});
// Use the `select` editor for dynamic enumSource enums
JSONEditor.defaults.resolvers.unshift(function(schema) {
  if(schema.enumSource) return "select";
});
// Use the `enum` or `select` editors for schemas with enumerated properties
JSONEditor.defaults.resolvers.unshift(function(schema) {
  if(schema.enum) {
    if(schema.type === "number" || schema.type === "integer" || schema.type === "string") {
      return "select";
    }
  }
});
// Use the multiple editor for schemas with `oneOf` set
JSONEditor.defaults.resolvers.unshift(function(schema) {
  // If this schema uses `oneOf`
  if(schema.oneOf) return "multiple";
});
// Use the `derived` editor if requested.
JSONEditor.defaults.resolvers.unshift(function(schema) {
  if(schema.options && schema.options.derived === true) {
      return "derived";
  }
});

  window.JSONEditor = JSONEditor;
})();
