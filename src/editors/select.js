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
    if(this.select2) this.select2.select2('val',this.input.value);
    this.value = sanitized;
    
    this.onChange();
  },
  register: function() {
    this._super();
    if(!this.input) return;
    this.input.setAttribute('name',this.formname);
  },
  unregister: function() {
    this._super();
    if(!this.input) return;
    this.input.removeAttribute('name');
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
      this.enumSource = [];
      this.enum_display = [];
      this.enum_options = [];
      this.enum_values = [];
      
      // Shortcut declaration for using a single array
      if(!(Array.isArray(this.schema.enumSource))) {
        if(this.schema.enumValue) {
          this.enumSource = [
            {
              source: this.schema.enumSource,
              value: this.schema.enumValue
            }
          ];
        }
        else {
          this.enumSource = [
            {
              source: this.schema.enumSource
            }
          ];
        }
      }
      else {
        for(i=0; i<this.schema.enumSource.length; i++) {
          // Shorthand for watched variable
          if(typeof this.schema.enumSource[i] === "string") {
            this.enumSource[i] = {
              source: this.schema.enumSource[i]
            };
          }
          // Make a copy of the schema
          else if(!(Array.isArray(this.schema.enumSource[i]))) {
            this.enumSource[i] = $extend({},this.schema.enumSource[i]);
          }
          else {
            this.enumSource[i] = this.schema.enumSource[i];
          }
        }
      }
      
      // Now, enumSource is an array of sources
      // Walk through this array and fix up the values
      for(i=0; i<this.enumSource.length; i++) {
        if(this.enumSource[i].value) {
          this.enumSource[i].value = this.jsoneditor.compileTemplate(this.enumSource[i].value, this.template_engine);
        }
        if(this.enumSource[i].title) {
          this.enumSource[i].title = this.jsoneditor.compileTemplate(this.enumSource[i].title, this.template_engine);
        }
        if(this.enumSource[i].filter) {
          this.enumSource[i].filter = this.jsoneditor.compileTemplate(this.enumSource[i].filter, this.template_engine);
        }
        if(this.enumSource[i].sourceTemplate) {
          this.enumSource[i].sourceTemplate = this.jsoneditor.compileTemplate(this.enumSource[i].sourceTemplate, this.template_engine);
        }
      }
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
    this.setupSelect2();
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
  setupSelect2: function() {
    // If the Select2 library is loaded use it when we have lots of items
    if(window.jQuery && window.jQuery.fn && window.jQuery.fn.select2 && (this.enum_options.length > 2 || (this.enum_options.length && this.enumSource))) {
      var options = $extend({},JSONEditor.plugins.select2);
      if(this.schema.options && this.schema.options.select2_options) options = $extend(options,this.schema.options.select2_options);
      this.select2 = window.jQuery(this.input).select2(options);
      var self = this;
      this.select2.on('select2-blur',function() {
        self.input.value = self.select2.select2('val');
        self.onInputChange();
      });
    }
    else {
      this.select2 = null;
    }
  },
  onWatchedFieldChange: function() {
    var self = this, vars, j;
    
    // If this editor uses a dynamic select box
    if(this.enumSource) {
      vars = this.getWatchedFieldValues();
      var select_options = [];
      var select_titles = [];
      
      for(var i=0; i<this.enumSource.length; i++) {
        var src = this.enumSource[i];
        
        // Constant values
        if(Array.isArray(src)) {
          select_options = select_options.concat(src);
          select_titles = select_titles.concat(src);
        }
        // A watched field
        else if(src.sourceTemplate || vars[src.source]) {
          var items;
          if(src.sourceTemplate) {
            items = src.sourceTemplate($extend({},vars));
          } else {
            items = vars[src.source];
          }
          
          // Only use a predefined part of the array
          if(src.slice) {
            items = Array.prototype.slice.apply(items,src.slice);
          }
          // Filter the items
          if(src.filter) {
            var new_items = [];
            for(j=0; j<items.length; j++) {
              if(src.filter($extend({},vars,{i:j,item:items[j]}))) new_items.push(items[j]);
            }
            items = new_items;
          }
          
          var item_titles = [];
          var item_values = [];
          for(j=0; j<items.length; j++) {
            var item = items[j];
            
            // Rendered value
            if(src.value) {
              item_values[j] = src.value($extend({},vars,{
                i: j,
                item: item
              }));
            }
            // Use value directly
            else {
              item_values[j] = items[j];
            }
            
            // Rendered title
            if(src.title) {
              item_titles[j] = src.title($extend({},vars,{
                i: j,
                item: item
              }));
            }
            // Use value as the title also
            else {
              item_titles[j] = item_values[j];
            }
          }
          
          // TODO: sort
          
          select_options = select_options.concat(item_values);
          select_titles = select_titles.concat(item_titles);
        }
      }
      
      var prev_value = this.value;
      
      this.theme.setSelectOptions(this.input, select_options, select_titles);
      this.enum_options = select_options;
      this.enum_display = select_titles;
      this.enum_values = select_options;
      
      if(this.select2) {
        this.select2.select2('destroy');
      }
      
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
      
      this.setupSelect2();
    }

    this._super();
  },
  enable: function() {
    if(!this.always_disabled) {
      this.input.disabled = false;
      if(this.select2) this.select2.select2("enable",true);
    }
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    if(this.select2) this.select2.select2("enable",false);
    this._super();
  },
  destroy: function() {
    if(this.label && this.label.parentNode) this.label.parentNode.removeChild(this.label);
    if(this.description && this.description.parentNode) this.description.parentNode.removeChild(this.description);
    if(this.input && this.input.parentNode) this.input.parentNode.removeChild(this.input);
    if(this.select2) {
      this.select2.select2('destroy');
      this.select2 = null;
    }

    this._super();
  }
});
