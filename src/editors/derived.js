JSONEditor.defaults.editors.derived = JSONEditor.AbstractEditor.extend({
    build: function() {
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
    setValue: function(val, initial) {
    },
    onWatchedFieldChange: function() {    
        var vars = this.getWatchedFieldValues();
        this.myValue = this.template(vars);
        this.onChangeFromWatchListener();
        this._super();
    }
});
