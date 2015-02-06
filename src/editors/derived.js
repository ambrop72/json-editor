JSONEditor.defaults.editors.derived = JSONEditor.AbstractEditor.extend({
    buildImpl: function() {
        this.always_disabled = true;
        if ($has(this.schema, 'valueTemplate')) {
            this.derived_mode = 'template';
            this.template = this.jsoneditor.compileTemplate(this.schema.valueTemplate, this.template_engine);
            this.myValue = null;
        } else if ($has(this.schema, 'constantValue')) {
            this.derived_mode = 'constant';
            this.myValue = this.schema.constantValue;
        } else {
            throw "'derived' editor requires the valueTemplate or constantValue property to be set.";
        }
    },
    destroyImpl: function() {
        this.myValue = null;
        this.template = null;
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
    }
});
