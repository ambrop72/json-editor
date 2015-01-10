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
      required: true,
      no_label: true
    });
    self.editor.build();
    
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
