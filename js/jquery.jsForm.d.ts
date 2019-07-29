interface JQuery {
	/**
	 * Initialize jsform with default configuration on a node
	 */
	jsForm(): JQuery;
	jsForm(func:any): JQuery;
	jsForm(func:string, opts:JsFormConfig): JQuery; 
}

/**
 * The jsForm configuration object
 */
interface JsFormConfig {
    /**
     * enable form control rendering (if jsForm.controls is available) and validation
     */
    controls: boolean = true;
    /**
     * the object used to fill/collect data
     */
    data?: any;
    /**
     * the prefix used to annotate the input fields
     */
    prefix: string = "data";
    /**
     * set to null to discourage the tracking of "changed" fields. 
     * Disabling this will increase performance, but disabled the "changed" functionality.
     * This will add the given css class to changed fields.
     */
    trackChanges: string = "changed";
    /**
     * set to false to only validate visible fields. 
     * This is discouraged especially when you have tabs or similar elements in your form.
     */
    validateHidden: boolean = true;
    /**
     * skip empty values when getting an object
     */
    skipEmpty: boolean = false;
    /**
     * an object with callback functions that act as renderer for data fields (class=object).
     * ie. { infoRender: function(data){return data.id + ": " + data.name} } 
     */
    renderer?: any;
    /**
     * an object with callback functions that act as pre-processors for data fields (class=object).
     * ie. { idFilter: function(data){return data.id} } 
     */
    processors?: any;
    /**
     * dataHandler will be called for each field filled. 
     */
    dataHandler?: JsFormDataHandler; /*{
        serialize: function(val, field, obj) {
            if(field.hasClass("reverse"))
                return val.reverse();
        },
        deserialize: function(val, field, obj) {
            if(field.hasClass("reverse"))
                return val.reverse();
        }
    }*/
    /**
     * optional array of elements that should be connected with the form. This
     * allows the splitting of the form into different parts of the dom.
     */
    connect?: Array<any>;
    /**
     * The class used when calling preventEditing. This will replace all
     * inputs with a span with the given field
     */
    viewClass: string = "jsfValue";
}

interface JsFormDataHandler {
    serialize(val: any, field:JQuery, obj: any): string; 
    deserialize(val: string, field:JQuery, obj: any): any; 
}

