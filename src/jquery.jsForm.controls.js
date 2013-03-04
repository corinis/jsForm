/**
 * jquery.jsForm.controls
 * ----------------------
 * UI Controls and Field validation
 * @version 1.0
 * @class
 * @author Niko Berger
 * @license MIT License GPL
 */
"use strict";

;(function( $, window, undefined ){
	var DATE_FORMAT = "dd.MM.yyyy",
	TIME_FORMAT = "hh:mm",
	DATETIME_FORMAT = "dd.MM.yyyy hh:mm",
	JSFORM_INIT_FUNCTIONS = {},	// remember initialization functions
	JSFORM_MAP = {};	// remember all forms

	/**
	 * handlebars extension (+simple date format)
	 */
	if(typeof Handlebars !== "undefined" && typeof $.simpledateformat !== "undefined") {
		Handlebars.registerHelper("date", function(data){
			return $.simpledateformat.format(data, DATE_FORMAT);
		});
		Handlebars.registerHelper("time", function(data){
			return $.simpledateformat.format(data, TIME_FORMAT);
		});
		Handlebars.registerHelper("datetime", function(data){
			return $.simpledateformat.format(data, DATETIME_FORMAT);
		});
		Handlebars.registerHelper("timespan", function(data){
			return AjaxForm.format.humanTime(data);
		});
	}
	
	JsFormControls = function(element) {
		var $this = $(element);
		this.element = element;
		// init the dom funcitonality
		this._domInit();
	}
	
	/**
	 * init the dom. This can be called multiple times.
	 * this will also enable "add", "insert" and "delete" for collections
	 * @private 
	 */
	JsFormControls.prototype._domInit = function() {
		var form = $(this.element);
		var that = this;
		
		// validation
		// check required (this is the first check)
		$("input.mandatory,textarea.mandatory", location).keyup(function(){
			if($(this).val().length > 0) {
				$(this).addClass("valid").removeClass("invalid");
			} else {
				$(this).removeClass("valid").addClass("invalid");
			}
		});

		
		// show datepicker for all inputs
		$("input.date", location).each(function(){
			var format = $(this).attr("data-format");
			if(!format) {
				format = "dd.mm.yy";
			}
			// only if jquery ui is available
			if($(this).datepicker) {
				$(this).datepicker({
					dateFormat: format
				});
			}
		});
			
		
		// input validation (number)
		var numberRegexp =  new RegExp("^[0-9]+$");
		$("input.number", location).keyup(function(){
			var val = $(this).val();
			if(val.length > 0) {
				if($(this).hasClass("autoclean")) {
					$(this).val(val.replace(/[^0-9]/g, ""));
				}
				else {
					if(numberRegexp.test($(this).val())) {
						$(this).addClass("valid").removeClass("invalid");
					} else {
						$(this).removeClass("valid").addClass("invalid");
					}
				}
			}
		});
		
		// regular expression
		$("input.regexp", location).each(function(){
			if($(this).hasClass("autoclean")) {
				$(this).data("regexp", new RegExp($(this).attr("data-regexp"), "g"));
			}
			else {
				$(this).data("regexp", new RegExp($(this).attr("data-regexp")));
			}
			
			$(this).keyup(function(){
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
				}
			});
			
		});
		
		/* rotatestate stontrol */
		$("input.rotatestate", location).each(function(){
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

				if(cState != null) {
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
				
				if(cState != null) {
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
});
		

	/**
	 * validate a given form
	 * @return true if the form has no invalid fields, false otherwise
	 */
	JsFormControls.prototype.validate = function() {
		// get the prefix from the form if not given
		var prefix = this.options.prefix;
		
		// validation
		$(".required,.regexp,.date,.mandatory,.number,.validate", this.element).change();
		
		// check for invalid fields
		if($(".invalid", this.element).length > 0) {
			return false;
		}
		
		return true;
	};
	
	    
    /**
     * global jsForm function for intialisation
     */
    $.jsFormControls = function ( name, initFunc ) {
    	// initFunc is a function -> initialize
    	if($.isFunction(initFunc)) {
	    	// call init if already initialized
	    	var jsForms = PORTLET_MAP[name];
	    	if(jsForms) {
	    		$.each(jsForms, function(){
	    			initFunc(this, $(this.element));
	    		});
	    	}
	    	
	    	// remember for future initializations
	    	JSFORM_INIT_FUNCTIONS[name] = initFunc;
    	} else {
	    	// call init if already initialized
	    	var jsForms = JSFORM_MAP[name];
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
    		 * format boolean into an ui-icon 
    		 * @param value true or false
    		 * @returns the ui-icon span
    		 */
    		checkBox: function(row, cell, value, columnDef, dataContext) {
    			// cleanup parameters (direct call vs. slickgrid)
    			if(typeof value === "undefined") {
    				value = row;
    				row = null;
    			}
    			
    			if(value) {
    				return '<span class="ui-icon ui-icon-check">&nbsp;</span>';
    			} else {
    				return '<span class="ui-icon ui-icon-close">&nbsp;</span>';
    			}
    			
    			return value;
    		}, 
    		

    		/**
    		 * @private
    		 */
    		_getNumber: function(num) {
    			if (!num) {
    				return null;
    			}
    			
    			// either we have , (for komma) or a . and at least 3 following numbers (not a rounden komma)
    			if(num.indexOf(",") !== -1 || (num.length - num.indexOf('.') > 3))
    			{
    				num = num.replace(/\./g, "").replace(",", ".");
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
    		 * @private
    		 */
    		decimal: function(num) {
    			if (num === "" || !num) {
    				return num;
    			}
    			
    			var comma = 0;
    			if ((num - Math.abs(num)) > 0.001) {
    				comma = 2;
    			}
    			// convert to a nice number for display
    			var n = num, 
    				c = isNaN(c = Math.abs(comma)) ? 2 : comma, 
    				d = ',', // decimal d == undefined ? "," : d, 
    				t = '.', // thousand: t == undefined ? "." : t, 
    				i = parseInt(n = Math.abs( +n || 0).toFixed(c), 10) + "", 
    				j = (j = i.length) > 3 ? j % 3 : 0;
    			
    		   return (num<0 ? "-" : "") + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    		},


    		/**
    		 * @private
    		 */
    		currency: function(num) {
    		   return this.decimal(num);
    		},

    		/**
    		 * @private
    		 */
    		dateTime: function(cellvalue, options, rowObject) {
    			return (this.date(cellvalue) + " " + this.time(cellvalue));
    		},

    		/**
    		 * @private
    		 */
    		date: function(row, cell, cellvalue, columnDef, dataContext) {
    			// cleanup parameters (direct call vs. slickgrid)
    			if(typeof cellvalue === "undefined") {
    				cellvalue = row;
    				row = null;
    			}

    			if(typeof cellvalue === "undefined") {
    				if(options) {
    					return "&#160;";
    				}
    				return "";
    			}
    			
    			var d = new Date();
    			d.setTime(cellvalue);								
    			var year = d.getYear();
    			if(year < 1900) {
    				year += 1900;
    			}
    				
    			return this._pad(d.getDate()) + "." + this._pad((d.getMonth()+1)) + "." + this._pad(year);
    		},

    		/**
    		 * @private
    		 */
    		time: function(row, cell, value, columnDef, dataContext) {
    			// cleanup parameters (direct call vs. slickgrid)
    			if(typeof value === "undefined") {
    				value = row;
    				row = null;
    			}

    			if(typeof value === "undefined") {
    				if(options) {
    					return "&#160;";
    				}
    				return "";
    			}

    			var d = new Date();
    			d.setTime(value);								
    			return this._pad(d.getHours()) + ":" + this._pad(d.getMinutes()); //  + ":" + pad(d.getSeconds()); don't need seconds
    		},

    		/**
    		 * 
    		 * @param value a string value to format
    		 * @param allowms true to allow komma (i.e. 00.00)
    		 * @return something in the form of 00:00.00
    		 * @private
    		 */
    		timespan: function(row, cell, value, columnDef, dataContext, allowcomma) {
    			// cleanup parameters (direct call vs. slickgrid)
    			if(typeof value === "undefined") {
    				value = row;
    				allowcomma = cell;
    				row = null;
    				cell = null;
    			}

    			var tokens = value.split(":");
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
    			// cleanup parameters (direct call vs. slickgrid)
    			if(typeof value === "undefined") {
    				value = row;
    				row = null;
    			}
    			
    			
    			if (isNaN(value)) {
    				if(typeof value === "undefined" || value === null || value.length === 0) {
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
    		}
    };

})( jQuery, window );
