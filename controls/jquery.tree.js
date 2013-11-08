/**
 * jquery.tree
 * -----------
 * Simple Tree control
 * @version 1.0
 * @class
 * @author Niko Berger
 * @license MIT License GPL
 */
;(function( $, window, undefined ){
	"use strict";
	
	var TREE_INIT_FUNCTIONS = {},	// remember initialization functions
	TREE_MAP = {};	// remember all trees
	
	/**
	 * @param element {Node} the cotnainer node that should be converted to a tree
	 * @param options {object} the configuraton object
	 * @constructor
	 */
	function Tree (element, options) {
		// create the options
		this.options = $.extend({}, {
			/**
			 * automatically prepend icons
			 */
			autoIcon: false,
			/**
			 * open all levels
			 */
			open: false,
			/**
			 * remember which part of the tree was open in a cookie (non-null = name of the cookie)
			 */
			remember: null,
			/**
			 * field used for id (only required for remembering which node was "open")
			 */
			id: null,
			/**
			 * field used as name
			 */
			name: "name",
			/**
			 * field used for title
			 */
			title: null,
			/**
			 * field to recurse into
			 */
			children: "children",
			/**
			 * set to true to allow multiple elements to be selected
			 */
			multiple: false,
			/**
			 * style when a node is active (null: disables activation)
			 */
			active: "ui-state-active",
			hover: "ui-state-hover",
			
			
			/**
			 * the object used to fill/collect data
			 */
			data: null,
			
			/**
			 * true to execute the loaddata automatically
			 */
			load: true,
			
			/**
			 * callback function for data fetching
			 */
			loadData: null,
			
			/**
			 * callback function when a node is selected
			 */
			select: null,
			/**
			 * callback function when a node is double clicked
			 */
			dblclick: null,
			
			/**
			 * callback function when a node is drag/dropped. if null drag/dropping is disabled
			 */
			drop: null
		}, options);
		
		this.element = element;

		if(this.options.load && this.options.loadData) {
			this.options.loadData();
		}
		
		this._init();
	}

	/**
	 * init the portlet - load the config
	 * @private 
	 */
	Tree.prototype._init = function() { 
		// fill everything
		this._repaint();
	};
	
	Tree.prototype._paint = function(basenode, data) {
		// return if empty
		if(data === null || !data.length || data.length == 0)
			return;
		
		var that = this, config = this.options, $this = $(this.element);
		
		var root = $('<ul class="tree"/>');
		basenode.append(root);
		$.each(data, function(){
			var name = null, title = null;
			if($.isFunction(config.name)) {
				name = config.name(this);
			} else {
				name = this[config.name];
			}
			
			if($.isFunction(config.title)) {
				title = config.title(this);
			} else {
				title = this[config.title];
			}
			
			var node = $('<li class="node control"><span>'+name+'</span></li>');
			if(title !== null) {
				node.attr("title", title);
			}
			
			if(config.id) {
				node.data().id = this[config.id];
			} else if(this.id)
				node.data().id = this.id;

			$("span", node).hover(function(){$(this).addClass(config.hover);}, function(){$(this).removeClass(config.hover);}).click(function(){
				if(config.active) {
					// deactivate
					if(!config.multiple) {
						$this.find("." + config.active).removeClass(config.active);
						$(this).addClass(config.active);
					}
					else {
						if($(this).hasClass(config.active)) {
							$(this).removeClass(config.active);
						} else {
							$(this).addClass(config.active);
						}
					}
				}
				
				// trigger selection
				if($(this).hasClass(config.active)) {
					if(config.select)
						config.select($(this).parent().data().node);
					$this.data().selected = this;
					$this.trigger("select", this);
				}
			}).dblclick(function(){
				// doubleclick: only one secelection
				if(config.active) {
					$this.find("." + config.active).removeClass(config.active);
					$(this).addClass(config.active);
				}
				// trigger selection
				if(config.dblclick)
					config.dblclick($(this).parent().data().node);
				$this.data().selected = $(this).parent().data().node;
				$this.trigger("dblclick", $(this).parent().data().node);
			});
			node.data().node = this;
			root.append(node);
			that._paint(node, this[config.children]);
		});
	};
	
	/**
	 * repaint the tree with new data
	 * @private 
	 */
	Tree.prototype._repaint = function() {
		this._clear();
		
		if(this.options.data) {
			this._paint($(this.element), this.options.data);
		}
			
		this._enable(this.element, this.options.data);
		
		if(this.options.drop) {
			this._enableSorting();
		}
	};
	
	Tree.prototype._enableSorting = function() {
		var $this = $(this.element),config = this.options;
		
		// now add dragndrop capability
		$("li", $this).draggable({
			opacity: 0.5,
			revert:true
		});
		
		// and drop them
		$("li span", $this).droppable({
			tolerance: "pointer",
			hoverClass: "ui-state-hover",
			drop: function(event, ui){
				var dropped = ui.draggable;
				var me = $(this).parent();
				// reload after move
				var meObj = me.data().node;

				// make the change in the pojos
				var dropObj = dropped.data().node;
				
				config.drop(dropObj, meObj);
			}
		});
	};
		
		
	/**
	 * applies the acutal tree functionality
	 * @private
	 */
	Tree.prototype._enable = function(base, data) {
		var config = this.options;
		
		// make sure we have openers
		$(base).find("li").each(function(){
			// avoid double initialization
			if($(this).hasClass("tree-item")) {
				return;
			}
			$(this).addClass("tree-item");
			
			// cleanup
			if(config.autoIcon) {
				$(this).children("ul").filter( function() {
				    return $.trim($(this).html()) == '';
				}).remove();
			}

			// either we have an ul or a method but do not know that there are no childs
			var opener = $('<ins class=""></ins>');
			$(this).prepend(opener);
			if($(this).children("ul").length > 0 || ($(this).hasClass("portlet-fill") && $(this).data("hasChilds") !== false)) {
				opener.addClass("ui-icon ui-icon-triangle-1-e");
			} else if(config.empty){
				opener.addClass(config.empty);
			}

			// in case of ul with li -> open
			if($(this).children("ul").length > 0) {
				if($(this).find("li").length > 0) {
					$(this).addClass("open");
					opener.addClass("ui-icon-triangle-1-se").removeClass("ui-icon-triangle-1-e");
				}
			}
			
			opener.click(function(){
				if($(this).parent().hasClass("open")){
					$(this).parent().children("ul").hide();
					$(this).parent().removeClass("open");
					$(this).addClass("ui-icon-triangle-1-e").removeClass("ui-icon-triangle-1-se");
					$(this).parent().trigger("tree.close", [$(this).parent()]);
				} else {
					$(this).parent().children("ul").show();
					$(this).parent().addClass("open");
					$(this).addClass("ui-icon-triangle-1-se").removeClass("ui-icon-triangle-1-e");
					$(this).parent().trigger("tree.open", [$(this).parent()]);
				}
			});

			// close ul (do not trigger for dynmic tress -> portlet-fill
			if($(this).children("ul").length > 0 && !$(this).parent().hasClass("open") && !config.open) {
				opener.trigger("click");
			} 
		});
	};
	
	

	/**
	 * clear/reset a form. The prefix is normally predefined by init
	 * @param form the form 
	 * @param prefix the optional prefix used to identify fields for this form
	 */
	Tree.prototype._clear = function() {
		$(this.element).html("");
	};

	
	/**
	 * repaint the tree with given data
	 * @param data {object} the data
	 */
	Tree.prototype.fill = function(pojo) {
		// clear first
		this.clear();
		// set the new data
		this.options.data = pojo;
		// fill everything
		this._repaint(this.element, this.options.data);
	};

	/**
	 * Clear all fields in a form
	 */
	Tree.prototype.clear = function() {
		// clear first
		this._clear();
	};
	
	/**
	 * @return all currently selected fields 
	 */
	Tree.prototype.getAll = function() {
		var config = this.options, $this = $(this.element);
		
		if(!config.active)
			return $this.data().selected;
		
		var ret =  [];
		$this.find("." + config.active).each(function(){
			ret.push($(this).closest("li.tree-item").data().node);
		});
		return ret;
	};
	
	Tree.prototype.select = function(fields) {
		var config = this.options, $this = $(this.element);
		
		// only if we actually display the select
		if(!config.active)
			return;
		
		// deselect all
		$this.find("." + config.active).removeClass(config.active);
		
		// skip if we dont select anything (=clear)
		if(!fields)
			return;
		
		$.each(fields, function(){
			var id = this;
			if(config.id) {
				id = this[config.id];
			} else if(this.id)
				id = this.id;
		
			$("li.node").each(function(){
				if($(this).data().id === id) {
					$(this).children("span").addClass(config.active);
					return false;
				}
			});
		});
	};

	/**
	 * call the loadData callback or use the current dat aobject to repaint the whole tree
	 */
	Tree.prototype.reload = function(){
		if(this.options.loadData)
			this.options.loadData();
		else {
			this.clear();
			this._repaint(this.element, this.options.data);
		}
	};
	
	/**
	 * destroy the jsform  and its resources.
	 * @private
	 */
	Tree.prototype.destroy = function( ) {
		return $(this.element).each(function(){
			$(window).unbind('.tree');
			$(this).removeData('tree');
		});
	};

	// init and call methods
	$.fn.tree = function ( method ) {
		// Method calling logic
		if ( typeof method === 'object' || ! method ) {
			return this.each(function () {
				if (!$(this).data('tree')) {
					$(this).data('tree', new Tree( this, method ));
				}
			});
		} else {
			var args = Array.prototype.slice.call( arguments, 1 ),
				tree;
			// none found
			if(this.length === 0) {
				return null;
			}
			// only one - return directly
			if(this.length === 1) {
				tree = $(this).data('tree');
				if (tree) {
					if(method.indexOf("_") !== 0 && tree[method]) {
						var ret =  tree[method].apply(tree, args);
						return ret;
					}
					
					$.error( 'Method ' +  method + ' does not exist on jQuery.tree' );
					return false;
				}
			}
			
			return this.each(function () {
				tree = $.data(this, 'tree'); 
				if (tree) {
					if(method.indexOf("_") !== 0 && tree[method]) {
						return tree[method].apply(tree, args);
					} else {
						$.error( 'Method ' +  method + ' does not exist on jQuery.tree' );
						return false;
					}
				}
			});
		}   
	};
		
	/**
	 * global tree function for initialization
	 */
	$.tree = function ( name, initFunc ) {
		var trees = TREE_MAP[name];
		// initFunc is a function -> initialize
		if($.isFunction(initFunc)) {
			// call init if already initialized
			if(trees) {
				$.each(trees, function(){
					initFunc(this, $(this.element));
				});
			}
			
			// remember for future initializations
			TREE_INIT_FUNCTIONS[name] = initFunc;
		} else {
			// call init if already initialized
			if(trees) {
				var method = initFunc;
				var args = Array.prototype.slice.call( arguments, 2 );
				$.each(portlets, function(){
					this[method].apply(this, args);
				});
			}
		}
	};

})( jQuery, window );
