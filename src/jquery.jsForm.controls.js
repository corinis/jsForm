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
			if(!$(this).hasClass("mandatory")) {
				return;
			}
			// check for "null" as value as well 
			if($(this).val().length > 0 && $(this).val() !== "null") {
				$(this).addClass("valid").removeClass("invalid");
			} else {
				$(this).removeClass("valid").addClass("invalid");
			}
		});
		
		location.find("input.mandatory,textarea.mandatory").on("change", function(){
			if(!$(this).hasClass("mandatory")) {
				return;
			}
			
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
			if(!$(this).hasClass("mandatory")) {
				return;
			}

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
						inst.jumpToDate(new Date());
						inst.setDate(new Date());
					}]
				});
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
							var curDate = $.jsFormControls.Format.asDate($this.val());
							inst.jumpToDate(curDate);
							inst.setDate(curDate, true);
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
					// get date format
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
		
		/* mardown wysiwyg */
		location.find("textarea.markdownedit").each(function(){
			// create div
			let $text = $(this);
			let editContainer = $('<div />');
			editContainer.insertBefore($text);
			editContainer.css('height', $text.css('height'));
		     
		     // if fullEdit = true -> show all otherwise just simple formatting
			$text.data().editor = new toastui.Editor({
		      el: editContainer.get(0),
		      toolbarItems: $text.data().fullEdit ? [
		        ['heading', 'bold', 'italic', 'quote'],
		        ['ul', 'ol', 'task', 'indent', 'outdent'],
		        ['table'] 
		      ] : [
		        ['bold', 'italic', 'quote'],
		        ['ul', 'ol']
		     ],
		      height: $text.height() + "px",
		      //height: "450px",
		      initialEditType: 'wysiwyg',
		      initialValue: $('#PsychTextArea').val(),
		      hideModeSwitch:true,
		      events: {
		          change: function() {
		        	  $text.val($text.data().editor.getMarkdown());
		        	  $text.change();
		          }
	          }
		    });
		    // hide textarea
		    $(this).hide();  
		    $text.on("fill", function(){
			console.log("filling", $text.val());
				$text.data().editor.setMarkdown($text.val());
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
				let $ele = $(ele);
				if($ele.hasClass("dateTime") || $ele.hasClass("datetime")) {
					if(isNaN(cdata))
						return cdata;
					return $.jsFormControls.Format.dateTime(cdata);
				}  else if($ele.hasClass("date")) {
					if(isNaN(cdata))
						return cdata;
					return $.jsFormControls.Format.date(cdata);
				}  else if($ele.hasClass("time")) {
					if(isNaN(cdata))
						return cdata;
					return $.jsFormControls.Format.time(cdata);
				} else if($ele.hasClass("currency")) {
					return $.jsFormControls.Format.currency(cdata);
				} else if($ele.hasClass("bool")) {
					if(!cdata)
						return $ele.data().false || '';
					return $ele.data().true || (i18n ? i18n.label.yes : 'X');
				} else if($ele.hasClass("byte")) {
					if(isNaN(cdata))
						return cdata;
					return $.jsFormControls.Format.byte(cdata);
				} else if($ele.hasClass("decimal")) {
					$ele.data().processor = $.jsFormControls.Format.getDecimal;
					return $.jsFormControls.Format.decimal(cdata);
				} else if($ele.hasClass("vunit")) {
					// save the actual data
					$(this).data().val = cdata;
					$ele.data().processor = $.jsFormControls.Format.getVunit;
					return $.jsFormControls.Format.vunit(cdata, $ele.attr("data-unit"));
				} else if($ele.hasClass("percent")) {
					$ele.data().processor = $.jsFormControls.Format.getPercent;
					return $.jsFormControls.Format.percent(cdata);
				} else if($ele.hasClass("percentage")) {
					$ele.data().processor = $.jsFormControls.Format.getPercent;
					return $.jsFormControls.Format.percent(cdata) + "%";
				} else if($ele.hasClass("humantime")) {
					$ele.data().processor = $.jsFormControls.Format.getHumanTime;
					return $.jsFormControls.Format.humanTime(cdata);
				} else if($ele.hasClass("timespan")) {
					return $.jsFormControls.Format.timespan(cdata);
				} else if($ele.hasClass("timeday")) {
					if(!cdata)
						return cdata;
					return $.jsFormControls.Format.time(Number(cdata*24*3600000));
				} else if($ele.hasClass("humantimeday")) {
					if(!cdata)
						return cdata;
					$ele.data().processor = $.jsFormControls.Format.getHumanTime;
					return $.jsFormControls.Format.humanTime(Number(cdata*24*3600000));
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
			 * try parsing a string to date using i18n and libraries such as moment or luxon
			 */
			asDate: function(value) {
				var d = $.jsFormControls.Format.asMoment(value);
				// null
				if(!d)
					return null;
				// luxon
				if(d.toJSDate)
					return d.toJSDate();
				// moment.js
				if(d.toDate)
					return d.toDate;
				// already date
				return d;
			},
			
			/**
			 * use luxon or moment.js to parse a datestring.
			 * this will use:
			 * - predefined i18n formats (strict mode)
			 * - default momentjs (non-strict)
			 * 
			 */
			asMoment: function(value) {
				var m = null;
				var formats = [i18n.date.format + " " + i18n.date.timeFormat, i18n.date.dateTimeFormat, 
					i18n.date.format,
					i18n.date.longDateFormat, 
					i18n.date.timeFormat,
					// add common formats:
					"d.M.y H:m",
					"d.M.y",
					"d/M/y H:m",
					"d/M/y"];
				
				if(value.toFormat)
					return value;
				
				// luxon parsing
				if(typeof luxon !== "undefined") {
					if(luxon.DateTime.isDateTime(value))
						return value;
					
					//console.log("parsing ", value, formats, i18n.date)
					if(!isNaN(value)) {
						if(value.getTime)
							return luxon.DateTime.fromJSDate(value);
						return luxon.DateTime.fromMillis(value);
					}
			
					if(value.year)
						return luxon.DateTime.formObject(value);
						
					formats.forEach(function(format){
						if(m)
							return false;
						try {
							var cur = luxon.DateTime.fromFormat(value, format);
							if(cur.isValid) {
								m = cur;
								return false;
							}
						} catch (ex) {
							// ignore
						}
					});
					
					if(!m) {
						console.log("unable to parse " + value, formats);
						m = luxon.DateTime.fromISO(value);
					}
					return m;
				}
				
				// moment.js parsing
				if(typeof moment !== "undefined") {
					for(var i = 0; i < formats.length; i++)
						formats[i] = moment().toMomentFormatString(formats[i]);
						
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
				}
				
				// try date
				if(!m) {
					return new Date(value);
				}
				
				m.toFormat = m.format;
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
				if (Math.abs(num - Math.floor(num)) > 0.005) {
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
				if (val === "") {
					return 0;
				}
				
				return $.jsFormControls.Format.asNumber(val);
				
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
				if (!val || val === "") {
					return 0;
				}
				
				
				if(val.indexOf("%") !== -1)
					val = val.substring(0, val.length-1);
				
				var num =  $.jsFormControls.Format.getDecimal(val);
				console.log("Percent", val, num);
				
				return Number(num) / 100;
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
				
				var neg = value < 0;
				if(neg)
					value *= -1;
				
				var h = Math.floor(value/3600000);
				value -= h * 3600000;
				var m = Math.floor(value/60000);
				value -= m * 60000;
				var s = Math.floor(value/1000);
				value -= s * 1000;
				
				var out = neg?"-":"";
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
				var mult = val.charAt(0) === '-' ? -1 : 1;
				 
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
				return result*mult;
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