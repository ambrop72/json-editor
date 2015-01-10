var JSONEditor = function(element,options) {
  this.element = element;
  this.options = $extendPersistent(JSONEditor.defaults.options, options || {});
  this.init();
};
JSONEditor.prototype = {
  init: function() {
    var self = this;
    
    this.destroyed = false;
    this.firing_change = false;
    this.validation_pending = true;
    
    var theme_class = JSONEditor.defaults.themes[this.options.theme || JSONEditor.defaults.theme];
    if(!theme_class) throw "Unknown theme " + (this.options.theme || JSONEditor.defaults.theme);
    
    this.schema = this.options.schema;
    this.theme = new theme_class();
    this.template = this.options.template;
    
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

    // Do an initial validation.
    self._maybeValidate();
    
    // Schedule a change event, while avoiding another validation.
    self._scheduleChange();
  },
  getValue: function() {
    if(this.destroyed) throw "JSON Editor destroyed";

    return this.root.getFinalValue();
  },
  setValue: function(value) {
    if(this.destroyed) throw "JSON Editor destroyed";
    
    this.root.setValue(value);
    return this;
  },
  validate: function(value) {
    if(this.destroyed) throw "JSON Editor destroyed";
    
    // Custom value
    if(arguments.length === 1) {
      return this.validator.validate(value);
    }
    // Current value
    else {
      this._maybeValidate();
      return this.validation_results;
    }
  },
  destroy: function() {
    if(this.destroyed) return;
    
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
  _maybeValidate: function() {
    var self = this;
    if (self.validation_pending) {
      self.validation_results = self.validator.validate(self.root.getValue());
      if(self.options.show_errors !== "never") {
        self.root.showValidationErrors(self.validation_results);
      }
      self.validation_pending = false;
    }
  },
  _scheduleChange: function() {
    var self = this;
    
    if (self.firing_change) {
      return;
    }
    self.firing_change = true;
    
    window.requestAnimationFrame(function() {
      if(self.destroyed) return;
      self.firing_change = false;
      self._maybeValidate();
      self.trigger('change');
    });
  },
  onChange: function() {
    var self = this;
    if (self.destroyed) {
      return;
    }
    self.validation_pending = true;
    self._scheduleChange();
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
