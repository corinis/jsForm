/**
 * jquery.jsForm
 * -------------
 * JsForm control for handling html UI with json objects
 * @version 1.0
 * @class
 * @author Niko Berger
 * @license MIT License GPL
 */
;(function( $, window, undefined ){
	"use strict";

	var JSFORM_INIT_FUNCTIONS = {},	// remember initialization functions
	JSFORM_MAP = {};	// remember all forms


	/**
	 * @param element {Node} the container node that should be converted to a jsForm
	 * @param options {object} the configuraton object
	 * @constructor
	 */
	function JsForm (element, options) {
		var $this = $(element);

		// create the options
		this.options = $.extend({}, {
			/**
			 * enable form control rendering (if jsForm.controls is available) and validation
			 */
			controls: true,
			/**
			 * the object used to fill/collect data
			 */
			data: null,
			/**
			 * the prefix used to annotate the input fields
			 */
			prefix: "data",
			/**
			 * set to null to discourage the tracking of "changed" fields. 
			 * Disabling this will increase performance, but disabled the "changed" functionality.
			 * This will add the given css class to changed fields.
			 */
			trackChanges: "changed",
			/**
			 * set to false to only validate visible fields. 
			 * This is discouraged especially when you have tabs or similar elements in your form.
			 */
			validateHidden: true,
			/**
			 * skip empty values when getting an object
			 */
			skipEmpty: false,
			/**
			 * an object with callback functions that act as renderer for data fields (class=object).
			 * ie. { infoRender: function(data){return data.id + ": " + data.name} } 
			 */
			renderer: null,
			/**
			 * an object with callback functions that act as pre-processors for data fields (class=object).
			 * ie. { idFilter: function(data){return data.id} } 
			 */
			processors: null,
			/**
			 * dataHandler will be called for each field filled. 
			 */
			dataHandler: null, /*{
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
			connect: null,
			/**
			 * The class used when calling preventEditing. This will replace all
			 * inputs with a span with the given field
			 */
			viewClass: "jsfValue"
		}, options);

		// read prefix from dom
		if($this.attr("data-prefix") && (this.options.prefix === "data" || this.options.prefix === "")) {
			if($this.attr("data-prefix") !== "") {
				this.options.prefix = $this.attr("data-prefix");
			}
		}

		this.element = element;

		this._init();
	}

	/**
	 * init the portlet - load the config
	 * @private 
	 */
	JsForm.prototype._init = function() { 
		// init the basic dom functionality
		this._domInit();

		// enable form controls
		if(this.options.controls) {
			if($.jsFormControls) {
				// handle multiple form parts
				$.each(this._getForm(), function(){
					$(this).jsFormControls();
				});
			} else {
				try {
					if(typeof console !== "undefined") {
						this._debug("jquery.JsForm.controls not available!");
					}
				} catch(ex) {
					// ignore
				}
			}
		}

		// fill/init with the first data
		this._fill();
	};

	/**
	 * Connect a dom element with an already existing form.
	 * @param ele the new part of the form
	 */
	JsForm.prototype.connect = function(ele) {
		// collection lists with buttons
		this._initCollection(ele, this.options.prefix);
		// init conditionals
		this._initConditional(ele, this.options.prefix, this.options);

		// enable form controls
		if(this.options.controls) {
			if($.jsFormControls) {
				// handle multiple form parts
				$(ele).jsFormControls();
			} 
		}

		this._fillDom(ele);
		if(!this.options.connect)
			this.options.connect = [];
		this.options.connect.push(ele);
	};

	/**
	 * @return all nodes for this jsform (main + connected)
	 */
	JsForm.prototype.getNodes = function() {
		return this._getForm();
	};

	/**
	 * init the dom. This can be called multiple times.
	 * this will also enable "add", "insert" and "delete" for collections
	 * @private 
	 */
	JsForm.prototype._domInit = function() {
		var that = this;

		// handle multiple form parts
		$.each(this._getForm(), function(){
			// collection lists with buttons
			that._initCollection(this, that.options.prefix);
			// init conditionals
			that._initConditional(this, that.options.prefix, that.options);
		});
	};

	/**
	 * simple debug helper
	 * @param msg the message to print
	 * @private
	 */
	JsForm.prototype._debug = function(msg, param) {
		try {
			var cons = console || (window?window.console:null);
			if (!cons || !cons.log)
				return;

			var p = null;
			if($.isPlainObject(param)) {
				p = JSON.stringify(param, null, " ");
			} else {
				p = param;
			}

			if(!p) {
				p = "";
			}

			cons.log(msg + p);
		} catch(ex) {
			// ignore
		}
	};

	/**
	 * initialize conditionals.
	 * basic rule is:
	 * any dom element that has a conditional and either
	 * a data-show or data-hide attribute or a data-eval attribute 
	 *  
	 * @param form the base dom element
	 * @param prefix the prefix to check for
	 * @private
	 */
	JsForm.prototype._initConditional = function(form, prefix, options) {
		var that = this;
		var showEvaluator = function(ele, data, fields) {
			// if any field has a value -> show
			var show = false;
			$.each(fields, function(){
				var value = that._getValueWithArrays(data, this);
				if($(that).data().condition && value !== $(that).data().condition)
					return;
				else if(!value || value === "" || value === 0 || value === -1)
					return;
				 
				show = true;
				// skip processing
				return false;
			});
			if(show)
				ele.show();
			else
				ele.hide();
		}, hideEvaluator = function(ele, data, fields) {
			// if any field has a value -> hide
			var show = false;
			$.each(fields, function(){
				var value = that._getValueWithArrays(data, this);
				if($(that).data().condition && value !== $(that).data().condition)
					return;
				else if(!value || value === "" || value === 0 || value === -1)
					return;
					
				show = true;
				// skip processing
				return false;
			});
			if(show)
				ele.hide();
			else
				ele.show();
		};

		// remember the conditionals for faster dom access
		this.conditionals = $(form).find(".conditional"); 

		this.conditionals.each(function(){
			$(this).data().conditionalEval = [];
			var fields = $(this).attr("data-show");
			if(fields && fields.length > 0) {
				$(this).data().conditionalEval.push({
					func: showEvaluator,
					field: fields.split(" ") 
				});
			}
			fields = $(this).attr("data-hide");
			if(fields && fields.length > 0) {
				$(this).data().conditionalEval.push({
					func: hideEvaluator,
					field: fields.split(" ") 
				});
			}
			fields = $(this).attr("data-eval");
			if(fields && fields.length > 0) {
				// custom evaluator
				if(options.conditionals[fields])
					$(this).data().conditionalEval.push({
						func: options.conditionals[fields]
					});
			}
		});
	};

	/**
	 * evaluate conditionals on the form
	 * @param form the form to search for conditionals
	 * @param data the data
	 */
	JsForm.prototype._evaluateConditionals = function(form, data) {
		this.conditionals.each(function(){
			var ele = $(this);
			// go throguh all evaluation functions
			$.each(ele.data().conditionalEval, function() {
				this.func(ele, data, this.field);
			});
		});
	};

	/**
	 * initialize collections
	 * @param form the base dom element
	 * @param prefix the prefix to check for
	 * @private
	 */
	JsForm.prototype._initCollection = function(form, prefix) {
		// all collections
		var collectionMap = {},
		that = this;
		$(form).data().collections = collectionMap; 

		$(".collection", form).each(function() {
			var colName = $(this).attr("data-field");
			// skip collections without a data-field mapping
			if (!colName || colName.indexOf(prefix + ".") !== 0) {
				return;
			}

			var container = $(this);

			// remember the collection
			var cols = collectionMap[colName];
			if(cols) {
				cols.push(container);
			} else {
				collectionMap[colName] = [container];
			}

			//init the collection
			that._initList(container);

			// after adding: check if we want reorder control
			if(!container.hasClass("ui-sortable") && container.hasClass("sortable") && container.sortable) {
				// get the config object
				var config = container.attr("data-sortable");
				if(!config) {
					config = {};
				} else {
					config = JSON.parse(config);
				}

				container.sortable(config);
				container.on("sortstop", function( event, ui ) {
					that._reorder(container);
				});
			} 

			$(this).on("add", function(ev, pojo, fn){
				var fieldName = $(this).attr("data-field"); 
				// skip if fieldName doest match
				if(fn && fieldName != fn)
					return;
				
				var tmpl = $(this).data("template");
				if(!pojo) {
					pojo = {};
				}

				// and has a template
				if(tmpl) {
					var line = tmpl.clone(true);
					$(line).addClass("POJO");
					$(line).data().pojo = pojo;

					var prefill = $(this).data("prefill");
					if(!prefill)
						prefill = $(this).val("data-prefill");
					// allow prefill
					if(prefill){
						if($.isFunction(prefill))
							prefill($(line).data().pojo, $(line));
						else if(prefill.substring)
							$(line).data().pojo = JSON.parse(prefill);
						else if($.isPlainObject(prefill))
							$(line).data().pojo = prefill;

					}

					// init controls
					that._enableTracking($("input,textarea,select", line));
					// new line always has changes
					if(that.options.trackChanges)
						$("input,textarea,select", line).addClass(that.options.trackChanges);

					that._addCollectionControls(line);

					// its possible to have "sub" collections
					that._initCollection(line, fieldName.substring(fieldName.indexOf('.')+1));

					// trigger a callback
					$(this).trigger("addCollection", [line, $(line).data().pojo]);

					// the new entry has as index the count of all "lines"
					var idx = $(this).children(".POJO").length;

					$(line).on("refresh", function(){
						// fill read only fields
						that._fillFieldData($(this), $(this).data().pojo, fieldName.substring(fieldName.indexOf('.')+1), idx);
						
						// "fill data"
						that._fillData($(this), $(this).data().pojo, fieldName.substring(fieldName.indexOf('.')+1), idx);
					}).trigger("refresh");

					$(this).append(line);

					// trigger a callback after the data has been rendered)
					$(this).trigger("postAddCollection", [line, $(line).data().pojo]);
				}
			});
		});

		$(".add", form).each(function(){
			var fieldName = $(this).attr("data-field"); 
			if (!fieldName || fieldName.indexOf(prefix + ".") !== 0) {
				return;
			}

			// add the collection
			$(this).data().collections = collectionMap[fieldName];

			// only init once
			if($(this).data().hasJsForm) {
				return;
			}
			$(this).data().hasJsForm = true;


			$(this).click(function(ev){
				ev.preventDefault();

				// search for a collection with that name
				$.each($(this).data("collections"), function() {
					$(this).trigger("add", [null, fieldName]);
				});
			});
		});

		// insert: similar to add - but works with events
		$(".insert", form).each(function(){
			var fieldName = $(this).attr("data-field"); 
			if (!fieldName || fieldName.indexOf(prefix + ".") !== 0) {
				return;
			}

			// only init once
			if($(this).data().isCollection) {
				return;
			}
			$(this).data().isCollection = true;

			// remember the collections
			$(this).data("collections", collectionMap[$(this).attr("data-field")]);
			$(this).on("insert", function(ev, pojo){
				if(!pojo)
					pojo = $(this).data().pojo;
				// insert only works if there is a pojo
				if(!pojo) {
					return;
				}
				var beforeInsertCallback = $(this).data("beforeInsert");
				if(beforeInsertCallback && $.isFunction(beforeInsertCallback)) {
					pojo = beforeInsertCallback(pojo);

					// insert only works if there is a pojo
					if(!pojo) {
						return;
					}
				}

				// search for a collection with that name
				$.each($(this).data("collections"), function() {
					var tmpl = $(this).data("template");
					// and has a template
					if(tmpl) {
						var line = tmpl.clone(true);
						// mark that this is a pojo
						line.addClass("POJO");
						// add the pojo
						line.data().pojo = pojo;

						that._addCollectionControls(line);

						// its possible to have "sub" collections
						that._initCollection(line);

						// trigger a callback
						$(this).trigger("addCollection", [line, pojo]);

						// the new entry has as index the count of all "lines"
						var idx = $(this).children(".POJO").length;
						
						// fill the "information"
						$(line).on("refresh", function(){
							// fill read only fields
							that._fillFieldData($(this), $(this).data().pojo, fieldName.substring(fieldName.indexOf('.')+1), idx);
							
							// "fill data"
							that._fillData($(this), $(this).data().pojo, fieldName.substring(fieldName.indexOf('.')+1), idx);
						}).trigger("refresh");
						
						$(this).append(line);

						// trigger a callback after the data has been rendered)
						$(this).trigger("postAddCollection", [line, pojo]);
					}
				});

				// empty field
				$(this).val("");
				$(this).data().pojo = null;
				$(this).focus();
			});
		});

		// insert: helper button (triggers insert)
		$(".insertAction", form).each(function(){
			var fieldName = $(this).attr("data-field"); 
			if(!fieldName) {
				return;
			}

			// only init once
			if($(this).data("inserter")) {
				return;
			}

			// find the insert element for this data-field
			var inserter = $(this).parent().find(".insert");
			if(!inserter) {
				return;
			}

			// remember the inserter
			$(this).data("inserter", inserter);

			$(this).click(function(ev){
				ev.preventDefault();
				$(this).data("inserter").trigger("insert");
				return false;
			});

		});

		$("input.object", form).each(function(){
			$(this).on("update", function(evt){
				var pojo = $(this).data().pojo;
				if($(this).attr("data-display") || $(this).attr("data-render")) {
					$(this).val(that._renderObject(pojo, $(this).attr("data-display"), $(this).attr("data-render")));
				} 
			});
		});

		// fileupload
		$("input.blob", form).each(function(){
			// only available on input type file
			if($(this).attr("type") !== "file") {
				return;
			}

			var blobInput = $(this);

			// bind on change
			$(this).on("change", function(evt){

				//get file name
				var fileName = $(this).val().split(/\\/).pop();
				blobInput.data("name", fileName);

				var files = evt.target.files; // FileList object
				// Loop through the FileList (and render image files as thumbnails.(skip for ie < 9)
				if(files && files.length) {
					$.each(files, function() {
						var reader = new FileReader();

						// closure to capture the file information
						reader.onload = function(e) {
							// get the result
							blobInput.data("blob", e.target.result);
						};

						// Read in the image file as a data URL.
						reader.readAsDataURL(this);

						$(this).trigger("fileChange");
					});
				} 
			});


		});
	};

	/**
	 * init a container that has a tempalate child (first child). 
	 * @param container the contianer element
	 * @private
	 */
	JsForm.prototype._initList = function(container) {
		// avoid double initialisation
		if(container.data("template")) {
			return;
		}

		// get all children
		var tmpl = container.children().detach();

		// remove an id if there is one
		tmpl.removeAttr("id");
		container.data("template", tmpl);
	};

	/**
	 * generate the array with all DOM elements that are connected with 
	 * the form.
	 * @private
	 */
	JsForm.prototype._getForm = function() {
		var form = [$(this.element)];
		if(this.options.connect)
			$.each(this.options.connect, function(){
				form.push($(this));
			});
		return form;
	};

	/**
	 * clear/reset a form. The prefix is normally predefined by init
	 * @param form the form 
	 * @param prefix the optional prefix used to identify fields for this form
	 */
	JsForm.prototype._clear = function(form, prefix) {
		// get the prefix from the form if not given
		if(!prefix) {
			prefix = this.options.prefix;
		}

		$(form).removeData("pojo");
		$("input,select,textarea", form).each(function(){
			var name = $(this).attr("name");
			// empty name - ignore
			if (!name || name.indexOf(prefix + ".") !== 0) {
				return;
			}
			// cut away the prefix
			name = name.substring((prefix+".").length);
			// skip empty
			if(name.length < 1) {
				return;
			}

			// remove all pojos
			$(this).removeData("pojo");

			if($(this).attr("type") === "checkbox") {
				$(this).prop("checked", false);
			} else if($(this).attr("type") === "radio") {
				$(this).prop("checked", false);
			} else if($(this).data().valclass && $(this)[$(this).data().valclass].val){
				$(this)[$(this).data().valclass](val, "");
			} else {
				$(this).val("");
			}
			if($(this).hasClass("blob")) {
				$(this).removeData("blob");
			}
			// special type select box: select the FIRST child
			if($(this).is("select")) {
				$('option[selected="selected"]', this).prop('selected', false);
				$('option:first', this).prop('selected', true);

				$(this).val($("option:first", this).val());
				$(this).change();
			}
			// trigger change
			$(this).change();
		});

		$(".collection", form).each(function() {
			var fieldname = $(this).attr("data-field");
			// only collections with the correct prefix
			if(!fieldname || fieldname.indexOf(prefix+".") !== 0) {
				return;
			}
			// get rid of all
			$(this).empty();
		});

	};

	/**
	 * Handle arrays when creating pojos
	 * @param ele the element
	 * @param pojo the base object
	 * @param name the name of the field
	 * @param val the value to check agains
	 * @private
	 */
	JsForm.prototype._handleArrayInPojo = function(ele, pojo, name, val) {
		// create an array out of this
		if(!pojo[name]) {
			pojo[name] = [];
		}

		if(ele.attr("type") === "checkbox" || ele.attr("type") === "CHECKBOX") {
			// do we want the value of not
			var use = ele.is(":checked");
			var pushVal = true;
			$.each(pojo[name], function(data, index){
				if(this == val) {
					// dont need to push
					pushVal = false;
					// we dont use it - remove it
					if(!use)
						pojo[name].splice(index, 1);
					return false;
				}
			});
			if(pushVal && use)
				pojo[name].push(val);
		} else {
			var num = ele.attr("data-array");
			if(!num || isNaN(num)) {
				num = null;
			} else
				num = Number(num);

			// no num -> add the array
			if(num === null)
				pojo[name].push(val);
			else
				pojo[name][num] = val;
		}		
	};

	/**
	 * set a value in a pojo 
	 * @param pojo the data pojo
	 * @param name the name of the field to set (allows . syntax)
	 * @param val the value to set
	 * @param $this the object the val comes from for array check
	 */
	JsForm.prototype._setPojoVal = function(pojo, name, val, $this) {
		var that = this;
		
		// check if we have a . - if so split
		if (name.indexOf(".") === -1)
		{
			// handle arrays
			if($this && $this.hasClass("array")) {
				that._handleArrayInPojo($this, pojo, name, val);
			}
			else
				pojo[name] = val;
		}
		else
		{
			var parts = name.split(".");
			var prev;
			var current = pojo[parts[0]];
			if (!current || !$.isPlainObject(current)) {
				pojo[parts[0]] = {};
				current = pojo[parts[0]]; 
			}

			for(var i = 1; i < parts.length - 1; i++) {
				prev = current;
				current = prev[parts[i]];
				if(current === undefined || current === null) {
					current = {};
					prev[parts[i]] = current;
				}
			}

			// set prev as the name
			prev = parts[parts.length - 1];

			// handle arrays 
			if($this && $this.hasClass("array")) { 
				that._handleArrayInPojo($(this), current, prev, val);
			} else {
				current[prev] = val;
			}
		}
	};
	
	/**
	 * ceate a pojo from a form. Takes special data definition classes into account:
	 * <ul>
	 *  <li>number|currency: the content will be transformed into a number (default string</li>
	 *  <li>transient: will be ignored</li>
	 *  <li>prefix.fieldname.value: will create the whole object subtree</li> 
	 * </ul> 
	 * @param start the element to start from (ie. the form or tr)
	 * @param pojo the pojo to write everything to
	 * @param prefix a prefix: only fields with the given prefix will be included in the pojo
	 * @private
	 */
	JsForm.prototype._createPojoFromInput = function (start, prefix, pojo) {
		// check if we have an "original" pojo
		var startObj = null;
		var that = this;
		// normally we edit the pojo on ourselves - so result is null
		var result = null;

		// get it from the starting dom element
		if($(start).data("pojo")) {
			startObj = $(start).data("pojo");
		}

		// if we have an object, use this as base and fill the pojo
		if(startObj) {
			$.extend(true, pojo, startObj);
		}

		$(start).find("input,select,textarea,button,.jsobject").each(function(){
			var name = $(this).attr("data-name");
			if(!name) {
				name = $(this).attr("name");
			}

			// empty name - ignore
			if (!name) {
				return;
			}

			// skip grayed (=calculated) or transient fields
			if($(this).hasClass("transient") || $(this).hasClass("grayed")) {
				return;
			}

			// must start with prefix
			if(name.indexOf(prefix + ".") !== 0) {
				return;
			}

			$(this).trigger("validate", true);

			// cut away the prefix
			name = name.substring((prefix+".").length);

			var val = $(this).val();
			if($(this).data().valclass && $(this)[$(this).data().valclass]){
				val = $(this)[$(this).data().valclass]("val");
			} 

			// jsobject use the pojo data directly - ignore the rest
			if($(this).hasClass("jsobject")) {
				val = $(this).data().pojo;
			}
			else {
				// ignore empty values when skipEmpty is set
				if(that.options.skipEmpty && (!val || val === "" || val.trim() === "")) {
					return;
				}

				if($(this).hasClass("emptynull") && (!val || val === ""  || val === "null" || val.trim() === "")) { // nullable fields do not send empty string
					val = null;
				} else if($(this).hasClass("object") || $(this).hasClass("POJO")) {
					if($("option:selected", this).data() && $("option:selected", this).data().pojo) {
						if($("option:selected", this).data().pojo)
							val = $("option:selected", this).data().pojo;
						else if($("option:selected", this).attr("data-obj"))
							val = JSON.parse($("option:selected", this).attr("data-obj"));
					} else {
						val = $(this).data().pojo;
					}
					// object can also have a processor
					if($.isFunction($(this).data().processor)) {
						val = $(this).data().processor(val);
					} else {
						var processor = $(this).attr("data-processor");
						if(processor && that.options.processors[processor]) {
							val = that.options.processors[processor](val);
						}
					}
				} else if($(this).hasClass("blob")) { // file upload blob
					val = $(this).data("blob");
				} else
					// set empty numbers or dates to null
					if(val === "" && ($(this).hasClass("number") || $(this).hasClass("percent") || $(this).hasClass("integer") || $(this).hasClass("dateFilter")|| $(this).hasClass("dateTimeFilter"))) {
						val = null;
					}

				// we might have a value processor on this: this is added by the jsForm.controls
				if($(this).data().processor) {
					val = $(this).data().processor(val);
				}
				else if ($(this).hasClass("number") || $(this).hasClass("integer")) {
					if($(this).hasClass("date") && isNaN(val)) {
						if($.format) {
							var d = $.format.date(val);
							d.setHours(0);
							d.setMinutes(0);
							d.setSeconds(0);
							d.setMilliseconds(0);
							val = d.getTime();
						} else
							val = new Date(val).getTime();
					} else
						val = that._getNumber(val);
					if(isNaN(val)) {
						val = 0;
					}
				}
				else if($(this).attr("type") === "checkbox" || $(this).attr("type") === "CHECKBOX") {

					// a checkbox as an array
					if($(this).hasClass("array")) {
						// the special case: array+checkbox is handled on the actual setting
						val = $(this).val();
						if($(this).attr("data-obj")) {
							val = JSON.parse($(this).attr("data-obj"));
						}
					} else
						val = $(this).is(':checked');
				}
				else if($(this).attr("type") === "radio" || $(this).attr("type") === "RADIO") {
					if(!$(this).is(':checked')) {
						return;
					}
					
					if($(this).hasClass("bool")) {
						val = $(this).val() === "true";
					}
				}
				else if($(this).hasClass("bool")) {
					val = ($(this).val() === "true");
				}
			}
			
			// we got the value - send it to the processor
			if(that.options.dataHandler) {
				val = that.options.dataHandler.serialize(val, $(this), pojo); 
			}
			
			// handle simple collection
			if(name.length < 1) {
				// handle simple collection: we want the val as result
				result = val;
				return false;
			}

			that._setPojoVal(pojo, name, val, $(this));
		});

		// for "selection" collection
		$(start).find(".selectcollection").each(function(){
			var name = $(this).attr("data-field");

			// empty name - ignore
			if (!name) {
				return;
			}

			// skip grayed (=calculated) or transient fields
			if($(this).hasClass("transient")) {
				return;
			}

			// must start with prefix
			if(name.indexOf(prefix + ".") !== 0) {
				return;
			}

			$(this).trigger("validate", true);

			// cut away the prefix
			name = name.substring((prefix+".").length);

			// always an array (reset current data)
			var arrVal = [];

			// see if we go by checkbox or by css class (if both -> class wins)
			var selectedClass = $(this).attr("data-selected");
			var id = $(this).attr("data-id");

			$(this).children().each(function(){
				// check selection
				if(selectedClass) {
					if(!$(this).hasClass(selectedClass))
						return;
				} else {
					if(!$("input[name='"+name+"']", this).prop('checked'))
						return;
				}

				// get the "id"/object
				var cobj = null;
				// no id given - check the value of the checkbox
				if(!id && ! $("input[name='"+name+"']", this).hasClass("obj")) {
					cobj = $("input[name='"+name+"']", this).val();
				} else {
					// get the object
					cobj = $(this).data("obj");
					if(!cobj && $(this).attr("data-obj")) {
						cobj = JSON.parse($(this).attr("data-obj"));
					}
				}

				// no object/data found
				if(!cobj)
					return;

				arrVal.push(cobj);
			});

			that._setPojoVal(pojo, name, arrVal);
		});


		return result;
	};

	/**
	 * helper function to enable tracking on fields
	 * @param ele the element to track
	 */
	JsForm.prototype._enableTracking = function(ele) {
		if(!ele || ele.length === 0) {
			return;
		}
		var that = this;
		if(that.options.trackChanges && !$(ele).data().track) {
			$(ele).data().track = true;
			$(ele).change(function(){
				if($(this).val() !== $(this).data().orig) {
					$(this).addClass(that.options.trackChanges);
				}else {
					$(this).removeClass(that.options.trackChanges);
				}
			});
		}
	};

	/**
	 * search for collections to fill 
	 * @param parent the parentnode
	 * @param data the data
	 * @param prefix the prefix used to find fields
	 * @param idx the index - this is only used for collections
	 * @private
	 */
	JsForm.prototype._fillSelectCollection = function (parent, data, prefix, idx) {
		var that = this;

		var $parent = $(parent);

		// locate all "select collections"
		$parent.find(".selectcollection").each(function() {
			var selectedClass = $(this).attr("data-selected");
			var id = $(this).attr("data-id");
			var fieldname = $(this).attr("data-field");

			// only collections with the correct prefix
			if(!fieldname || fieldname.indexOf(prefix+".") !== 0) {
				return;
			}

			// data for the collection filling
			var colData = null;

			var cname = fieldname;
			// remove the prefix
			if (prefix) {
				cname = cname.substring(prefix.length + 1);
			}
			colData = that._get(data, cname);

			if(!colData || !$.isArray(colData)) {
				colData = [];
			}

			// reset selection
			if(selectedClass) {
				$(this).children("." + selectedClass).removeClass(selectedClass);
				$(this).children().each(function(){
					if($(this).hasClass("jsfselect"))
						return;
					// identify that we already bound
					$(this).addClass("jsfselect");

					$(this).click(function(){
						$(this).toggleClass(selectedClass);
						$(this).trigger("selected");
					});

					// trigger "deselected"
					$(this).trigger("selected");
				});
			}
			
			// remove ALL checkboxes
			$("input[name='"+cname+"']", this).prop('checked', false);

			// now go through each child and apply selection if appropriate
			$(this).children().each(function(){
				// get the "id"/object
				var cid = "";
				// no id given - check the value of the checkbox
				if(!id) {
					cid = $("input[name='"+cname+"']", this).val();
				} else {
					// get the object
					var obj = $(this).data("obj");
					if(!obj && $(this).attr("data-obj")) {
						obj = JSON.parse($(this).attr("data-obj"));
					}
					// avoid exception
					if(!obj)
						return;
					// take the id field of the object
					cid = obj[id];
				}

				if(!cid)
					return;

				for(var i = 0; i < colData.length; i++) {
					var did = colData[i];
					if(id && did)
						did = did[id];

					// found it
					if(cid == did){
						if(selectedClass) {
							$(this).addClass(selectedClass).trigger("selected");
						}
						$("input[name='"+cname+"']", this).prop('checked', true);
						return;
					}
				}


			});

		});
	};

	/**
	 * fill all non-editable values with data.
	 * <ul>
	 *  <li>&lt;span class="field"&gt;prefix.fieldname&lt;/span&gt; -> escapes html (add class=noescape to avoid)
	 *  <li>&lt;div class="field"&gt;prefix.fieldname&lt;/div&gt; -> allows html
	 *  <li>&lt;a class="field" href="prefix.fieldname"&gt;linktest&lt;/a&gt;
	 *  <li>&lt;img class="field" src="prefix.fieldname"/&gt;
	 *  <li>&lt;x class="templatefield" data-attr="href" data-template="some/{{prefix.id}}/{{cur.fieldname}}/whatever"&gt;...&lt;/a&gt;
	 * </ul>
	 * @param parent the root of the subtree
	 * @param data the data
	 * @param prefix the prefix used to find fields
	 * @param idx the index - this is only used for collections
	 * @private
	 */
	JsForm.prototype._fillFieldData = function (parent, data, prefix, idx) {
		var that = this;
		var $parent = $(parent);

		if(prefix.indexOf(".") > 0) {
			prefix = prefix.substring(prefix.indexOf(".")+1);
		}

		// locate all "mustache templates"
		$parent.find(".templatefield").each(function() {
			var attr = $(this).data().attr;
			var mustache = $(this).data().mustache;
			if(!mustache) {
				if(typeof Hogan !== "undefined") {
					mustache = Hogan.compile($(this).data().template.replace(/\[\[/g, "{{").replace(/]]/g, "}}"));
				} else if(typeof Handlebars !== "undefined") {
					mustache = {
						render: Handlebars.compile($(this).data().template.replace(/\[\[/g, "{{").replace(/]]/g, "}}"))
					};
				} else {
					console.error("No mustache renderer found. templating not available (include Handlebars.js or Hogan.js)");
				}
				
				// save for next
				$(this).data().mustache = mustache;
			}
			var params =  {
				data: that.options.data,
				cur: data
			};
			$(this).attr(attr, mustache.render(params));
		});

		// locate all "fields"
		$parent.find(".field").each(function() {
			var name = $(this).data().name;
			if(!name) {
				name = $(this).data().field;
			}
						
			// add optional prefix
			var dataprefix = $(this).attr("data-prefix");
			if(!dataprefix) {
				dataprefix = "";
			}
			// and postfix
			var datapostfix = $(this).attr("data-postfix");
			if(!datapostfix) {
				datapostfix = "";
			}
			
			if(!name) {
				if(this.nodeName.toUpperCase() === 'A') {
					name = $(this).attr("href");
					$(this).attr("href", "#");
				}else if(this.nodeName.toUpperCase() === 'IMG') {
					name = $(this).attr("src");
					if(name.indexOf("#") === 0) {
						name = name.substring(1);
					}
					$(this).attr("src", "#");
				}else {
					name = $(this).text();
				}
				$(this).data("name", name);
				$(this).show();
			}

			if(!prefix || name.indexOf(prefix + ".") >= 0) {
				var cname = name;
				if (prefix) {
					cname = cname.substring(prefix.length + 1);
				}
				var cdata = that._get(data, cname, false, idx);

				if(!cdata && cdata !== 0 && cdata !== false) {
					cdata = "";
				} else if(cdata !== "") {
					if(dataprefix !== "") {
						cdata = dataprefix + cdata;
					}
					if(datapostfix !== "") {
						cdata = cdata + datapostfix;
					}
				}

				// check for currency
				if($(this).hasClass("currency")) {
					if (!cdata)
						cdata = 0;
				}

				// keep the original in the title
				if($(this).hasClass("titleval")) {
					$(this).attr("title", cdata);
				}

				if($(this).hasClass("setObj")) {
					// keep the data object
					$(this).data().pojo = cdata;
					$(this).addClass("POJO");
				} else {
					// we got the value - send it to the processor
					if(that.options.dataHandler) {
						cdata = that.options.dataHandler.deserialize(cdata, $(this), cname, data); 
					}
	
					// format the string
					if($.jsFormControls) {
						cdata = $.jsFormControls.Format.format(this, cdata);
					}
					
					if(this.nodeName.toUpperCase() === 'A') {
						$(this).attr("href", cdata);
					} else if(this.nodeName.toUpperCase() === 'IMG') {
						$(this).attr("src", cdata);
					}
					else if(this.nodeName.toUpperCase() === "DIV" || $(this).hasClass("noescape")){
						$(this).html(cdata);
					} else {
						$(this).text(cdata);
					}
				}
			}
		});
	};
  
	/**
	 * fill a dom subtree with data.
	 * <ul>
	 *  <li>&lt;input name="prefix.fieldname"/&gt;
	 *  <li>&lt;select name="prefix.fieldname"&gt;...
	 *  <li>&lt;input type="checkbox" name="prefix.fieldname"/&gt;
	 *  <li>&lt;textarea name="prefix.fieldname"/&gt;
	 * </ul>
	 * @param parent the root of the subtree
	 * @param data the data
	 * @param prefix the prefix used to find fields
	 * @param idx the index - this is only used for collections
	 * @private
	 */
	JsForm.prototype._fillData = function (parent, data, prefix, idx) {
		var that = this;
		var $parent = $(parent);
		
		if(prefix.indexOf(".") > 0) {
			prefix = prefix.substring(prefix.indexOf(".")+1);
		}
		
		// allow repainting of this subtree
		if(!$parent.data().refresh) {
			$parent.data().refresh = true;
			$parent.on("refresh", function(){
				var curData = $(this).data().pojo;
				if(!curData)
					return;
				that._fillData($(this), curData, prefix, idx);
			});
		}

		$("input,textarea,button", $parent).each(function() {
			var name = $(this).attr("name");
			if(!name) {
				return;
			}
			that._enableTracking(this);

			if(!prefix || name.indexOf(prefix + ".") >= 0) {
				var cname = name;
				if (prefix) {
					cname = cname.substring(prefix.length + 1);
				}

				var cdata = that._get(data, cname, false, idx);
				
				// we got the value - send it to the processor
				if(that.options.dataHandler) {
					cdata = that.options.dataHandler.deserialize(cdata, $(this), cname, data); 
				}

				// ignore file inputs - they have no value
				if($(this).attr("type") == "file") {
					$(this).data().pojo = cdata;
					$(this).addClass("POJO");
					return;
				}

				if ($(this).hasClass("object")) {
					$(this).data().pojo = cdata;
					$(this).addClass("POJO");
					// set the cdata
					cdata = that._renderObject(cdata, $(this).attr("data-display"), $(this).attr("data-render"));
				} else if ($(this).hasClass("jsobject")) {
					$(this).data().pojo = cdata;
					$(this).addClass("POJO");
				} else if($.isPlainObject(cdata)) {
					// for simple arrays - make sure cdata is not an object but an empty string, otherwise add wont work
					if(cname === '') {
						cdata = '';
					} else {
						$(this).data().pojo = cdata;
						$(this).addClass("POJO");
						cdata = that._renderObject(cdata, $(this).attr("data-display"), $(this).attr("data-render"));
					}
				} 


				if($(this).attr("type") === "checkbox") {
					// array in checkbox
					if($(this).hasClass("array")) {
						// checkbox: set if any part of the array matches
						var cbVal = $(this).val();
						var cbId = null;
						if($(this).attr("data-obj")) {
							cbVal = JSON.parse($(this).attr("data-obj"));
						}
						// get the id
						if($(this).attr("data-id")) {
							cbId = $(this).attr("data-id");
							cbVal = cbVal[cbId];
						}

						var found = false;
						if(cdata) {
							$.each(cdata, function(){
								var cid = this;
								if(cbId)
									cid = cid[cbId];
								if(cid == cbVal) {
									found = true;
									return false;
								}
							});
						}
						// select
						$(this).prop("checked", found);
					} else
						$(this).prop("checked", (cdata === true || cdata === "true"));
				} else if($(this).attr("type") === "radio") {
					if($(this).hasClass("bool")) {
						$(this).prop("checked", cdata + "" === $(this).val());
					}
					else {
						$(this).prop("checked", cdata == $(this).val());
					}
				} else {
					if(!cdata && cdata !== 0 && cdata !== false) {
						cdata = "";
					}

					// format the string
					if($.jsFormControls) {
						cdata = $.jsFormControls.Format.format(this, cdata);
					}

					// array handling
					if($(this).hasClass("array")) {
						// fixed numbers
						var num = $(this).attr("data-array");
						if(!num || isNaN(num)) {
							num = null;
						} else
							num = Number(num);
						if(num !== null && cdata && cdata.length > num) {
							$(this).val(cdata[num]);
						} else {
							$(this).val("");
						}
					} else if($(this).data().valclass && $(this)[$(this).data().valclass]){
						if(cdata.toDate)
							$(this)[$(this).data().valclass]("val", cdata.toDate());
						else
							$(this)[$(this).data().valclass]("val", cdata);
					}else 
						$(this).val(cdata);
				}

				if(that.options.trackChanges) {
					$(this).data().orig = $(this).val();
				}

				// make sure fill comes before change to allow setting of values
				$(this).trigger("fill");
				$(this).change();
			}
		});

		$("select", $parent).each(function() {
			var name = $(this).attr("name");
			if(!name) {
				return;
			}

			if(!prefix || name.indexOf(prefix + ".") >= 0) {
				var cname = name;
				if (prefix) {
					cname = cname.substring(prefix.length + 1);
				}

				that._enableTracking(this);

				// remove "old" selected options
				$(this).children("option:selected").prop("selected", false);
				var pk = $(this).attr("data-key");
				if(!pk) {
					pk = "id";
				}

				var value = that._get(data, cname, false, idx);
				
				// we got the value - send it to the processor
				if(that.options.dataHandler) {
					value = that.options.dataHandler.deserialize(value, $(this), cname, data); 
				}

				// try selecting based on the id 
				if (value[pk] || !isNaN(value[pk])) {
					// find out which one to select
					$(this).children("option").each(function(){
						var obj = $(this).data().pojo;
						if(!obj) {
							obj = $(this).data().obj;
						}
						if(obj) {
							if(value[pk] === obj[pk]) {
								$(this).prop("selected", true);
								return false;
							}
						} else {
							// make sure to avoid string issues: use ==
							if($(this).val() == value[pk]) {
								$(this).attr("selected", true);
								return false;
							}
						}
					});
					
					// trigger the change (but dont mark it)
					$(this).change().removeClass("changed");
					return;
				} else if($(this).hasClass("bool")) {
					value = value ? "true" : "false";
				}

				$(this).children("option[value='"+value+"']").prop("selected", true);
				$(this).val(value);
				if(that.options.trackChanges)
					$(this).data().orig = $(this).val();
				// trigger the change (but dont mark it)
				$(this).change().trigger("fill").removeClass("changed");
			}
		});
	};

	/**
	 * ceate a pojo from a form. Takes special data definition classes into account:
	 * <ul>
	 *  <li>number: the content will be transformed into a number (default string</li>
	 *  <li>trueFalse: boolean
	 *  <li>collection: existing collections are replaced if "class=collection" elements exist
	 * </ul> 
	 * @param ignoreInvalid return a pojo, even if fields do not pass client side validation
	 * @return {Object} a new pojo
	 */
	JsForm.prototype.get = function(ignoreInvalid) {
		var that = this;
		var originalPojo = this.options.data;
		var prefix = this.options.prefix;

		// get the pojo
		var pojo = {};
		if(originalPojo && $.isPlainObject(originalPojo)) {
			pojo = $.extend({}, originalPojo); 
		}

		// check for invalid fields
		var invalid = false;

		// go through all form parts
		$.each(this._getForm(), function(){
			// fill the base
			that._createPojoFromInput(this, prefix, pojo);

			if(!that.options.validateHidden) {
				this.find(".invalid").filter(":visible").each(function(){
					console.log("Invalid: " + $(this).attr("name"));
					invalid = true;
					$(this).focus();
					if(!ignoreInvalid) {
						that._debug("Found invalid field: " + $(this).attr("name"));
					}
					return false;
				});
			} else {
				this.find(".invalid").each(function(){
					console.log("Invalid: " + $(this).attr("name"));
					invalid = true;
					$(this).focus();
					return false;
				});
			}

			// get the collection
			if(that._getCollection(this, prefix, pojo, ignoreInvalid)) {
				invalid = true;
			}
		});

		if(!ignoreInvalid && invalid) {
			return null;
		}

		return pojo;
	};

	/**
	 * fill a pojo based on collections
	 * @param form {DOMElement} the base element to start looking for collections
	 * @param prefix {string} the prefix used
	 * @param pojo {object} the object to fill
	 * @param ignoreInvalid {boolean} if true the function will return as soon as an invalid field is found
	 * @return true if the colelction encountered an invalid field
	 */
	JsForm.prototype._getCollection = function(form, prefix, pojo, ignoreInvalid) {
		var that = this;
		// check for invalid fields
		var invalid = false;

		form.find(".collection").each(function() {
			if((!ignoreInvalid && invalid) || $(this).hasClass("transient")) {
				return;
			}

			var fieldname = $(this).attr("data-field");
			// only collections with the correct prefix
			if(!fieldname || fieldname.indexOf(prefix+".") !== 0) {
				return;
			}

			fieldname = fieldname.substring((prefix+".").length);

			var colParent = that._getParent(pojo, fieldname, true);
			// get only the last part
			if(fieldname.indexOf('.') !== -1) {
				fieldname = fieldname.substring(fieldname.lastIndexOf('.') + 1);
			}

			// clear the collection
			colParent[fieldname] = [];

			// go through all direct childs - each one is an element
			$(this).children().each(function(){
				var ele = {}, result;
				result = that._createPojoFromInput($(this), fieldname, ele);
				if(!result) {
					//that._debug("no string result - get subcollection");
					// also collect sub-collections
					that._getCollection($(this), fieldname, ele, ignoreInvalid);
				}

				// check if the pojo is empty
				if(!that._isEmpty(ele) || result) {
					if($(".invalid", this).length > 0) {
						invalid = true;
						if(!ignoreInvalid)
							return false;
					}
					if(!result) {
						colParent[fieldname].push(ele);
					} else
						colParent[fieldname].push(result);
				} else {
					$(".invalid", this).removeClass("invalid");
				}
			});
		});

		return invalid;
	};

	/**
	 * Get the data object used as a base for get().
	 * Note that modifying this directly might result into unwanted results
	 * when working with some functions that rely on this object.
	 * 
	 * @returns the original data object
	 */
	JsForm.prototype.getData = function() {
		// make srue we do have an object to work with
		if(!this.options.data) {
			this.options.data = {};
		}
		return this.options.data;
	};

	/**
	 * allow setting a field to read-only and back
	 * @param field the field to set the mode (editing/view)
	 * @param mode true to 
	 */
	JsForm.prototype.fieldMode = function(field, mode) {
		if(!field)
			return;
		// check if this is already a jquery object, otherwise ocnvert
		if(!field.data) {
			field = $("input[name='"+field + "']", this.element);
		}

		var viewClass = this.options.viewClass;

		if(mode) {
			if (field.closest("span." + viewClass)[0])
				return;

			var val = field.val();
			if (val === "null" || val === null || field.attr("type") === "submit")
				val = "";
			if(field.hasClass("trueFalse")) {
				if(field.is(':checked'))
					val = 'X';
				else
					val = '&#160;';
			}

			// convert \n to brs - escape all other html
			val = val.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
			var thespan = $('<span class="'+viewClass+'">'+val+'</span>');
			if(field.parent().hasClass("ui-wrapper"))
				field.parent().hide().wrap(thespan);
			else
				field.hide().wrap(thespan);
		} else {
			// remove text and then unwrap
			var span = field.closest("span." + viewClass);
			var ele = field.show().detach();
			span.before(ele);
			span.remove();
		}

	};

	/**
	 * uses form element and replaces them with "spans" that contain the actual content.
	 * the original "inputs" are hidden 
	 * @param form the form 
	 * @param enable true: switch inputs with spans, false: switch spans back, undefined: toggle
	 */
	JsForm.prototype.preventEditing = function(prevent) {
		var $this = $(this.element);
		var viewClass = this.options.viewClass;

		if(typeof prevent === "undefined") {
			// get the disable from the form itself 
			prevent = $this.data("disabled")?false:true;
		} else {
			// already in that state
			if(prevent === $this.data("disabled")) {
				return;
			}
		}

		if (prevent)
		{
			$this.find("input, textarea").each(function() {
				if ($(this).closest("span." + viewClass)[0])
					return;
				if($(this).attr("type") == "hidden")
					return;
				var val = $(this).val();
				if (val === "null" || val === null || $(this).attr("type") === "submit")
					val = "";
				if($(this).hasClass("trueFalse")) {
					if($(this).is(':checked'))
						val = 'X';
					else
						val = '&#160;';
				}

				var thespan;
				if($(this).hasClass("noescape")) {
					thespan = $('<div class="'+viewClass+'">'+val+'</div>');
					thespan.html(val);
				} else {
					// convert \n to brs - escape all other html
					val = val.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
					thespan = $('<span class="'+viewClass+'">'+val+'</span>');
				}
				
				if($(this).parent().hasClass("ui-wrapper")) {
					$(this).parent().hide().before(thespan);
				} else {
					$(this).hide().before(thespan);
				}
			});
			// selects are handled slightly different
			$this.find("select").each(function() {
				if ($(this).closest("span."+viewClass)[0])
					return;

				var val = $(this).children(":selected").html();
				if (val === "null" || val === null)
					val = "";

				var thespan = $('<span class="'+viewClass+'">'+val+'</span>');

				// toggle switches work a little different 
				if($(this).hasClass("ui-toggle-switch")) {
					$(this).prev().hide().before(thespan);
				}
				else {
					$(this).hide().before(thespan);
				}
			});
		}
		else
		{
			$this.find("span." + viewClass +",div." + viewClass).each(function() {
				// remove text and then unwrap
				var ele = $(this).next("input,select,textarea,.ui-wrapper,.ui-toggle-switch").show();
				$(this).remove();
			});
		}

		$this.data("disabled", prevent);
	};

	/**
	 * validate a given form
	 * @return true if the form has no invalid fields, false otherwise
	 */
	JsForm.prototype.validate = function() {
		// get the prefix from the form if not given
		var valid = true;

		$.each(this._getForm(), function(){
			// validation
			$(".required,.regexp,.date,.mandatory,.number,.validate,.integer", this).change();
			// check for invalid fields
			if($(".invalid", this).length > 0) {
				valid = false;
			}
		});

		return valid;
	};

	/**
	 * fill a form based on a pojo. 
	 * @param noInput set true to not set any inputs
	 * @private
	 */
	JsForm.prototype._fill = function(noInput) {
		var that = this;
		$(this.element).addClass("POJO");
		$(this.element).data("pojo", this.options.data);

		// handle multiple form parts
		$.each(this._getForm(), function(){
			try {
				that._fillDom(this, noInput);
			} catch (ex) {
				console.log("Exception while filling form", ex);
			}
		});
		
		$(this.element).trigger("filled");
	};

	/**
	 * This is the actual worker function that fills the dom subtree
	 * with data.
	 * @param ele the element to fill
	 * @param noInput skip input fields
	 * @private
	 */
	JsForm.prototype._fillDom = function(ele, noInput) {
		var that = this;
		// dont clear if we only fill the inputs
		if(!noInput) {
			that._clear(ele, that.options.prefix);
		}
		
		// fill read-only fields
		that._fillFieldData(ele, that.options.data, that.options.prefix);

		if(!noInput) {
			// fill base 
			that._fillData(ele, that.options.data, that.options.prefix);
			// fill select-collections
			that._fillSelectCollection(ele, that.options.data, that.options.prefix);
		}
		
		// fill normal collection forms
		that._fillCollection(ele, that.options.data, that.options.prefix, noInput);
		// (re-)evaluate all conditionals
		that._evaluateConditionals(ele, that.options.data);
	};


	/**
	 * @param container the container element
	 * @param data an array containing the the data
	 * @param prefix a prefix for each line of data
	 * @param noInput skip input fields
	 * @private
	 */
	JsForm.prototype._fillCollection = function(container, data, prefix, noInput) {
		var that = this;
		// fill collections
		$(".collection", container).each(function() {
			var container = $(this),
			fieldname = $(this).attr("data-field");
			// only collections with the correct prefix
			if(!data || !fieldname || fieldname.indexOf(prefix+".") !== 0) {
				return;
			}

			// data for the collection filling
			var colData = null;

			var cname = fieldname;
			// remove the prefix
			if (prefix) {
				cname = cname.substring(prefix.length + 1);
			}
			colData = that._get(data, cname);

			if(colData) {
				// fill the collection
				if(noInput) {
					for(var i = 0; i < colData.length; i++) {
						// cut away any prefixes - only the fieldname is used
						if(cname.indexOf('.') !== -1) {
							prefix = cname.substring(cname.lastIndexOf('.')+1);
						}

						var line = $(container.children().get(i));
						var cur = colData[i];
						// only fill read only fields
						that._fillFieldData(line, cur, cname, i+1);
						// fill with data
						that._fillCollection(line, cur, cname, noInput);
					}
				} else {
					that._fillList(container, colData, cname);
				}
			}
		});
	};

	/**
	 * @param container the container element
	 * @param data an array containing the the data
	 * @param prefix a prefix for each line of data
	 * @param lineFunc function(line,cur) - can return false to skip the line
	 * @private
	 */
	JsForm.prototype._fillList = function(container, data, prefix, lineFunc) {
		var tmpl = container.data("template");
		var that = this;

		if(!tmpl) {
			return;
		}

		// clean out previous list
		container.empty();

		// not an array
		if(!$.isArray(data)) {
			return;
		}

		// cut away any prefixes - only the fieldname is used
		if(prefix.indexOf('.') !== -1) {
			prefix = prefix.substring(prefix.lastIndexOf('.')+1);
		}


		// check if we need to sort the array
		if(container.hasClass("sort")) {
			var sortField = container.attr("data-sort");
			if(sortField) {
				switch(container.attr("data-sorttype")) {
				case 'alpha':
					data.sort();
					break;
				case 'alphainsensitiv':
					data.sort(function(a,b){
						a = a[sortField];
						b = b[sortField];
						if(a) a = a.toLowerCase();
						if(b) b = b.toLowerCase();
						if(a<b) 
							return -1;
						if(a>b) 
							return 1;
						return 0;
					});
					break;
				default:
					data.sort(function(a,b){
						return a[sortField] - b[sortField];
					});
				}
				// descending: reverse
				if(container.attr("data-sortdesc")) {
					data.reverse();
				}
			}
		}

		if(!lineFunc) {
			if($.isFunction(prefix)) {
				lineFunc = prefix;
				prefix = null;
			}
		}
		
		for(var i = 0; i < data.length; i++) {
			var cur = data[i];
			var line = tmpl.clone(true);
			// save current line
			line.data().pojo = cur;
			line.addClass("POJO");

			if(lineFunc) {
				if(lineFunc(line, cur) === false) {
					continue;
				}
			}

			that._fillLine(cur, line, prefix, i);

			container.append(line);

			// trigger a callback
			container.trigger("postAddCollection", [line, $(line).data().pojo]);

		}
	};
	

	/**
	 * add controls into a collection entry(i.e. delete)
	 * @param line the new collection 
	 * @private
	 */
	JsForm.prototype._fillLine = function(cur, line, prefix, i) {
		var that = this;
		that._addCollectionControls(line);

		// trigger a callback
		container.trigger("addCollection", [line, cur]);

		if(prefix) {
			$(line).on("refresh", function(){
				// fill read only fields
				that._fillFieldData($(this), $(this).data().pojo, prefix, i+1);
				
				// "fill data"
				that._fillData($(this), $(this).data().pojo, prefix, i+1);
			}).trigger("refresh");
			
			// enable collection controls
			that._initCollection(line, prefix);
			// fill with data
			that._fillCollection(line, cur, prefix);

		}

	};

	/**
	 * add controls into a collection entry(i.e. delete)
	 * @param line the new collection 
	 * @private
	 */
	JsForm.prototype._addCollectionControls = function(line) {
		var that = this;
		var container = $(line).closest(".collection");
		
		// enable controls on the line
		if($.jsFormControls) {
			$(line).jsFormControls();
		}

		// delete the current line
		line.on("delete", function(ev, target){
			// avoid acting on events not meant for me
			if(target && target[0] !== this) {
				return;
			}
			var ele = $(this);
			var pojo = $(ele).data().pojo;
			var base = $(this).closest(".collection");
			ele.detach();
			// trigger a callback
			$(base).trigger("deleteCollection", [ele, pojo]);
		});

		line.on("sortUp", function(ev, target){
			// avoid acting on events not meant for me
			if(target && target[0] !== this) {
				return;
			}
			// check if there is an up
			var ele = $(this);
			var prev = ele.prev(".POJO");
			if(prev.size() === 0) {
				// no previous element - return
				return;
			}
			ele.detach();
			prev.before(ele);
			// reorder (if possible)
			that._reorder(ele);
		});
		line.on("sortDown", function(ev, target){
			// avoid acting on events not meant for me
			if(target && target[0] !== this) {
				return;
			}
			// check if there is a down
			var ele = $(this);
			var next = ele.next(".POJO");
			if(next.size() === 0) {
				// no next element - return
				return;
			}
			ele.detach();
			next.after(ele);
			// reorder (if possible)
			that._reorder(ele);
		});
		
		$(".delete", line).click(function(){
			var ele = $(this).closest(".POJO");
			ele.trigger("delete", [ele]);
		});
		$(".sortUp", line).click(function(){
			var ele = $(this).closest(".POJO");
			ele.trigger("sortUp", [ele]);
		});
		$(".sortDown", line).click(function(){
			var ele = $(this).closest(".POJO");
			ele.trigger("sortDown", [ele]);
		});

		// if collection is sortable: refresh it
		if(container.hasClass("sortable")&& $(container).sortable) {
			container.sortable("refresh");
		}
	};

	/**
	 * Reorder a collection (actually its fields)
	 * @param ele one element of the collection or the collection itself
	 * @private
	 */
	JsForm.prototype._reorder = function(ele) {
		if(!ele.attr("data-sort")) {
			ele = ele.closest(".collection");
		}

		// get the field to use for sorting
		var sortField = $(ele).attr("data-sort");
		if(!sortField || ($(ele).attr("data-sorttype") && $(ele).attr("data-sorttype") !== "number") || 
				($(ele).attr("data-sortdesc") && $(ele).attr("data-sortdesc") !== "false")) {
			return;
		}

		// go through each child and get the pojo
		var prio = 0;
		$.each($(ele).children(), function(){
			var data = $(this).data("pojo");
			// no data yet - add one
			if(!data) {
				data = {};
				$(this).data("pojo", data);
			}

			data[sortField] = prio++;
		});
	};

	/**
	 * render an object based on a string.
	 * Note: comma is a special char and cannot be used!
	 * @param obj the object
	 * @param skin the string to render with (i.e. id, ":", test)
	 * @private
	 */
	JsForm.prototype._renderObject = function(obj, skin, renderer) {
		if(!obj || (!skin && !renderer))
			return "";
		if(renderer) {
			if(this.options.renderer && this.options.renderer[renderer])
				return this.options.renderer[renderer](obj);
			this._debug("Unable to find renderer: " + renderer);
			return "";
		}

		var that = this;
		var ret = "";
		$.each(skin.split(","), function(){
			var val = this.trim();
			if(val.indexOf("'") === 0 || val.indexOf('"') === 0) {
				ret += val.substring(1, val.length - 1);
			} else {
				ret += that._get(obj, val);
			}
		});
		return ret;
	};

	/**
	 * Retrieve a value from a given object by using dot-notation
	 * @param obj the object to start with
	 * @param expr the child to get (dot notation) 
	 * @param create set to true and non-existant levels will be created (always returns non-null)
	 * @param idx only filles when filling collection - can be access using $idx
	 * @private
	 */
	JsForm.prototype._get = function(obj, expr, create, idx) {
		var ret, p, prm = "", i;
		if(typeof expr === "function") {
			return expr(obj); 
		}
		if (!obj) {
			return "";
		}
		// reference the object itself
		if(expr === "")
			return obj;

		// reference to the index
		if(expr === "$idx")
			return idx;

		ret = obj[expr];
		if(!ret) {
			try {
				if(typeof expr === "string") {
					prm = expr.split('.');
				}

				i = prm.length; 
				if(i) {
					ret = obj;
					while(ret && i--) {
						p = prm.shift();
						// create the levels
						if(create && !ret[p]) {
							ret[p] = {};
						}
						ret = ret[p];
					}
				}
			} catch(e) { /* ignore */ }
		}
		if(ret === null || ret === undefined) {
			ret = "";
		}
		// trim the return
		if(ret.trim) {
			return ret.trim();
		}
		return ret;
	};

	/**
	 * Parse a dot notation that includes arrays
	 * http://stackoverflow.com/questions/13355278/javascript-how-to-convert-json-dot-string-into-object-reference
	 * @param obj
	 * @param path a dot notation path to search for.  Use format parent[1].child
	 */
	JsForm.prototype._getValueWithArrays = function(obj, path) {
		if(obj === null) {
			return null;
		}

		path = path.split('.');
		var arrayPattern = /(.*)\[(\d+)\]/;
		for (var i = 1; i < path.length; i++) {
			var match = arrayPattern.exec(path[i]);
			try {
				if (match) {
					obj = obj[match[1]][parseInt(match[2], 10)];
				} else {
					obj = obj[path[i]];
				}
			} catch(e) {
				this._debug(path + " " + e);
			}
		}

		return obj;
	}; 

	/**
	 * get the "parent" object of a given dot-notation. this will not return the actual 
	 * element given in the dot notation but itws parent (i.e.: when using a.b.c -> it will return b)
	 * @param obj the object to start with
	 * @param the child to get (dot notation)
	 * @param create set to true and non-existant levels will be created (always returns non-null)
	 * @private
	 */
	JsForm.prototype._getParent = function(obj, expr, create) {
		if(expr.indexOf('.') === -1)
			return obj;

		expr = expr.substring(0, expr.lastIndexOf('.'));
		return this._get(obj, expr, create);
	};

	/**
	 * helper function to get the number of a value
	 * @param num the string
	 * @returns a number or null
	 * @private
	 */
	JsForm.prototype._getNumber = function(num) {
		if (!num) {
			return null;
		}

		// check if we have jsForm controls (internationalization)
		if($.jsFormControls)
			return $.jsFormControls.Format._getNumber(num);

		// remove thousand seperator...
		if(num.indexOf(",") !== -1 && num.indexOf(".") !== -1)
		{
			num = num.replace(new RegExp(",", 'g'), "");
		}
		else
		if(num.indexOf(",") !== -1 && num.indexOf(".") === -1)
		{
			num = num.replace(new RegExp(",", 'g'), ".");
		}

		return Number(num);
	};

	/**
	 * checks if a variable is empty. This will check array, and whole objects. If a json object
	 * only contains empty "elements" then it is considered as empty.
	 * Empty for a number is 0/-1
	 * Empty for a boolena is false
	 * 
	 * @param pojo the pojo to check
	 * @returns {Boolean} true if it is empty
	 * @private
	 */
	JsForm.prototype._isEmpty = function(pojo) {
		// boolean false, null, undefined
		if(!pojo) {
			return true;
		}

		// array
		if($.isArray(pojo)) {
			// zero length
			if(pojo.length === 0) {
				return true;
			}

			// check each element
			for(var i = 0; i < pojo.length; i++) {
				if(!this._isEmpty()) {
					return false;
				}
			}
			return true;
		}
		// an object
		if($.isPlainObject(pojo)) {
			if($.isEmptyObject(pojo)) {
				return true;
			}

			for(var f in pojo){
				if(!this._isEmpty(pojo[f])) {
					return false;
				}
			}
			return true;
		}

		// a number
		if(!isNaN(pojo)) {
			if (Number(pojo) === 0 || Number(pojo) === -1) {
				return true;
			}
			return false;
		}

		// a string
		return (pojo === "" || pojo === " "); 
	};

	/**
	 * compares two objects. note: empty string or null is the same as not existant
	 * @param a the object to compare
	 * @param b the object to compare with
	 * @param idField if set then used for sub-objects instead of complete compare
	 * @return true if they contain the same content, false otherwise
	 */
	JsForm.prototype._equals = function(a, b, idField)
	{
		// empty arrays
		if(!a && b && b.length && b.length === 0) {
			return true;
		}
		if(!b && a && a.length && a.length === 0) {
			return true;
		}

		if(!a && !b) {
			return true;
		}

		var p = null;
		for(p in a) {
			if(typeof(b[p]) === 'undefined' && a[p] !== null && a[p] !== "" && a[p].length !== 0) {
				// 0 == undefined
				if((a[p] === "0" || a[p] === 0) && !b[p])
					continue;
				return false;
			}

			if (a[p]) {
				switch(typeof(a[p])) {
				case 'object':
					if(idField && a[p][idField]) {
						if (a[p][idField] === b[p][idField])
							continue;
					}
					// go deep
					if (!this._equals(a[p], b[p])) {
						return false;
					}
					break;
				case 'function': // skip functions
					break;
				default:
					// both are "false"
					if(!a[p] && !b[p]) {
						break;
					}

				if((a === true || a === false) && a !== b) {
					return false;
				}
				if(!isNaN(a[p]) || !isNaN(b[p])) {
					if(Math.abs(Number(a[p]) - Number(b[p])) < 0.0000001) {
						break;
					}
					return false;
				}

				if(("" + a[p]).length !== ("" +b[p]).length) {
					return false;
				}

				if (a[p] !== b[p] && Number(a[p]) !== Number(b[p])) {
					return false;
				}
				}
			} else {
				if (b[p]) {
					return false;
				}
			}
		}

		for(p in b) {
			if((!a || typeof(a[p]) === 'undefined') && b[p] !== null && b[p] !== "") {
				return false;
			}
		}

		return true;
	};

	/**
	 * Compares a pojo with the current generated object
	 * @param pojo the pojo to compare with
	 * @return true if any change between formfields and the pojo is found
	 */
	JsForm.prototype.equals = function(pojo, idField) {
		var obj = this.get(false);
		return this._equals(obj, pojo, idField);
	};

	/**
	 * Compares the current form with the last time the form was filled.
	 * 
	 * @returns {Boolean} true if the form has changed since the last fill
	 */
	JsForm.prototype.changed = function() {
		if(!this.options.trackChanges)
			return false;

		var changed = false;
		var that = this;
		$.each(this._getForm(), function(){
			if($("." + that.options.trackChanges, this).size() > 0) {
				changed = true;
				return false;
			}
		});

		return changed;
	};

	/**
	 * Clears all change information to avoid triggering change events
	 */
	JsForm.prototype.clearChanged = function() {
		var that = this;
		// reset changes
		$.each(this._getForm(), function(){
			this.find("." + that.options.trackChanges).removeClass(that.options.trackChanges);
		});
	};
	
	/**
	 * Resets any changes and updates the data based on user input (revert) 
	 */
	JsForm.prototype.resetChanged = function() {
		if(!this.options.trackChanges)
			return false;

		var changed = false;
		var that = this;
		$.each(this._getForm(), function(){
			$("." + that.options.trackChanges, this).each(function(){
				$(this).removeClass(that.options.trackChanges);
				$(this).data().orig = $(this).val();
			});
		});

		return changed;
	};

	JsForm.prototype._equalsCollection = function(form, prefix, pojo) {
		var that = this;
		var differs = false;

		$(".collection", form).each(function() {
			if(differs) {
				return;
			}

			var fieldname = $(this).attr("data-field");
			// only collections with the correct prefix
			if(!fieldname || fieldname.indexOf(prefix+".") !== 0) {
				return;
			}

			fieldname = fieldname.substring((prefix+".").length);
			if(fieldname.length < 1) {
				return;
			}

			var childCounter = 0;
			// go through all direct childs - each one is an element
			$(this).children().each(function(){
				if(differs) {
					return;
				}

				// check if we have more elements
				if(childCounter >= pojo[fieldname].length) {
					differs = true;
					return;
				}

				var ele = pojo[fieldname][childCounter++];
				if(that._pojoDifferFromInput($(this), fieldname, ele)) {
					differs = true;
				}

				if(!that._equalsCollection($(this), fieldname, ele))
					differs = true;
			});

			if(pojo[fieldname] && childCounter < pojo[fieldname].length) {
				differs = true;
			}
		});

		// we want to know if its equals -> return not
		return !differs;
	};

	/**
	 * fill the form with data.
	 * <ul>
	 *  <li>&lt;span class="field"&gt;prefix.fieldname&lt;/span&gt;
	 *  <li>&lt;input name="prefix.fieldname"/&gt;
	 *  <li>&lt;a class="field" href="prefix.fieldname"&gt;linktest&lt;/a&gt;
	 *  <li>&lt;img class="field" src="prefix.fieldname"/&gt;
	 * </ul>
	 * @param data {object} the data
	 */
	JsForm.prototype.fill = function(pojo) {
		// set the new data
		this.options.data = $.extend({}, pojo);
		// fill everything
		this._fill();
	};

	/**
	 * fill the fields with data. Not inputs or selects
	 * <ul>
	 *  <li>&lt;span class="field"&gt;prefix.fieldname&lt;/span&gt;
	 *  <li>&lt;a class="field" href="prefix.fieldname"&gt;linktest&lt;/a&gt;
	 *  <li>&lt;img class="field" src="prefix.fieldname"/&gt;
	 * </ul>
	 * @param data {object} the data
	 */
	JsForm.prototype.fillFields = function(pojo) {
		// set the new data
		this.options.data = $.extend({}, pojo);
		// fill only fields - no inputs
		this._fill(true);
	};


	/**
	 * re-evaluate the conditionals in the form based on the given data.
	 * if no data is given, the form is serialized
	 * @param data {object} the data
	 */
	JsForm.prototype.applyConditions = function(pojo) {
		// set the new data
		if(!pojo)
			pojo = this.get(true);

		// evaluate everything
		this._evaluateConditionals(this.element, pojo);
	};

	/**
	 * reset a form with the last data, overwriting any changes.
	 */
	JsForm.prototype.reset = function() {
		// fill with empty object
		this.fill({});
	};

	/**
	 * Clear all fields in a form
	 */
	JsForm.prototype.clear = function() {
		var that = this;
		$.each(this._getForm(), function(){
			that._clear(this, that.options.prefix);
		});
	};

	/**
	 * destroy the jsform  and its resources.
	 * @private
	 */
	JsForm.prototype.destroy = function( ) {
		return $(this.element).each(function(){
			$(this).removeData('jsForm');

			if($.jsFormControls) {
				// handle multiple form parts
				$(this).jsFormControls("destroy");
			}
		});
	};

	// init and call methods
	$.fn.jsForm = function ( method ) {
		// Method calling logic
		if ( typeof method === 'object' || ! method ) {
			return this.each(function () {
				if (!$(this).data('jsForm')) {
					$(this).data('jsForm', new JsForm( this, method ));
				}
			});
		} else {
			var args = Array.prototype.slice.call( arguments, 1 ),
			jsForm;
			// none found
			if(this.length === 0) {
				return null;
			}
			// only one - return directly
			if(this.length === 1) {
				jsForm = $(this).data('jsForm');
				if (jsForm) {
					if(method.indexOf("_") !== 0 && jsForm[method]) {
						var ret =  jsForm[method].apply(jsForm, args);
						return ret;
					}

					$.error( 'Method ' +  method + ' does not exist on jQuery.jsForm' );
					return false;
				}
			}

			return this.each(function () {
				jsForm = $.data(this, 'jsForm'); 
				if (jsForm) {
					if(method.indexOf("_") !== 0 && jsForm[method]) {
						return jsForm[method].apply(jsForm, args);
					} else {
						$.error( 'Method ' +  method + ' does not exist on jQuery.jsForm' );
						return false;
					}
				}
			});
		}   
	};

	/**
	 * global jsForm function for intialisation
	 */
	$.jsForm = function ( name, initFunc ) {
		var jsForms = JSFORM_MAP[name];
		// initFunc is a function -> initialize
		if($.isFunction(initFunc)) {
			// call init if already initialized
			if(jsForms) {
				$.each(jsForms, function(){
					initFunc(this, $(this.element));
				});
			}

			// remember for future initializations
			JSFORM_INIT_FUNCTIONS[name] = initFunc;
		} else {
			// call init if already initialized
			if(jsForms) {
				var method = initFunc;
				var args = Array.prototype.slice.call( arguments, 2 );
				$.each(portlets, function(){
					this[method].apply(this, args);
				});
			}
		}
	};

})( jQuery, window );

