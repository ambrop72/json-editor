JSONEditor.defaults.editors.derived = JSONEditor.AbstractEditor.extend({
    buildImpl: function() {
        this.always_disabled = true;
        if (!this.schema.template) {
            throw "'derived' editor requires the template property to be set.";
        }
        this.template = this.jsoneditor.compileTemplate(this.schema.template, this.template_engine);
        this.myValue = null;
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
        var vars = this.getWatchedFieldValues();
        this.myValue = this.template(vars);
        this.onChange();
        this._super();
    }
});
