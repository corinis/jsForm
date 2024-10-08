/**
 * jquery.sorTable
 * -----------
 * Add some basic functions like sorting and selecting of rows to an existing table.
 * 
 * For this to work, there needs to be a header row that controls the sorting. This is either:
 * - "table>thead>tr>th","table>thead>tr>td" or "table>tr[eq:0]>td"
 * can be specified in the "headSelect" option
 * the rows sorted are either "table>tbody>tr", "table>tr" or "table>tr[pos()>0]" depending on the html layout (i.e. with a thead).
 * the can be specified in the "bodyRowSelect" option. the cells are ALWAYS td for the body!
 * 
 * Every time you call refresh the body will be selected new, so you can use this even with dynamically added tables.
 * 
 * Note that the header cells must be matched by body cells in order for sorting to work. If there is a different amount of body cells 
 * there will be unintended effects.
 * 
 * @version 1.0
 * @class
 * @author Niko Berger
 * @license MIT License GPL
 */
;(function( $, window, undefined ){
	"use strict";
	
	const SORTABLE_INIT_FUNCTIONS = {};	// remember initialization functions
	const SORTABLE_MAP = {};	// remember all sorTables
	
	/**
	 * @param element {Node} the cotnainer table that should be converted to a sorTable
	 * @param options {object} the configuraton object
	 * @constructor
	 */
	function SorTable (element, options) {
		// create the options
		this.options = $.extend({}, {
			/**
			 * add icons in the header: add html snipped.
			 * If empty, nothing will be shown
			 */
			icon: ['&#160;<i class="fa fa-sort"></i>', '&#160;<i class="fa fa-sort-up"></i>', '&#160;<i class="fa fa-sort-down"></i>'],
			/**
			 * selector to get the header cells
			 */
			headSelect: "thead>tr>th",
			/**
			 * select the body
			 */
			bodySelect: "tbody",
			/**
			 * the class in the head that specifies a row that is sortable
			 */
			classSortable: "sortable", 
			/**
			 * quickfilter element
			 */
			quickfilter: null,
			/**
			 * remember the sort order in a cookie (non-null = name of the cookie)
			 */
			remember: null
		}, options);
		// the table to sort
		this.element = element;
		// the sorted last 
		this.lastSort = null;

		this._init();
	}

	/**
	 * init and load the config
	 * @private 
	 */
	SorTable.prototype._init = function() {
		const that = this;
		$(this.options.headSelect, this.element).each(function(){
			if(!$(this).hasClass(that.options.classSortable))
				return;
			let sortIcon = null;
			if(that.options.icon) {
				sortIcon = $('<span class="action sort">'+that.options.icon[0]+'</sort>');
				$(this).append(sortIcon);
			}
				
			$(this).click(function(){
				const curSort = that._sort($(this).prevAll().length, that.lastSort !== sortIcon ? 0 : $(this).data().sortOrder);
				$(this).data().sortOrder = curSort;
				if(sortIcon) {
					if(that.lastSort) that.lastSort.html(that.options.icon[0]);
					// remember the current row and set the icon correctly
					that.lastSort = sortIcon;
					sortIcon.html(that.options.icon[curSort]);
				}
			});
		});
		
		const qf = $(this.options.headSelect, this.element).find("input.quickfilter");
		if(qf.length > 0) {
			qf.on("keyup change", function(){
				const val = $(this).val().trim();
				that._filter(val);
			});
		}

	};
	
	
	/**
	 * filter the body table based on a value
	 */
	SorTable.prototype._filter = function(value) {
		const that = this;
		const $body = $(this.options.bodySelect, this.element);
		value = value.toLowerCase(); 
		$($body).children("tr").each(function(){
			if(!value || value === "") {
				$(this).show();
				return;
			}
			// check the text content
			const content = that._rowVal($(this)).toLowerCase();
			if(content.indexOf(value) === -1)
				$(this).hide();
			else
				$(this).show();				
		});
	};
	
	/**
	 * get the content of a cell
	 */
	SorTable.prototype._cellVal= function($cell) {
		
		let rowVal = $("select", $cell).val(); 
		// no text - check input
		if(typeof rowVal === "undefined") {
			rowVal = $("input", $cell).val();
		}
		if(typeof rowVal === "undefined") {
			rowVal = $cell.text().trim();
		}
		return rowVal;
	}

	/**
	 * get the content of a row 
	 */
	SorTable.prototype._rowVal= function($row) {
		const that = this;
		let rowVal = "";
		$row.children().each(function(){
			rowVal += that._cellVal($(this));
		});
		return rowVal;
	}
	
	/**
	 * repaint the sorTable with new data
	 * @param pos the row to sort
	 * @param order the current order of this row
	 * @return 0-no sort; 1-down; 2-up
	 * @private 
	 */
	SorTable.prototype._sort = function(pos, order) {
		const that = this;
		const $body = $(this.options.bodySelect, this.element); 
		let dataType = "string";
		if(order == 1)
			order = 2;
		else 
			order = 1;
			
		const he = $($(this.options.headSelect, this.element).get(pos));
		if(he.hasClass("num") || he.hasClass("number"))
			dataType = "number";
		else if(he.hasClass("trimnum"))
			dataType = "findnumber";
		else if(he.hasClass("date"))
			dataType = "date";
			
		console.log("sort "+pos+" by", dataType);
		
		// collect all tr
		const data = [];
		$($body).children("tr").each(function(){
			const $cell = $($(this).children()[pos]);
			const rowVal = that._cellVal($cell);
			data.push({ 
				val: rowVal,
				row: $(this).detach()
			});
		});

		let valFunc = he.data().sorter;
		if(!valFunc)
			switch(dataType){
				case "number":
					valFunc = (a)=>{
						return Number(a.val);
					}; break;
				case "findnumber":
					valFunc = (a)=>{
						const aval = a.val.replace(/[^0-9.,]+/g, ""); 
						return Number(aval);
					}; break;
				case "date":
					valFunc = (a)=>{
						const aval = new Date(a); 
						return aval.getTime();
					}; break;
				default:
					valFunc = (a)=>{
						return a.val;
					}; break;
			} 
					
		// sort
		data.sort(function(a,b){
			const aVal = valFunc(a);
			const bVal = valFunc(b);
			if (aVal < bVal)
			  return order == 1 ? -1 : 1;
			if (aVal > bVal)
			  return order == 1 ? 1 : -1;
			return 0;
		});
		
		// readd
		$.each(data, function(){
			$body.append(this.row);
		});
		
		return order;
	};
	
	SorTable.prototype.sort = function (col) {
		if(!isNaN(col)) {
			this._sort(col);
			return;
		}
		this._sort(col.prevAll().length);
	};
	
	/**
	 * destroy the jsform  and its resources.
	 * @private
	 */
	SorTable.prototype.destroy = function( ) {
		return $(this.element).each(function(){
			$(window).unbind('.sorTable');
			$(this).removeData('sorTable');
		});
	};

	// init and call methods
	$.fn.sorTable = function ( method ) {
		// Method calling logic
		if ( typeof method === 'object' || ! method ) {
			return this.each(function () {
				if (!$(this).data('sorTable')) {
					$(this).data('sorTable', new SorTable( this, method ));
				}
			});
		} else {
			const args = Array.prototype.slice.call( arguments, 1 );
			let sorTable;
			// none found
			if(this.length === 0) {
				return null;
			}
			// only one - return directly
			if(this.length === 1) {
				sorTable = $(this).data('sorTable');
				if (sorTable) {
					if(method.indexOf("_") !== 0 && sorTable[method]) {
						return sorTable[method].apply(sorTable, args);
					}
					
					$.error( 'Method ' +  method + ' does not exist on jQuery.sorTable' );
					return false;
				}
			}
			
			return this.each(function () {
				sorTable = $.data(this, 'sorTable'); 
				if (sorTable) {
					if(method.indexOf("_") !== 0 && sorTable[method]) {
						return sorTable[method].apply(sorTable, args);
					} else {
						$.error( 'Method ' +  method + ' does not exist on jQuery.sorTable' );
						return false;
					}
				}
			});
		}   
	};
		
	/**
	 * global sorTable function for initialization
	 */
	$.sorTable = function ( name, initFunc ) {
		const sorTables = SORTABLE_MAP[name];
		// initFunc is a function -> initialize
		if($.isFunction(initFunc)) {
			// call init if already initialized
			if(sorTables) {
				$.each(sorTables, function(){
					initFunc(this, $(this.element));
				});
			}
			
			// remember for future initializations
			SORTABLE_INIT_FUNCTIONS[name] = initFunc;
		} else {
			// call init if already initialized
			if(sorTables) {
				const method = initFunc;
				const args = Array.prototype.slice.call( arguments, 2 );
				$.each(portlets, function(){
					this[method].apply(this, args);
				});
			}
		}
	};

})( jQuery, window );
