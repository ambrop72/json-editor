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
