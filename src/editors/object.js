JSONEditor.defaults.editors.object = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return $extend({},this.schema.default || {});
  },
  enable: function() {
    if(this.addproperty_button) this.addproperty_button.disabled = false;
    
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) continue;
        this.editors[i].enable();
      }
    }
  },
  disable: function() {
    if(this.addproperty_button) this.addproperty_button.disabled = true;
    
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
      if(editor.property_removed) return;
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
  getPropertySchema: function(key) {
    // Schema declared directly in properties
    var schema = this.schema.properties[key] || {};
    schema = $extend({},schema);
    
    // Any matching patternProperties should be merged in
    if(this.schema.patternProperties) {
      for(var i in this.schema.patternProperties) {
        if(!this.schema.patternProperties.hasOwnProperty(i)) continue;
        var regex = new RegExp(i);
        if(regex.test(key)) {
          schema.allOf = schema.allOf || [];
          schema.allOf.push(this.schema.patternProperties[i]);
        }
      }
    }
    
    return schema;
  },
  buildImpl: function() {
    this.editors = {};
    var self = this;

    this.schema.properties = this.schema.properties || {};

    // If the object should be rendered as a table row
    if(this.options.table_row) {
      this.editor_holder = this.container;
    }
    // If the object should be rendered as a table
    else if(this.options.table) {
      // TODO: table display format
      throw "Not supported yet";
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
      
      // Manage Properties modal
      this.addproperty_holder = this.theme.getModal();
      this.addproperty_list = document.createElement('div');
      this.addproperty_list.style.width = '295px';
      this.addproperty_list.style.maxHeight = '160px';
      this.addproperty_list.style.padding = '5px 0';
      this.addproperty_list.style.overflowY = 'auto';
      this.addproperty_list.style.overflowX = 'hidden';
      this.addproperty_list.style.paddingLeft = '5px';
      this.addproperty_add = this.getButton('add','add','add');
      this.addproperty_input = this.theme.getFormInputField('text');
      this.addproperty_input.setAttribute('placeholder','Property name...');
      this.addproperty_input.style.width = '220px';
      this.addproperty_input.style.marginBottom = '0';
      this.addproperty_input.style.display = 'inline-block';
      this.addproperty_add.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        if(self.addproperty_input.value) {
          if(self.editors[self.addproperty_input.value]) {
            window.alert('there is already a property with that name');
            return;
          }
          
          self.withProcessingContext(function() {
            self.addObjectProperty(self.addproperty_input.value);
            if(self.editors[self.addproperty_input.value]) {
              self.editors[self.addproperty_input.value].disable();
            }
            self.onChange();
          }, 'addproperty_add');
        }
      });
      this.addproperty_holder.appendChild(this.addproperty_list);
      this.addproperty_holder.appendChild(this.addproperty_input);
      this.addproperty_holder.appendChild(this.addproperty_add);
      var spacer = document.createElement('div');
      spacer.style.clear = 'both';
      this.addproperty_holder.appendChild(spacer);
      
      
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
      this.addproperty_controls = this.theme.getHeaderButtonHolder();
      this.title.appendChild(this.title_controls);
      this.title.appendChild(this.addproperty_controls);

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
      
      // Object Properties Button
      this.addproperty_button = this.getButton('Properties','edit','Object Properties');
      this.addproperty_button.addEventListener('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.toggleAddProperty();
      });
      this.addproperty_controls.appendChild(this.addproperty_button);
      this.addproperty_controls.appendChild(this.addproperty_holder);
      this.refreshAddProperties();
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
  addPropertyCheckbox: function(key) {
    var self = this;
    var checkbox, label, control;
    
    checkbox = self.theme.getCheckbox();
    checkbox.style.width = 'auto';
    label = self.theme.getCheckboxLabel(key);
    control = self.theme.getFormControl(label,checkbox);
    control.style.paddingBottom = control.style.marginBottom = control.style.paddingTop = control.style.marginTop = 0;
    control.style.height = 'auto';
    //control.style.overflowY = 'hidden';
    self.addproperty_list.appendChild(control);
    
    checkbox.checked = key in this.editors;
    checkbox.addEventListener('change',function() {
      self.withProcessingContext(function() {
        if (checkbox.checked) {
          self.addObjectProperty(key);
        } else {
          self.removeObjectProperty(key);
        }
        self.onChange();
      }, 'addproperty_checkbox');
    });
    self.addproperty_checkboxes[key] = checkbox;
    
    return checkbox;
  },
  showAddProperty: function() {
    if(!this.addproperty_holder) return;
    
    // Position the form directly beneath the button
    // TODO: edge detection
    this.addproperty_holder.style.left = this.addproperty_button.offsetLeft+"px";
    this.addproperty_holder.style.top = this.addproperty_button.offsetTop + this.addproperty_button.offsetHeight+"px";
    
    // Disable the rest of the form while editing JSON
    this.disable();
    
    this.adding_property = true;
    this.addproperty_button.disabled = false;
    this.addproperty_holder.style.display = '';
    this.refreshAddProperties();
  },
  hideAddProperty: function() {
    if(!this.addproperty_holder) return;
    if(!this.adding_property) return;
    
    this.addproperty_holder.style.display = 'none';
    this.enable();
    
    this.adding_property = false;
  },
  toggleAddProperty: function() {
    if(this.adding_property) this.hideAddProperty();
    else this.showAddProperty();
  },
  removeObjectProperty: function(property) {
    if(this.editors[property]) {
      this.editors[property].destroy();
      delete this.editors[property];
      
      this.refreshValue();
      this.layoutEditors();
    }
  },
  addObjectProperty: function(name) {
    var self = this;
    
    // Property is already added
    if(this.editors[name]) return;
    
    if(!this.canHaveAdditionalProperties() && (!this.schema.properties || !this.schema.properties[name])) {
      return;
    }

    var holder;
    var extra_opts = {};
    if (self.options.table_row) {
      holder = self.theme.getTableCell();
      extra_opts.compact = true;
      extra_opts.required = true;
    } else {
      holder = self.theme.getChildEditorHolder();
    }
    
    var schema = self.getPropertySchema(name);
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
  canHaveAdditionalProperties: function() {
    return this.schema.additionalProperties !== false && !this.jsoneditor.options.no_additional_properties;
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
    
    if(this.adding_property) this.refreshAddProperties();
  },
  refreshAddProperties: function() {
    if(this.options.disable_properties || this.jsoneditor.options.disable_properties) {
      this.addproperty_controls.style.display = 'none';
      return;
    }

    var can_add = false, can_remove = false, num_props = 0, i, show_modal = false;
    
    // Get number of editors
    for(i in this.editors) {
      if(!this.editors.hasOwnProperty(i)) continue;
      num_props++;
    }
    
    // Determine if we can add back removed properties
    can_add = this.canHaveAdditionalProperties() && !(typeof this.schema.maxProperties !== "undefined" && num_props >= this.schema.maxProperties);
    
    if(this.addproperty_checkboxes) {
      this.addproperty_list.innerHTML = '';
    }
    this.addproperty_checkboxes = {};
    
    // Check for which editors can't be removed or added back
    for(i in this.editors) {
      if(!this.editors.hasOwnProperty(i)) continue;
      
      this.addPropertyCheckbox(i);
      
      if(this.isRequired(this.editors[i])) {
        this.addproperty_checkboxes[i].disabled = true;
      }
      
      if(typeof this.schema.minProperties !== "undefined" && num_props <= this.schema.minProperties) {
        this.addproperty_checkboxes[i].disabled = this.addproperty_checkboxes[i].checked;
        if(!this.addproperty_checkboxes[i].checked) show_modal = true;
      }
      else if(!(i in this.editors)) {
        if(!can_add  && !this.schema.properties.hasOwnProperty(i)) {
          this.addproperty_checkboxes[i].disabled = true;
        }
        else {
          this.addproperty_checkboxes[i].disabled = false;
          show_modal = true;
        }
      }
      else {
        show_modal = true;
        can_remove = true;
      }
    }
    
    if(this.canHaveAdditionalProperties()) {
      show_modal = true;
    }
    
    // Additional addproperty checkboxes not tied to a current editor
    for(i in this.schema.properties) {
      if(!this.schema.properties.hasOwnProperty(i)) continue;
      if(this.editors[i]) continue;
      show_modal = true;
      this.addPropertyCheckbox(i);
      this.addproperty_checkboxes[i].disabled = !can_add;
    }
    
    // If no editors can be added or removed, hide the modal button
    if(!show_modal) {
      this.hideAddProperty();
      this.addproperty_controls.style.display = 'none';
    }
    // If additional properties are disabled
    else if(!this.canHaveAdditionalProperties()) {
      this.addproperty_add.style.display = 'none';
      this.addproperty_input.style.display = 'none';
    }
    // If no new properties can be added
    else if(!can_add) {
      this.addproperty_add.disabled = true;
    }
    // If new properties can be added
    else {
      this.addproperty_add.disabled = false;
    }
  },
  isRequired: function(editor) {
    if(typeof editor.schema.required === "boolean") return editor.schema.required;
    else if(Array.isArray(this.schema.required)) return this.schema.required.indexOf(editor.key) > -1;
    else if(this.jsoneditor.options.required_by_default) return true;
    else return false;
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
      // Otherwise, remove value unless this is the initial TBD set or it's required
      else if(!initial && !self.isRequired(editor)) {
        self.removeObjectProperty(i);
      }
      // Otherwise, set the value to the default
      else {
        setActions.push({name: i});
      }
    });

    // Also try to set properties for which we don't have editors.
    $each(value, function(i,val) {
      if(!self.editors.hasOwnProperty(i)) {
        setActions.push({name: i, value: val});
      }
    });
    
    // For the initial value, we need to make sure we actually have the editors.
    if (initial) {
      $each(self.schema.properties, function(i, schema) {
        if (!self.editors.hasOwnProperty(i) && !value.hasOwnProperty(i)) {
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
      if (self.editors[i]) {
        var set_value = action.hasOwnProperty('value') ? action.value : self.editors[i].getDefault();
        self.editors[i].setValue(set_value);
      }
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
