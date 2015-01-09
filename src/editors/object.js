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

    this.schema.properties = this.schema.properties || {};

    // If the object should be rendered as a table row
    if(this.options.table_row) {
      this.editor_holder = this.container;
    }
    // If the object should be rendered as a div
    else {
      this.defaultProperties = this.schema.defaultProperties || Object.keys(this.schema.properties);

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
    
    var schema = $extend({}, self.schema.properties[name]);
    var editor = self.jsoneditor.getEditorClass(schema);
    self.editor_holder.appendChild(holder);
    self.editors[name] = self.jsoneditor.createEditor(editor, $extend({
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
      $each(self.schema.properties, function(i, schema) {
        if (!self.editors.hasOwnProperty(i)) {
          setActions.push({name: i});
        }
      });
    }
    
    // Add processingOrder to set-actions.
    $each(setActions, function(ind,action) {
      var i = action.name;
      action.processingOrder = 0;
      if (self.schema.properties && self.schema.properties[i] && typeof self.schema.properties[i].processingOrder !== "undefined") {
        action.processingOrder = self.schema.properties[i].processingOrder;
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
