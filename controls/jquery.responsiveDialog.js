/**
 * Initialize a dialog for a detail window
 * 
 * this is basically just a a wrapper for the jquery ui dialog.
 * an additional feature is, that on small screens (i.e. mobile)
 * it will instantiate a sliding panel (from the left) filling the whole screen.
 *  - close will move to the left and turn into a back arrow
 *  - other buttons will move to the top right (i.e. save) but with an icon
 *  
 *  Usage:
 *  
 *  Init the dialog as normal and add responsive configuration options.
 *  Note: this works only when creating the dialog, not when setting the
 *  options later:
 *  
 *  
$detail.dialog({
	width: 600,
	height: 450,
	responsive: {
		limit: 600,	
		left: {
			'class': 'red-style',
			text: '<img src="chevron-left.png"/> Icon',
			click: function() { 
				$(this).dialog("close"); 
			}
		},
		center: { 'class': 'green-background' },
		right: true
	},
	closeOnEscape: true,
	buttons: [
	    {
	    	text: i18n.dialog_ok,
	    	responsive: {
	    		html: '<img src="icon-check.png">',
	    		position: 1
	    	},
	    	click: function() {
	    		alert("OK");
	    	}
	    },
		{ 
			text: i18n.dialog_cancel,
			responsive: false,
			click: function() { 
				$(this).dialog("close"); 
			}
		}
	]
};
*/
$.widget("ui.dialog", $.ui.dialog, {
	open: function() {
		
		if(this.options.responsive) {
			
			var isResponsive = screen.width <= this.options.responsive.limit;
			
			// reset changes if it WAS fullscreen
			if(this.fullScreen && !isSS) {
				this.uiDialogTitlebar.show();
				this.uiDialogButtonPane.show();
				this.uiDialogTitlepane.hide();
				this._setOption("draggable", true);
				this.uiDialog.addClass("ui-corner-all");
				this.uiDialog.css("margin", "auto");
			}

			if(isSS) {
				// set full screen flag
				this.fullScreen = true;
				
				// hide the default panes
				this.uiDialogTitlebar.hide();
				this.uiDialogButtonPane.hide();
				this.uiDialogTitlepane.show();
				this.uiDialog.removeClass("ui-corner-all");
				this._setOption("draggable", false);
				this.uiDialog.css("margin", "-2px"); // remove extra border
			}
			
		} 
		// invoke the parent widget
		return this._super();
	},
	
	_size: function() {
		if(this.fullScreen) {
			
			// Reset content sizing
			this.element.show().css( {
				width: "auto",
				minHeight: 0,
				maxHeight: "none",
				height: 0
			} );
			
			var nonContentHeight = this.uiDialog.css( {
				height: "auto",
				width: $(window).width(),
			} ).outerHeight();
			
			console.log($(window).height() - nonContentHeight);
			this.element.height( $(window).height() - nonContentHeight );
			
			// full screen
			this.uiDialog.show().css({
				width: $(window).width(),
				height: $(window).height()
			});
		} else {
			this._super();
		}
	},
	
	_position: function() {
		if(this.fullScreen) {
			this.uiDialog.position({my: "left top", at: "left top", of: window})
		} else {
			this._super();
		}
	},
	
	_createButtons: function() {
		this._createPaneButtons();
		this._super();
	},
	
	_createPaneButtons: function() {
		if(!this.options.responsive || !this.uiDialogTitlepaneRight) {
			return;
		}
		var that = this,
			buttons = this.options.buttons, 
			config = this.options.responsive;
		if(!config) {
			return;
		}
		
		// remove existing buttons
		this.uiDialogTitlepaneRight.empty();
		var buttonArr =[];
		$.each( buttons, function( name, props ) {
			if(!props.responsive) {
				return;
			}
			
			
			var click, buttonOptions;
			
			props = $.isFunction( props ) ?
				{ click: props, text: name } :
				props;

			// Default to a non-submitting button
			props = $.extend( { type: "button" }, props );

			// Change the context for the click callback to be the main element
			click = props.click;
			buttonOptions = {
				icon: props.responsive.icon || props.icon,
				iconPosition: props.iconPosition,
				pos: props.responsive.position || 1,
				html: props.responsive.html
			};
			
			delete props.click;
			delete props.responsive;
			delete props.icon;
			delete props.iconPosition;
			delete props.showLabel;
			
			// sort
			buttonArr.push({props: props, options: buttonOptions, click:click})
		} );
		
		buttonArr.sort(function(a,b){
			return a.options.pos - b.options.pos
		});
		
		$.each(buttonArr, function(){
			var button = this;
			if(button.options.html) {
				$(button.options.html).appendTo( that.uiDialogTitlepaneRight )
				.on( "click", function() {
					button.click.apply( that.element[ 0 ], arguments );
				} );
			} else {
				$( "<button></button>", button.props )
					.button( button.options )
					.appendTo( that.uiDialogTitlepaneRight )
					.on( "click", function() {
						button.click.apply( that.element[ 0 ], arguments );
					} );
			}
		});
	},
	
	/**
	 * create a combined title bar/button pane for responsive layout
	 */
	_createTitlepane: function() {
		var that = this;
		var config = this.options.responsive;
		if(!config) {
			return;
		}
		
		this.uiDialogTitlepane = $( "<div>" );
		this.uiDialogTitlepane.hide();
		this.uiDialogTitlepane.addClass("ui-dialog-titlebar ui-widget-header ui-helper-clearfix ui-dialog-titlepane" );
		
		// four parts: left-buttons - title - rightbuttons - menu
		this.uiDialogTitlepaneLeft = $( "<div>" );
		if(config.left) {
			if(config.left['class']) {
				this.uiDialogTitlepaneLeft.addClass(config.left['class']);
			}
			if(config.left.text) {
				this.uiDialogTitlepaneLeft.html(config.left.text);
			} else {
				this.uiDialogTitlepaneLeft.html("&#160;");
			}
			if(config.left.click) {
				this.uiDialogTitlepaneLeft.on("click", function(){
					config.left.click.apply( that.element[ 0 ], arguments );
				});
			}
		}
		
		this.uiDialogTitlepaneRight = $( "<div style='float:right'>" );
		if(config.right) {
			if(config.right['class']) {
				this.uiDialogTitlepaneRight.addClass(config.right['class']);
			}
			// content function (use append)
			if(config.right.content) {
				config.right.content(this.uiDialogTitlepaneRight);
			} else {
				// create based on the buttons
				this._createPaneButtons();
			}
		}
		
		this.uiDialogTitlepaneTitle = $( "<span class='ui-dialog-title'>" );
		if(config.center) {
			if(config.center['class']) {
				this.uiDialogTitlepaneTitle.addClass(config.center['class']);
			}
			if(config.center.text) {
				this.uiDialogTitlepaneTitle.html(config.center.text);
			} else {
				this._title(this.uiDialogTitlepaneTitle);
			}
			if(config.center.click) {
				this.uiDialogTitlepaneTitle.on("click", function(){
					config.center.click.apply( that.element[ 0 ], arguments );
				});
			}
		}
		
		
		this.uiDialogTitlepaneLeft.css({
			float:"left"
		});
		
		this.uiDialogTitlepane.append(this.uiDialogTitlepaneLeft);
		
		this.uiDialogTitlepane.append(this.uiDialogTitlepaneRight);
		this.uiDialogTitlepane.append(this.uiDialogTitlepaneTitle);
		
		// add on top
		this.uiDialogTitlepane.prependTo(this.uiDialog);
	},
	
	_create: function() {
		this._super();
		this._createTitlepane();
	},
	
	_init: function() {
		
		// check/fix the options
		if(this.options.responsive) {
			if(this.options.responsive === true) {
				this.options.responsive = {};
			}
			var responsiveOpts = $.extend({}, {
				/**
				 * the limit when the responsive full screen dialog should appear
				 */
				limit: 1000,
				/**
				 * which effect (can be just the name or the options) to use when showing/hiding the screen
				 */
				effect: { effect: "slide" }
			}, this.options.responsive);
			this.options.responsive = responsiveOpts; 
		}
		
		return this._super();
	},
	
	close: function() {
		console.log("close");
		
		return this._super();
	}
});