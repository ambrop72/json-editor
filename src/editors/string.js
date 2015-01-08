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