/**
 * jquery.jsForm.controls
 * ----------------------
 * UI Controls and Field validation
 * @version 1.0
 * @class
 * @author Niko Berger
 * @license MIT License GPL
 */
;(function( $, window, undefined ){
	"use strict";
	
	var JSFORM_INIT_FUNCTIONS = {},	// remember initialization functions
		JSFORM_MAP = {};	// remember all forms

	/**
	 * handlebars extension (+simple date format)
	 */
	if(typeof Handlebars !== "undefined") {
		Handlebars.registerHelper("currency", function(data){
			if(!data)
				return $.jsFormControls.Format.currency(0);
			return $.jsFormControls.Format.currency(data);
		});
		Handlebars.registerHelper("dec", function(data){
			if(!data)
				return "";
			return $.jsFormControls.Format.decimal(data);
		});
		Handlebars.registerHelper("percent", function(data){
			if(!data)
				return "0";
			return $.jsFormControls.Format.decimal(data*100);
		});
		Handlebars.registerHelper("date", function(data){
			if(!data)
				return "";
			return $.jsFormControls.Format.date(data);
		});
		Handlebars.registerHelper("time", function(data){
			if(!data)
				return "";
			return $.jsFormControls.Format.time(data);
		});
		Handlebars.registerHelper("datetime", function(data){
			if(!data)
				return "";
			return $.jsFormControls.Format.dateTime(data);
		});
		Handlebars.registerHelper("dateTime", function(data){
			if(!data)
				return "";
			return $.jsFormControls.Format.dateTime(data);
		});
		Handlebars.registerHelper("timespan", function(data){
			if(!data)
				return "";
			return $.jsFormControls.Format.humanTime(data);
		});
		Handlebars.registerHelper("humanTime", function(data){
			if(!data)
				return "";
			return $.jsFormControls.Format.humanTime(data);
		});
		Handlebars.registerHelper("byte", function(data){
			if(!data)
				return "";
			return $.jsFormControls.Format.byte(data);
		});
		Handlebars.registerHelper("integer", function(data){
			if(!data)
				return "";
			return $.jsFormControls.Format.integer(data);
		});
	}
	
	function JsFormControls(element) {
		this.element = element;
		
		// init the dom functionality
		this._domInit();
	}
	
	/**
	 * init the dom. This can be called multiple times.
	 * this will also enable "add", "insert" and "delete" for collections
	 * @private 
	 */
	JsFormControls.prototype._domInit = function() {
		var location = $(this.element);
		// validation
		// check required (this is the first check)
		location.find("input.mandatory,textarea.mandatory").on("keyup", function(){
			// check for "null" as value as well 
			if($(this).val().length > 0 && $(this).val() !== "null") {
				$(this).addClass("valid").removeClass("invalid");
			} else {
				$(this).removeClass("valid").addClass("invalid");
			}
		});
		
		location.find("input.mandatory,textarea.mandatory").on("change", function(){
			if($(this).hasClass("object")) {
				if($(this).data().pojo) {
					$(this).addClass("valid").removeClass("invalid");
				} else {
					$(this).removeClass("valid").addClass("invalid");
				}
				return;
			} 
			// check for "null" as value as well 
			if($(this).val().length > 0 && $(this).val() !== "null") {
				$(this).addClass("valid").removeClass("invalid");
			} else {
				$(this).removeClass("valid").addClass("invalid");
			}
		}).change();

		location.find("select.mandatory").change(function(){
			// check for "null" as value as well 
			if($(this).val() !== null && $(this).val() !== "null" && $(this).val().length > 0) {
				$(this).addClass("valid").removeClass("invalid");
			} else {
				$(this).removeClass("valid").addClass("invalid");
			}
		}).change();
		
		// show datepicker for all inputs
		location.find("input.date").each(function(){
			var dateformat = null;
			var format = $(this).attr("data-format");
			
			if(window.flatpickr) {
				var $this = $(this);
				window.flatpickr($(this)[0], {
					enableTime: false,
					allowInput: true,
					time_24hr: false,
					dateFormat: i18n.flatpickrDate,
					onOpen: [function(a,b,inst){
						var d = new Date();
						if($this.val() === '')
							d = moment($this.val(), i18n.momentDateTime).toDate();
						inst.jumpToDate(new Date());
						inst.setDate(new Date());
					}]
				});
			} else if($(this).jqxDateTimeInput) {
				$(this).data().valclass = "jqxDateTimeInput";
				
				// jqwidget
				if(format)
					$(this).jqxDateTimeInput({formatString: format});
				else {
					// get date format
					
					if(typeof i18n !== "undefined")
						dateformat = i18n.date;
					else if($(document).data().i18n && $(document).data().i18n.date)
						dateformat = $(document).data().i18n.date;

					$(this).jqxDateTimeInput({
						formatString: dateformat.shortDateFormat,
						width: $(this).width() 
						});
				}
				
			}
			else if($(this).datepicker) {
				// get date format
				if(typeof format !== "undefined") {
					dateformat = format;
				} else if(typeof i18n !== "undefined") {
					dateformat = i18n.jqdate;
				}
				
				// jquery ui
				if(dateformat)
					$(this).datepicker({dateFormat: dateformat});
				else
					$(this).datepicker();
			}
		});
			
		// date-time picker
		location.find("input.dateTime").each(function(){
			var dateformat = null;
			var format = $(this).attr("data-format");
			var $this = $(this);
			if(window.flatpickr) {
				window.flatpickr($(this)[0], {
					enableTime: true,
					time_24hr: true,
					allowInput: true,
					dateFormat: i18n.flatpickrDateTime,
					onOpen: [function(a,b,inst){
						if($this.val() === '')
							inst.jumpToDate(new Date());
						else {
							var curDate = moment($this.val(), i18n.momentDateTime);
							inst.jumpToDate(curDate.toDate());
							inst.setDate(curDate.toDate(), true);
						}
					}]
				});
			} else if($this.datetimepicker && $this.hasClass("form-control")) {
				if(format) {
					dateformat = format;
				} else if(typeof i18n !== "undefined") {
					dateformat = i18n.momentDate;
				}
				
				// convert to group
				var id = "DTID_" + $(this).attr("name").replace('.', '_');
				var group = $('<div class="input-group date" data-target-input="nearest"/>');
				group.attr("id", id);
				$this.parent().append(group);
				
				$this.addClass("datetimepicker-input")
					.attr("data-target", "#" + id);
				var addendum = $('<div class="input-group-append" data-toggle="datetimepicker">' +
						'<div class="input-group-text"><i class="fa fa-calendar"></i></div>' + 
						'</div>');
				group.append($this);
				group.append(addendum);
				addendum.attr("data-target", "#" + id);

				// jquery ui
				if(dateformat)
					$(this).datetimepicker({format: "DD.MM.YYYY " + " HH:mm"});
				else {
					$(this).datetimepicker();
				}
			}
			else if($(this).jqxDateTimeInput) {
				$(this).data().valclass = "jqxDateTimeInput";
				var options = {
						showTimeButton:true
				};
				if($(this).attr("data-width")) {
					options.width = Number($(this).attr("data-width"));
				} else {
					options.width = $(this).width();
				}

				// jqwidget
				if(format)
					options.formatString = format;
				else {
					if(typeof i18n !== "undefined")
						dateformat = i18n.date;
					else if($(document).data().i18n && $(document).data().i18n.date)
						dateformat = $(document).data().i18n.date;
					options.formatString = dateformat.shortDateFormat + " HH:mm";
				}
				$(this).jqxDateTimeInput(options);
			}
		});
		
		// show time
		location.find("input.time").each(function(){
			if($(this).clockpicker && $(this).parent().hasClass("clockpicker")) {
				$(this).attr("type", "text");
				$(this).parent().clockpicker({ 
						autoclose: true
					});
			}
			else if($(this).datetimepicker) {
				$(this).datetimepicker();
			}
			else if($(this).jqxDateTimeInput) {
				// jqwidget
				$(this).jqxDateTimeInput({formatString: 'HH:mm', showTimeButton: true, showDateButton:false});
				$(this).data().valclass = "jqxDateTimeInput"; 
			}
		});

		
		// input validation (number)
		var numberRegexp =  new RegExp("^[0-9.,-]+$");
		location.find("input.number").keyup(function(){
			var val = $(this).val();
			if($(this).hasClass("currency") && val)
				val = $.jsFormControls.Format._getNumber(val);
			if(val.length > 0) {
				if($(this).hasClass("autoclean")) {
					$(this).val(val.replace(/[^0-9.,-]/g, ""));
				}
				else {
					if(numberRegexp.test($(this).val())) {
						$(this).addClass("valid").removeClass("invalid");
					} else {
						$(this).removeClass("valid").addClass("invalid");
					}
				}
			}
		}).keyup();
		
		// currency formatting (add decimal)
		location.find("input.currency").each(function(){
			$(this).on("change blur", function(){
				var val = $(this).val();
				if(val.length > 0) {
					$(this).val($.jsFormControls.Format.currency($.jsFormControls.Format._getNumber(val)));
				}			
			});

			$(this).focus(function(){
				var val = $(this).val();
				if(val.length > 0) {
					$(this).val($.jsFormControls.Format._getNumber(val));
				}
				$(this).select();
			});
		});

		location.find("input.percent").change(function(){
			var val = $(this).val();
			if(val.length > 0) {
				$(this).val($.jsFormControls.Format.decimal($.jsFormControls.Format._getNumber(val)));
			}			

			$(this).focus(function(){
				var val = $(this).val();
				if(val.length > 0) {
					$(this).val($.jsFormControls.Format._getNumber(val));
				}
				$(this).select();
			});
		});


		// decimal formatting (add decimal)
		location.find("input.decimal").change(function(){
			var val = $(this).val();
			if(val.length > 0) {
				$(this).val($.jsFormControls.Format.decimal($.jsFormControls.Format._getNumber(val)));
			}			
		});

		// variable unit
		location.find("input.vunit").change(function(){
			var val = $(this).val();
			if(val.length > 0) {
				// save the actual data
				val = $.jsFormControls.Format._getNumber(val);
				$(this).data().val = val;
				$(this).val($.jsFormControls.Format.vunit(val, $(this).attr("data-unit")));
			}			
		});

		var integerRegexp = new RegExp("^[0-9]+$");
		location.find("input.integer").keyup(function(){
			var val = $(this).val();
			if(val.length > 0) {
				if($(this).hasClass("autoclean")) {
					$(this).val(val.replace(/[^0-9]/g, ""));
				}
				else {
					if(integerRegexp.test($(this).val())) {
						$(this).addClass("valid").removeClass("invalid");
					} else {
						$(this).removeClass("valid").addClass("invalid");
					}
				}
			}
		}).keyup();

		// regular expression
		location.find("input.regexp").each(function(){
			$(this).keyup(function(){
				if($(this).hasClass("autoclean")) {
					$(this).data("regexp", new RegExp($(this).attr("data-regexp"), 'g'));
				}
				else {
					$(this).data("regexp", new RegExp($(this).attr("data-regexp")));
				}

				var val = $(this).val();
				if(val.length > 0) {
					var regexp = $(this).data("regexp");
					if($(this).hasClass("autoclean")) {
						$(this).val(val.replace(regexp, ""));
					}
					else {
						if(regexp.test($(this).val())) {
							$(this).addClass("valid").removeClass("invalid");
						} else {
							$(this).removeClass("valid").addClass("invalid");
						}
					}
				} else {
					// if not mandatory: nothing is valid
					if(!$(this).hasClass("mandatory")) {
						$(this).removeClass("invalid").addClass("valid");
					}
				}
			}).keyup();
			$(this).change(function(){
				$(this).keyup();
			});
		});
		
		/* rotatestate stontrol */
		location.find("input.rotatestate").each(function(){
			var states = $(this).attr("data-state-values");
			var defaultClass = $(this).attr("data-state-class");
			// no need to continue if there are no states
			if(!states) {
				return;
			}
			
			try {
				states = JSON.parse(states);
			} catch (ex) {
				// do not need to continue if we cannot parse the states
				return;
			}
			
			var stateControl = $("<span></span>");
			if($(this).attr("title")) {
				stateControl.attr("title", $(this).attr("title"));
			}
			if($(this).attr("data-state-style")) {
				stateControl.attr("style", $(this).attr("data-state-style"));
			}
			stateControl.data("states", states);
			stateControl.data("control", this);
			stateControl.data("activeState", null);
			$(this).data("control", stateControl);
			if(defaultClass) {
				stateControl.addClass(defaultClass);
			}
			
			// click on the control starts rotating
			stateControl.click(function(){
				var cState = $(this).data().activeState;
				var cStates = $(this).data().states;
				var control = $(this).data().control;
				var newState = null;

				if(cState !== null) {
					// go to the 'next' state
					for(var i = 0; i < cStates.length; i++) {
						if(cStates[i].value === cState.value) {
							// last element
							if(i === cStates.length - 1) {
								newState = cStates[0];
							} else {
								newState = cStates[i+1];
							}
							break;
						}
					}
				} else {
					// no state yet - set the first entry as state
					newState = cStates[0];
				}
				
				$(control).attr("value", newState.value);
				// trigger change
				$(control).change();
			});
			
			// make sure to update state if the value is changed
			$(this).change(function(){
				var control = $($(this).data().control);
				var cState = control.data().activeState;
				var cStates = control.data().states;
				
				if(cState !== null) {
					// remove "old state"
					control.removeClass(cState['class']);
				}
				
				// add new State
				var val = $(this).val();
				$.each(cStates, function(){
					if(this.value === val) {
						control.data().activeState = this;
						if(this.title) {
							control.attr("title", this.title);
						}
						control.addClass(this['class']);
						return false;
					}
				});
			});
			
			// trigger initial state
			$(this).change();
			$(this).after(stateControl);
			$(this).hide();
		});		
	};
		

	/**
	 * validate a given form
	 * @return true if the form has no invalid fields, false otherwise
	 */
	JsFormControls.prototype.validate = function() {
		// validation
		$(".required,.regexp,.date,.mandatory,.number,.validate", this.element).change();
		
		// check for invalid fields
		if($(".invalid", this.element).length > 0) {
			return false;
		}
		
		return true;
	};
	
	/**
	 * destroy the jsformcontrols and its resources.
	 * @private
	 */
	JsFormControls.prototype.destroy = function( ) {
		return $(this.element).each(function(){
			$(this).removeData('jsFormControls');
		});
	};


	// init and call methods
	$.fn.jsFormControls = function ( method ) {
		// Method calling logic
		if ( typeof method === 'object' || ! method ) {
			return this.each(function () {
				if (!$(this).data('jsFormControls')) {
					$(this).data('jsFormControls', new JsFormControls( this, method ));
				}
			});
		} else {
			var args = Array.prototype.slice.call( arguments, 1 );
			
			// only one - return directly
			if(this.length == 1) {
				var jsFormControls = $(this).data('jsFormControls'); 
				if (jsFormControls) {
					if(method.indexOf("_") !== 0 && jsFormControls[method]) {
						var ret =  jsFormControls[method].apply(jsFormControls, args);
						return ret;
					}

					$.error( 'Method ' +  method + ' does not exist on jQuery.jsFormControls' );
					return false;
				}
			}
			
			return this.each(function () {
				var jsFormControls = $.data(this, 'jsFormControls'); 
				if (jsFormControls) {
					if(method.indexOf("_") !== 0 && jsFormControls[method]) {
						return jsFormControls[method].apply(jsFormControls, args);
					} else {
						$.error( 'Method ' +  method + ' does not exist on jQuery.jsFormControls' );
						return false;
					}
				}
			});
		}   
	};
	
	/**
	 * global jsForm function for intialization
	 */
	$.jsFormControls = function ( name, initFunc ) {
		var jsForms;
		// initFunc is a function -> initialize
		if($.isFunction(initFunc)) {
			// call init if already initialized
			jsForms = JSFORM_MAP[name];
			if(jsForms) {
				$.each(jsForms, function(){
					initFunc(this, $(this.element));
				});
			}
			
			// remember for future initializations
			JSFORM_INIT_FUNCTIONS[name] = initFunc;
		} else {
			// call init if already initialized
			jsForms = JSFORM_MAP[name];
			if(jsForms) {
				var method = initFunc;
				var args = Array.prototype.slice.call( arguments, 2 );
				$.each(portlets, function(){
					this[method].apply(this, args);
				});
			}
		}
	};
	
	$.jsFormControls.Format = {
			/**
			 * format a string based on the classes in a dom element.
			 * This will also set a proccessor to "revert" the data
			 */
			format: function(ele, cdata) {
				if($(ele).hasClass("dateTime") || $(ele).hasClass("datetime")) {
					if(isNaN(cdata))
						return cdata;
					return $.jsFormControls.Format.dateTime(cdata);
				}  else if($(ele).hasClass("date")) {
					if(isNaN(cdata))
						return cdata;
					return $.jsFormControls.Format.date(cdata);
				}  else if($(ele).hasClass("time")) {
					if(isNaN(cdata))
						return cdata;
					return $.jsFormControls.Format.time(cdata);
				} else if($(ele).hasClass("currency")) {
					return $.jsFormControls.Format.currency(cdata);
				} else if($(ele).hasClass("byte")) {
					if(isNaN(cdata))
						return cdata;
					return $.jsFormControls.Format.byte(cdata);
				} else if($(ele).hasClass("decimal")) {
					$(ele).data().processor = $.jsFormControls.Format.getDecimal;
					return $.jsFormControls.Format.decimal(cdata);
				} else if($(ele).hasClass("vunit")) {
					// save the actual data
					$(this).data().val = cdata;
					$(ele).data().processor = $.jsFormControls.Format.getVunit;
					return $.jsFormControls.Format.vunit(cdata, $(ele).attr("data-unit"));
				} else if($(ele).hasClass("percent")) {
					$(ele).data().processor = $.jsFormControls.Format.getPercent;
					return $.jsFormControls.Format.percent(cdata);
				} else if($(ele).hasClass("humantime")) {
					$(ele).data().processor = $.jsFormControls.Format.getHumanTime;
					return $.jsFormControls.Format.humanTime(cdata);
				} else if($(ele).hasClass("timespan")) {
					return $.jsFormControls.Format.timespan(cdata);
				}
				
				return cdata;
			},
			
			/**
			 * internal function that tries to identify where the value is.
			 * This is necessary to support direct call, jqGrid and slickGrid
			 * @param row
			 * @param cell
			 * @param value
			 * @param columnDef
			 * @param dataContext
			 * @private
			 */
			_getValue: function(row, cell, value, columnDef, dataContext) {
				// if value is undefined: this is probably a direct call
				if(typeof cell === "undefined" && typeof value === "undefined") {
					return row;
				}
				
				// check for slickGrid: row/cell/value  
				if(!isNaN(row) && typeof cell !== "undefined" && typeof value !== "undefined") {
					return value;
				}
			},
			
			/**
			 * format boolean into an ui-icon 
			 * @param value true or false
			 * @returns the ui-icon span
			 */
			checkBox: function(row, cell, value, columnDef, dataContext) {
				value = $.jsFormControls.Format._getValue(row, cell, value, columnDef);
				
				if(value) {
					return '<span class="ui-icon ui-icon-check">&nbsp;</span>';
				} else {
					return '<span class="ui-icon ui-icon-close">&nbsp;</span>';
				}
				
				return value;
			}, 
			

			/**
			 * take a string and convert it into a number
			 * @private
			 */
			_getNumber: function(num) {
				if (!num) {
					return null;
				}
				
				// default number format
				var numberformat = {
					format: "#,##0.###",
					groupingSeparator: ",",
					decimalSeparator: "."
				};
				var pre = null, post = null;
				if(typeof i18n !== "undefined" && i18n.number) {
					numberformat = i18n.number;
					if(i18n.currency) {
						pre = i18n.currency.prefix;
						post = i18n.currency.suffix;
					}
				}
				else if($(document).data().i18n && $(document).data().i18n.number) {
					numberformat = $(document).data().i18n.number;
					if($(document).data().i18n.currency) {
						pre = $(document).data().i18n.currency.prefix;
						post = $(document).data().i18n.currency.suffix;
					}
				}
				
				// make sure num is a string
				num = "" + num;
				
				// check for currency pre/postfix
				if(pre && pre.length > 0){
					if(num.indexOf(pre) === 0)
						num = num.substring(pre.length);
				}
				if(post && post.length > 0){
					if(num.indexOf(post) > 0)
						num = num.substring(0, num.length - post.length);
				}
				
				num = $.trim(num);
				// first check: only grouping and 2 positions afterwards
				var gs = num.indexOf(numberformat.groupingSeparator); 
				
				// get rid of the grouping seperator (if any exist)
				if(gs !== -1) {
					if(gs >= num.length - 3) {
						console.log("gs looks like decimal: ");						
						if(numberformat.groupingSeparator !== ".")
							num = num.replace(new RegExp(numberformat.groupingSeparator, 'g'), ".");
					} else {
						num = num.replace(new RegExp("\\" +numberformat.groupingSeparator, 'g'), "");
					}
				}
				// now convert the decimal seperator into a "real" decimal
				if(numberformat.decimalSeparator !== '.' && num.indexOf(numberformat.decimalSeparator) !== -1) {
					if(numberformat.decimalSeparator !== ".")
						num = num.replace(new RegExp(numberformat.decimalSeparator, 'g'), ".");
				}
				return Number(num);
			},


			/**
			 * @private
			 */
			_pad: function(val) {
				var o = (val < 10) ? "0" : "";
				o += val;
				return o;
			},
			
			/**
			 * use moment.js to parse a datestring.
			 * this will use:
			 * - predefined i18n formats (strict mode)
			 * - default momentjs (non-strict)
			 * 
			 */
			asMoment: function(value) {
				// try date
				if(typeof moment === "undefined") {
					return new Date(value);
				}
				
				var dformat = moment().toMomentFormatString(i18n.date.format);
				var tformat = moment().toMomentFormatString(i18n.date.timeFormat);
				var formats = [dformat + " " + tformat, dformat, tformat];
				
				var m = null;
				$.each(formats, function(){
					if(m)
						return false;
					var cur = moment(value, this, true);
					if(cur.isValid()) {
						m = cur;
						return false;
					}
				});
				
				if(!m) {
					m = moment(value);
				}
				return m;
			},

			asNumber: function(value) {
				return $.jsFormControls.Format._getNumber(value);
			},
			/**
			 * convert a number to a byte
			 */
			byte: function(bytes) {
				if (bytes === "" || !bytes || isNaN(bytes)) {
					return bytes;
				}
				
				var unit = 1024;
				if (bytes < unit) return bytes + " B";
				var exp = Math.floor(Math.log(bytes) / Math.log(unit));
				var pre = "KMGTPE".charAt(exp-1) + "B";
				return Math.round(bytes*10 / Math.pow(unit, exp))/10 + pre;
			},

			/**
			 * variable unit. this works by prefixing k(kilo) m(mega) g(giga) t(tera)
			 */
			vunit: function(value, unit) {
				if (value === "" || !value || isNaN(value)) {
					return value;
				}
				
				var neg = value < 0;
				if(neg)
					value *= -1; 
					
				if(value < 1000) {
					return (neg?'-':'') + $.jsFormControls.Format.decimal(value) + ' ' + unit;
				}
				var un = 1000;
				var exp = Math.floor(Math.log(value) / Math.log(un));
				var pre = "kmgtpe".charAt(exp-1) + unit;
				return (neg?'-':'') + $.jsFormControls.Format.decimal(Math.round(value*100 / Math.pow(un, exp))/100) + ' ' + pre;
			},
			
			/**
			 * @private
			 */
			decimal: function(num) {
				if (num === "" || !num || isNaN(num)) {
					return num;
				}
				
				// default number format
				var numberformat = {
					format: "#,##0.###",
					groupingSeparator: ",",
					decimalSeparator: "."
				};

				if(typeof i18n !== "undefined" && i18n.number)
					numberformat = i18n.number;
				else if($(document).data().i18n && $(document).data().i18n.number)
					numberformat = $(document).data().i18n.number;

				var comma = 0;
				if (Math.abs(num - Math.floor(num)) > 0.001) {
					comma = 2;
				}
				// convert to a nice number for display
				var n = num, 
					c = isNaN(c = Math.abs(comma)) ? 2 : comma, 
					d = numberformat.decimalSeparator, // decimal d == undefined ? "," : d, 
					t = numberformat.groupingSeparator, // thousand: t == undefined ? "." : t, 
					i = parseInt(n = Math.abs( +n || 0).toFixed(c), 10) + "", 
					j = (j = i.length) > 3 ? j % 3 : 0;
				return (num<0 ? "-" : "") + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
			},
			
			/**
			 * @private
			 */
			integer: function(num) {
				if (num === "" || !num || isNaN(num)) {
					return num;
				}
				
				// default number format
				var numberformat = {
					format: "#,##0.###",
					groupingSeparator: ",",
					decimalSeparator: "."
				};

				if(typeof i18n !== "undefined" && i18n.number)
					numberformat = i18n.number;
				else if($(document).data().i18n && $(document).data().i18n.number)
					numberformat = $(document).data().i18n.number;

				var comma = 0;
				if (Math.abs(num - Math.floor(num)) > 0.001) {
					comma = 2;
				}
				// convert to a nice number for display
				var n = num, 
					c = 0, 
					d = numberformat.decimalSeparator, // decimal d == undefined ? "," : d, 
					t = numberformat.groupingSeparator, // thousand: t == undefined ? "." : t, 
					i = parseInt(n = Math.abs( +n || 0).toFixed(c), 10) + "", 
					j = (j = i.length) > 3 ? j % 3 : 0;
				return (num<0 ? "-" : "") + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
			},
			
			getDecimal: function(val) {
				if (num === "") {
					return 0;
				}
				
				return Number(val);
				
			},

			getVunit: function(val) {
				if (num === "") {
					return 0;
				}
				
				return Number(val);
			},

			percent: function(num) {
				if (num === "" || !num || isNaN(num)) {
					return num;
				}
				
				return $.jsFormControls.Format.decimal(num*100);
			},

			getPercent: function(val) {
				if (val === "") {
					return 0;
				}
				
				if(val.indexOf("%") !== -1)
					val = val.substring(0, val.length-1);
				
				return Number(val) / 100;
			},

			/**
			 * @private
			 */
			currency: function(row, cell, value, columnDef, dataContext) {
				value = $.jsFormControls.Format._getValue(row, cell, value, columnDef);
				
				if(!value) {
					if(cell) {
						return "&#160;";
					}
					value = 0;
				}
				
				var num =  $.jsFormControls.Format.decimal(value);
				// check for currency
				var pre = null, post = null;
				if(typeof i18n !== "undefined") {
					if(i18n.currency) {
						pre = i18n.currency.prefix;
						post = i18n.currency.suffix;
					}
				}
				else if($(document).data().i18n && $(document).data().i18n.number) {
					if($(document).data().i18n.currency) {
						pre = $(document).data().i18n.currency.prefix;
						post = $(document).data().i18n.currency.suffix;
					}
				}
				if(pre)
					num = pre + num;
				if(post)
					num = num + post;
				return num;
			},

			/**
			 * @private
			 */
			dateTime: function(row, cell, value, columnDef, dataContext) {
				value = $.jsFormControls.Format._getValue(row, cell, value, columnDef);

				if(!value) {
					if(cell) {
						return "&#160;";
					}
					return "";
				}
				
				return (this.date(value) + " " + this.time(value));
			},

			/**
			 * @private
			 */
			date: function(row, cell, value, columnDef, dataContext) {
				value = $.jsFormControls.Format._getValue(row, cell, value, columnDef);
				if(!value || value === "") {
					if(cell) {
						return "&#160;";
					}
					return "";
				}
				
				if(isNaN(value))
					return value;
				
				var d = new Date();
				d.setTime(value);
				var year = d.getYear();
				if(year < 1900) {
					year += 1900;
				}
				
				// get date format
				var dateformat = null;
				
				if(typeof i18n !== "undefined")
					dateformat = i18n.date;
				else if($(document).data().i18n && $(document).data().i18n.date)
					dateformat = $(document).data().i18n.date;

				

				if($.format) {
					return $.format.date(d, dateformat.shortDateFormat);
				} else
					return this._pad(d.getDate()) + "." + this._pad((d.getMonth()+1)) + "." + this._pad(year);
			},

			/**
			 * @private
			 */
			time: function(row, cell, value, columnDef, dataContext) {
				value = $.jsFormControls.Format._getValue(row, cell, value, columnDef);
				if(!value || value === "") {
					if(cell) {
						return "&#160;";
					}
					return "";
				}
				if(isNaN(value))
					return value;
				var d = new Date();
				d.setTime(value);
				
				var timeFormat = "HH:mm";
				if(typeof i18n !== "undefined") {
					if(i18n.timeFormat)
						timeFormat = i18n.timeFormat;
					else if (i18n.date && i18n.date.timeFormat)
						timeFormat = i18n.date.timeFormat;
				} else if($(document).data().i18n && typeof $(document).data().i18n.timeFormat !== "undefined")
					timeFormat = $(document).data().i18n.timeFormat;
				
				if($.format)
					return $.format.date(d, timeFormat);
				else
					return this._pad(d.getHours()) + ":" + this._pad(d.getMinutes()); //  + ":" + pad(d.getSeconds()); don't need seconds
			},

			/**
			 * 
			 * @param value a string value to format
			 * @param allowms true to allow komma (i.e. 00.00)
			 * @return something in the form of 00:00.00
			 * @private
			 */
			timespan: function(row, cell, value, columnDef, dataContext) {
				value = $.jsFormControls.Format._getValue(row, cell, value, columnDef);
				
				if(!value)
					value = "0";

				var tokens = value.split(":");
				var allowkomma = false;
				// check each token
				for(var i=0; i<tokens.length; i++) {
					var nt = Number(tokens[i]);
					if(!nt || nt === 'NaN') {
						nt = 0;
					}
					tokens[i] = this._pad(nt);
				}
				
				if(tokens.length <= 0) {
					return "0:00";
				}

				if(tokens.length == 1) {
					return "0:" + this._pad(allowkomma ? tokens[0] : Math.floor(tokens[0]));
				}
				
				if(tokens.length == 2) {
					return allowkomma ? tokens[0] : Math.floor(tokens[0]) + ":" + this._pad(allowkomma ? tokens[1] : Math.floor(tokens[1]));
				}
				
				return allowkomma ? tokens[0] : Math.floor(tokens[0]) + ":" + this._pad(allowkomma ? tokens[1] : Math.floor(tokens[1])) + ":" + pad(allowkomma ? tokens[2] : Math.floor(tokens[2]));
			},
			
			/**
			 * Formats a time to "human"
			 * @param value the time in milliseconds
			 * @returns the time for display in human readable
			 */
			humanTime: function(row, cell, value, columnDef, dataContext) {
				value = $.jsFormControls.Format._getValue(row, cell, value, columnDef);
				
				
				if (isNaN(value)) {
					if(!value || value.length === 0) {
						return "-";
					}
					return value;
				}
				
				var h = Math.floor(value/3600000);
				value -= h * 3600000;
				var m = Math.floor(value/60000);
				value -= m * 60000;
				var s = Math.floor(value/1000);
				value -= s * 1000;
				
				var out = "";
				if (h > 0) {
					out += h + "h ";
					// ignore seconds and milliseconds if we have hours
					s = 0;
					value = 0;
				}
				if (m > 0) {
					out += m + "m ";
					// ignore milliseconds
					value = 0;
				}
				if (s > 0) {
					out += s + "s ";
					value = 0;
				}
				
				if (value > 0) {
					out += value + "ms";
				}
				// trim output
				return out.trim();
			},
			
			/**
			 * convert a string with a time in human format back to a long.
			 * This works for any combination of
			 * Xh Xm xs xms 
			 * 
			 * @param val the value to convert
			 */
			getHumanTime: function(val) {
				if(!val || val === "")
					return 0;
				
				// go through val
				var result = 0;
				var num = "";
				var tu = "";
				
				var convert = function(){
					if(num === "") {
						return;
					}
					
					var curNum = Number(num);
					
					switch(tu) {
					case "ms":
					case "mill":
						result += curNum; break;
					case "s":
					case "secs":
						result += curNum * 1000; break;
					case "":
					case "m":
					case "min":
					case "minute":
						result += curNum * 60000; break;
					case "h":
					case "hour":
						result += curNum * 3600000; break;
					case "d":
					case "day":
					case "days":
						result += curNum * 24 * 3600000; break;
					
					}
					// reset
					tu = "";
					num = "";
				};
				
				for(var i = 0; i < val.length; i++) {
					var c = val.charAt(i);
					switch(c) {
					case '0':
					case '1':
					case '2':
					case '3':
					case '4':
					case '5':
					case '6':
					case '7':
					case '8':
					case '9':
						if(tu !== "") {
							// convert the old number
							convert();
						}
						num += c;
						break;
					case 'm':
					case 'i':
					case 'n':
					case 's':
					case 'h':
					case 'o':
					case 'u':
					case 'r':
					case 'a':
					case 'e':
					case 'c':
					case 'y':
					case 'd': tu += c; break;
					default:
						// ignore
					}
				}
				
				// one more convert - just in case we missed something
				convert();
				return result;
			}
	};
})( jQuery, window );


/**
 * @returns the trimmed string
 */
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "");
};

/* check start of a string */
String.prototype.startsWith = function(str) {
	if((this === null) || (this.length <= 0))
		return false;
	if((str === null) || (str == "null") || (str.length <= 0))
		return false;
	if(this.substr(0, str.length) == str)
		return true;
	return false;
};

/* check start of a string */
String.prototype.startsWithIgnoreCase = function(str) {
	if((this === null) || (this.length <= 0))
		return false;
	if((str === null) || (str == "null") || (str.length <= 0))
		return false;
	if(this.substr(0, str.length).toLowerCase() == str.toLowerCase())
		return true;
	return false;
};

/* check end of a string */
String.prototype.endsWith = function(str) {
	if((this === null) || (this.length <= 0))
		return false;
	if((str === null) || (str == "null") || (str.length <= 0) || (str.length > this.length))
		return false;
	if(this.substr(this.length - str.length) == str)
		return true;
	return false;
};
