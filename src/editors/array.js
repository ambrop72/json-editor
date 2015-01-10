JSONEditor.defaults.editors.array = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || [];
  },
  enable: function() {
    if(this.add_row_button) this.add_row_button.disabled = false;
    if(this.remove_all_rows_button) this.remove_all_rows_button.disabled = false;
    
    for(var i=0; i<this.rows.length; i++) {
      this.rows[i].enable();
      
      if(this.rows[i].moveup_button) this.rows[i].moveup_button.disabled = false;
      if(this.rows[i].movedown_button) this.rows[i].movedown_button.disabled = false;
      if(this.rows[i].delete_button) this.rows[i].delete_button.disabled = false;
    }
    this._super();
  },
  disable: function() {
    if(this.add_row_button) this.add_row_button.disabled = true;
    if(this.remove_all_rows_button) this.remove_all_rows_button.disabled = true;

    for(var i=0; i<this.rows.length; i++) {
      this.rows[i].disable();
      
      if(this.rows[i].moveup_button) this.rows[i].moveup_button.disabled = true;
      if(this.rows[i].movedown_button) this.rows[i].movedown_button.disabled = true;
      if(this.rows[i].delete_button) this.rows[i].delete_button.disabled = true;
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
