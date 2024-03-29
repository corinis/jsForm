/**
 * Initialize a dialog for a detail window
 * 
 * this is basically just a a wrapper for the jquery ui dialog.
 * an additional feature is, that on small screens (i.e. mobile)
 * it will instantiate a sliding panel (from the left) filling the whole screen.
 *  - close will move to the left and turn into a back arrow
 *  - other buttons will move to the top right (i.e. save) but with an icon
 *  
 * You can force responsive dialog by setting $(document).data().mobile to true
 *  # Usage
 *  
 *  Init the dialog as normal and add responsive configuration options.
 *  Note: this works only when creating the dialog, not when setting the
 *  options later:
 *  
 *  
$detail.dialog({
	width: 600,
	height: 450,
	overlay: $("#main"),
	savePosition: "uniqueId",
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
	windowResize: false,
	fullScreen: null,
	overlayTitlebar: false,
	resizeto: null,

	open: function() {
		
		var that = this;
		
		// a responsive dialog
		if(this.options.responsive) {
			var isResponsive = ($(window).width() <= this.options.responsive.limit) || $(document).data().mobile || this.options.overlay;
			
			if(this.options.responsive.overlay && !isResponsive) {
				this.uiDialogTitlebar.show();
				this.uiDialogTitlepane.hide();
				this.uiDialog.removeClass("ui-corner-all").addClass("resp-fullscreen");
				this._setOption("draggable", false);
				
				if($(this.options.responsive.overlay).length > 0) {
					this.resizeto = $(this.options.responsive.overlay);
				}
				
				// create the right title bar
				if(!this.overlayTitlebar) {
					// move the buttons in the header instead of the "x"
					var buttonPane = this.uiDialogButtonPane.detach();
					buttonPane.find(".ui-dialog-buttonset").addClass("btn-group");
					buttonPane.css({
						position: "absolute",
						top: 8,
						right: 5
					});
					this.uiDialogTitlebar.css({
						background: "#f5f5f5"
					});
					
					buttonPane.removeClass("ui-dialog-buttonpane").show();
					$("button", this.uiDialogTitlebar).hide();
					this.uiDialogTitlebar.append(buttonPane);
					this.overlayTitlebar = true;
				}
				
				
				// set full screen flag
				this.fullScreen = "overlay";

				if(!this.windowResize) {
					this.windowResize = true;
					$(window).resize(function() {
						that._position();
					});
				}

			} else {
	
				// create the right title bar
				if(this.overlayTitlebar) {
					// move the buttons in the header instead of the "x"
					var buttonPane = this.uiDialogButtonPane.detach();
					buttonPane.css({
						position: "block",
						top: "auto",
						right: "auto"
					});
					this.uiDialogTitlebar.css({
						background: "white"
					});
					
					buttonPane.addClass("ui-dialog-buttonpane");
					$("button", this.uiDialogTitlebar).show();
					this.element.append(buttonPane);
					this.overlayTitlebar = false;
				}

				
				// reset changes if it WAS fullscreen
				if(this.fullScreen && !isResponsive) {
					this.uiDialogTitlebar.show();
					this.uiDialogButtonPane.show();
					this.uiDialogTitlepane.hide();
					$(".titleIcon", this.uiDialogTitlebar).show();
					this._setOption("draggable", true);
					this.uiDialog.addClass("ui-corner-all").removeClass("resp-fullscreen");
					this.uiDialog.css("margin", "auto");
				}
	
				if(isResponsive) {
					// set full screen flag
					this.fullScreen = "full";
					
					// hide the default panes
					$(".titleIcon", this.uiDialogTitlepane).hide();
					this.uiDialogTitlebar.hide();
					this.uiDialogButtonPane.hide();
					this.uiDialogTitlepane.show();
					this.uiDialog.removeClass("ui-corner-all").addClass("resp-fullscreen");;
					this._setOption("draggable", false);
					this.uiDialog.css("margin", "-2px"); // remove extra border
				}
			}
			
		} 
		
		// auto save position and size
		if(this.options.savePosition && !this.fullScreen) {
			var saveKey = this.options.savePosition; 
			// set the default position and w/h
			var defaultPos = localStorage ? localStorage.getItem(saveKey) : null;
			if(!defaultPos) {
				defaultPos = {
						width: this.options.width,
						height: this.options.height,
						position: this.options.position
				}
			} else {
				defaultPos = JSON.parse(defaultPos);
			}


			if(defaultPos.position) {
				if(!defaultPos.position.of)
					defaultPos.position.of = window;
			} else {
				defaultPos.position = {
					my: "center", at: "center", of: window
				};
			}
			
			this.options.width = defaultPos.width;
			this.options.height = defaultPos.height;
			this.options.position = defaultPos.position;
			
			// add drag and resize handler
			var savePos = function(event, ui) {
				if(this.fullScreen) {
					return;
				}
				var pos = {
						width: $(this).dialog("option", "width"),
						height: $(this).dialog("option", "height"),
						position: {
							my: "left top",
							at: "left+" + ui.position.left + " top+" + ui.position.top
						}
				}
				
				localStorage.setItem(saveKey, JSON.stringify(pos));
			};
			
			this.options.dragStop = savePos;
			this.options.resizeStop = savePos;
		}
		
		
		// invoke the parent widget
		var wasOpen = this._isOpen; 
		var resp = this._super();
		if(wasOpen) {
			this._trigger( "open" );
		}
		
		return resp;
	},
	
	_size: function() {
		if(this.fullScreen === "overlay") {
			// Reset content sizing
			this.element.show().css( {
				width: "auto",
				minHeight: 0,
				maxHeight: "none",
				height: 0
			} );
			
			this.element.css({
				height: "100%",
				width: "100%",
				position: "absolute"
			});
			// check the size of what we want to overlay
			this.uiDialog.show().css({
				width: "100%",
				height: "100%"
			});
		}
		else if(this.fullScreen === "full") {

			// Reset content sizing
			this.element.show().css( {
				width: "auto",
				minHeight: 0,
				maxHeight: "none",
				height: 0
			} );
			
			var nonContentHeight = this.uiDialog.css( {
				height: "auto",
				width: "100%",
			} ).outerHeight();
			
			
			this.element.css({
				height: "100%",
				width: "100%",
				position: "absolute",
				top: "48px"
			});
			
			// full screen
			this.uiDialog.show().css({
				width: "100%",
				height: "100%"
			});
		} else {
			this._super();
		}
	},
	
	_position: function() {
		if(this.fullScreen === "overlay") {
			// calculate the new position
			// two possibilities: either left - or based on width
			if(this.options.responsive.overlay.position) {
				this.uiDialog.css({
					left: this.options.responsive.overlay.position().left,
					height: $(window).height() - this.options.responsive.overlay.position().top,
					width: $(window).width() - this.options.responsive.overlay.position().left,
					top: this.options.responsive.overlay.position().top
				}); 
			}
			else if(this.options.responsive.overlay.left) {
				this.uiDialog.css({
					left: this.options.responsive.overlay.left,
					height: $(window).height() - this.options.responsive.overlay.top,
					width: $(window).width() - this.options.responsive.overlay.left,
					top: this.options.responsive.overlay.top
				}); 
			} else {
				this.uiDialog.css({
					left: $(window).width() - this.options.width,
					height: $(window).height() - this.options.responsive.overlay.top,
					width: this.options.width,
					top: this.options.responsive.overlay.top
				}); 
			}
		}
		else if(this.fullScreen === "full") {
			this.uiDialog.position({my: "left top", at: "left top", of: window})
		} else {
			this._super();
			
			// shrink to avoid overwriting the window size (async to allow painting of content)
			var $ele = this.element;
			setTimeout(function(){
				if($ele.height() > $(window).height() - 150) {
					$ele.height($(window).height() - 130); 
				}
			}, 30);
		}
	},
	
	_createButtons: function() {
		var that = this,
			buttons = this.options.buttons;

		// now go over over buttons and see if any have a pulldown
		$.each( buttons, function( name, props ) {
			if(!props["class"])
				props["class"] = "btn btn-secondary";
			else if(props["class"].indexOf("ui-button-primary") !== -1) {
				props["class"] = props["class"] + " btn btn-primary";
			} else
				props["class"] = props["class"] + " btn btn-secondary";
			
			if(!props.pulldown) {
				return;
			}
			var cur = props;
			if(!cur.id) {
				cur.id = "pd-" + new Date().getTime() - Math.random() * 10000;
			}
			
			// add the pulldown 
			props.click = function() {
				if(that._pulldown) {
					that._pulldown.item.remove();
					delete(that._pulldown);
					// we clicked on the same
					if(that._pulldown.id == cur.id)
						return;
				}
				
				// create the html
				var container = $("<div style='position:absolute;overflow:visible;'></div>")
				var pd = $("<ul class='drowdown-menu pull-right' role='menu'></ul>");
				pd.css("min-width", $("#" + cur.id).outerWidth());
				container.append(pd);
				$.each(cur.pulldown.items, function(){
					var entry = $("<li></li>");
					entry.append("<div>" + this.html + "</div>");
					entry.click(this.click);
					entry.on("close", function(){
						that._pulldown.item.remove();
						delete that._pulldown;
					});
					pd.append(entry)
				});
				$(that.uiDialog).append(container);
				that._pulldown = { item: container, id: cur.id};
				pd.menu({
					select: function(event, ui) {
						$(ui.item).click();
					}
				});
				container.position({
					my: "left top",
					at: "left bottom",
					of: "#" + cur.id,
				});
				
				// call the open
				if(cur.pulldown.open) {
					$.proxy(cur.pulldown.open, pd);
				}				
			}
		});

	
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
					.btn( button.options )
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
		
		this.uiDialogTitlepane = $( '<div style="position: absolute; width: 100%;">' );
		this.uiDialogTitlepane.hide();
		this.uiDialogTitlepane.addClass("ui-dialog-titlebar ui-widget-header ui-helper-clearfix ui-dialog-titlepane resp-fullscreen" );
		
		
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
		
		this.uiDialogTitlepaneRight = $( "<div class='resp-right-btn'>" );
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
		} else {
			this._title(this.uiDialogTitlepaneTitle, config.title);
		}
		
		this.uiDialogTitlepaneLeft.css({
			float:"left"
		});
		
		this.uiDialogTitlepane.append(this.uiDialogTitlepaneLeft);
		
		this.uiDialogTitlepane.append(this.uiDialogTitlepaneTitle);
		
		// has to be within title pane to allow click events
		this.uiDialogTitlepane.append(this.uiDialogTitlepaneRight);
		
		// add on top
		this.uiDialogTitlepane.prependTo(this.uiDialog);
	},
	
	_title: function(title, xtra) {
		this._super(title);
		var that = this;
		// add icon
		var opts = this.options.titleIcon; 
		if(opts || xtra) {
			title.addClass("has-icon");
			var bg = opts?opts.background:'';
			if(!bg) {
				bg = '';
			}
			
			title.html(
					'<span class="titleIcon bg-icon active '+bg+'"> ' +
					(xtra?'<i class="' + xtra.icon + '"/> ':'') +
					'<i class="' + opts.icon + '"/>' +
					'</span>'
					+ title.html());
			
			if(xtra && xtra.click) {
				title.addClass("xtra");
				title.children("span").click(function(){
					xtra.click.apply( that.element[ 0 ], arguments );
				});
			}
		}
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
			
			if(this.options.responsive.overlay && !this.options.responsive.overlay.top) {
				this.options.responsive.overlay.top = 121;
			}
		}
		
		return this._super();
	},
	
	close: function() {
		return this._super();
	}
});
/**
 * btn override: 
 * type: [outline-][primary, *secondary*, success, danger, warning, info, light, dark]
 */
$.widget("corinis.btn", $.ui.button, {
	options: {
		type: "secondary"
	},
	_create: function() {
		this._super();
		var type = this.options.type || "secondary";
		if($(this).hasClass("ui-button-primary"))
			type = "primary";
		this._addClass("btn btn-" + type);
		this._removeClass("ui-corner-all ui-widget ui-button");
	}
});
