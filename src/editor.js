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
    
    this.options = $extend({}, (this.options || {}), (options.schema.options || {}), options);
    
    if(!options.path && !this.schema.id) this.schema.id = 'root';
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
    if(this.schema.vars) this.schema.watch = this.schema.vars;
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
      vars = $extend(this.getWatchedFieldValues(),{
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
