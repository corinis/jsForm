/// <reference path="../3rdparty/jquery.d.ts" />
/// <reference path="ConnectionUtils.ts" />
/// <reference path="jquery.jsForm.d.ts" />

/**
 * Documentation:(https://project.corinis.com/docs/pages/viewpage.action?pageId=99615166)
 * 
 * Dialog Helper Class.
 * this works in combination with jqueryUI dialog and Connection Utils
 * to provide a generic CRUD dialog functionality
 *
 * This supports basic Dialogs and sub-dialogs.
 *
 * uses i18n to define button labels.
 * Use with following js:
 * ```js
 * 	subDialog = $("#subDialogId");
 * 	Dialog.init($detail, {
 * 	service: "InfoService",
 * 	saveMethod: "persist",
 *  create: { action: "#addMenuBtn", data: {}  }
 *  update: { action: "#changeMenuBtn", data: ()=>{ return selectedItem; }  }
 *  view: { action: "#changeMenuBtn", data: ()=>{ return selectedItem; }  }
 * 	subDialogs: [{
 * 		dlg: subDialog,
 * 		action: ".rawDetail"
 * 	}]
 * });
 * ```
 * Sample HTML:
 * ```
 * <div class="detail" data-icon="icon-basket-i" data-color="bg-color3" title="{{i18n.MainDialog}}" style="display:none">
 *  <form>
 *  	<label><span>{{i18n.label.id}}</span><input name="data.id"/></label>
 *  	<ul class="collection" data-field="data.materials">
 *  		<li><input name="materials.id"/> <span class="field">materials.name</span> <span class="field">materials.kilo</span>:<span class="field">materials.liter</span> <span class="field">materials.usage</span> <i class="fa fa-info-square rawDetail action" title="Details/Konvertierung"></i> <i class="fa fa-trash delete"></i></li>
 *  	</ul>
 *  	<button style="display:none"></button>
 *  </form>
 * </div>
 * <div class="subdetail" data-icon="icon-basket-i" data-color="bg-color3" title="{{i18n.SubTitle}}" style="display:none">
 *  <form>
 *  	<label><span>{{i18n.label.id}}</span><span class="field">data.id</span></label>
 *	 	<button style="display:none"></button>
 *  </form>
 * </div>
 * ```
 * Events
 * You can use the default dialog events to add extra actions:
 * ```
 * $dlg.on("dialogopen", function(){ alert("just opened a dialog"); });
 * $dlg.on("success", function(){ alert("just successfully saved"); });
 * 
 * ```
 */
namespace Dialog {
	
	class DialogConfig {
		service?: string;
		saveMethod?: string | ((data: any, any) => void);
		// have an extra save button not only ok (=save+close)
		buttonSave? : boolean;
		buttons? : Array<any> | (($detail: JQuery, buttons: Array<any>)=>any);
		create?: ActionConfig;
		update?: ActionConfig;
		view?: ActionConfig;
		/** show the menu floating (true) or in the header(false) */
		floatingMenu: false;
		onDone?:((data:any ) => boolean);
		icon?: string;
		color?: string;
		width?: number = 600;
		responsive?: number = 800;
		modal: boolean = true;
		subDialogs?: Array<SubDialogConfig>;
		overlay?: JQuery;
	}
	
    class ActionConfig {
        action: string;
        data: any;
		/**
		 * before data is procesed
		 */
		onData?:((data: any) => any);
		/**
		 * after data is processed
		 */
        onDone?:((data: any) => boolean);
    }
    
	class SubDialogConfig {
		action: string;
		dlg?: JQuery;
		width?: number = 400;
	}

	/**
	 * Initializes the dialog overlay with the given ID and options.
	 *
	 * @param {any} id - the ID of the dialog
	 * @param {object} options - optional settings for the dialog
	 * @return {undefined}
	 */
	export function init(id: string | JQuery, options?: DialogConfig, replaceButton:boolean = false) {
		if(typeof Panel !== "undefined") {
			console.log("Using panel init ", id, options);
			Panel.init(id, options);
			return;
		}
		
		if(replaceButton) {
			setTimeout(() => {
  				console.log("Replace button pane...");
				replaceDefaultButtonPane($dlg);
			}, 100);
		}

		const $dlg = $(id);
				
		if(!$dlg.length) {
			console.log("Unable to find dialog: " + id, new Error().stack);
			return;
		}
		
		if(!options) {
		    options = new DialogConfig ();
		}
		
		if($dlg.attr("data-modal") === "false") {
			options.modal = false; 
		} else {
			options.modal = true;
		}
		 
		if($dlg.attr("data-icon")) {
			options.icon = $dlg.attr("data-icon"); 
		}
		if($dlg.attr("data-color")) {
			options.color = $dlg.attr("data-color"); 
		}
		if($dlg.attr("data-width")) {
			options.width = Number($dlg.attr("data-width")); 
		}
		if($dlg.attr("data-responsive")) {
			options.responsive = Number($dlg.attr("data-responsive")); 
		}
		if($dlg.attr("data-buttonsave")) {
			options.buttonSave = $dlg.attr("data-buttonsave") === "true"; 
		}		
		
		/**
		 * Save the form (and close)
		 */
		let save = function(close:boolean) {
			if(options?.saveMethod && !$dlg.hasClass("view")) {
				let data = $dlg.jsForm("get");
				if($dlg.data().onData) {
					data = $dlg.data().onData(data);
				}
				if(!data) {
					alert(i18n.dialog_validation_notOk);
					return;
				}
				
				if(typeof options.saveMethod === "function") {
				    options.saveMethod(data, function(data){
						let postResult = null;
                        if($dlg.data().onDone) {
                            postResult = $dlg.data().onDone(data);
                        }
                        else if(options.onDone) {
                            postResult = options.onDone(data);
                        }
                        $dlg.trigger("success", [data]);
						if(postResult === false || !close) {
							$dlg.jsForm("fill", data);
							return;
						}
                       	$dlg.dialog("close");
				    });
				} else {
    				Core.conn.execute(options.service, options.saveMethod, [data]).then(function(data){
						let postResult = null;
    					if($dlg.data().onDone) {
    						postResult = $dlg.data().onDone(data);
    					}
    					else if(options.onDone) {
    					    postResult = options.onDone(data);
    					}
    					$dlg.trigger("success", [data]);
	
						if(postResult === false || !close) {
							$dlg.jsForm("fill", data);
							return;
						}
   						$dlg.dialog("close");
    				});
				}
			} else if($dlg.data().onDone) {
                let data = $dlg.jsForm("get");
                // prepare data (if required)
				if($dlg.data().onData) {
					data = $dlg.data().onData(data);
				}
				// call the onDone function
			    let res = $dlg.data().onDone(data, (data)=>{
					if(close || !data) {
	                	$dlg.dialog("close");
					} else {
						$dlg.jsForm("fill", data);				
					}
				});
				if(res === false) {
                    alert(i18n.dialog_validation_notOk);
                    return;
                } else if(res === true) {
	                // keep open, wait for callback
    			} else {
					$dlg.dialog("close");				
				}

			} else{
				$dlg.dialog("close");
			}
		};
        
        // action integration: open dialog
        if(options) {
            if(options.create) {
                $(options.create.action).click(()=>{
                    if($(this).hasClass("disabled")) {
                        return;
                    }
					$dlg.removeClass("view");
                    Dialog.open($dlg, options.create.data, options.create.onDone, options.create.onData);
                });
            }
            if(options.update) {
                $(options.update.action).click(()=>{
                    if($(this).hasClass("disabled")) {
                        return;
                    }
					$dlg.removeClass("view");
                    Dialog.open($dlg, options.update.data, options.update.onDone, options.update.onData);
                });
            }
			if(options.view) {
                $(options.view.action).click(()=>{
                    if($(this).hasClass("disabled")) {
                        return;
                    }
					$dlg.addClass("view");
                    Dialog.open($dlg, options.view.data, options.view.onDone, options.view.onData);
                });
            }
        }
		
		let buttons = []


		if(options.buttonSave) {
			buttons.push({
				    	'class': "ui-button-primary",
				    	text: i18n.dialog_save,
						responsive: {
				    		html: '<i class="fas fa-2x fa-check"></i>',
				    		position: 1
				    	},
						click: function() {
							save(false);
						}
					});
		}
		
		buttons.push({
				    	'class': "ui-button-primary",
				    	text: i18n.dialog_ok,
						responsive: {
				    		html: '<i class="fas fa-2x fa-check"></i>',
				    		position: 1
				    	},
						click: function() {
							save(true);
						}
					});
					
		buttons.push({
						text: i18n.dialog_cancel,
						click: function() {
							$dlg.dialog("close");
						}
					});
				

		// default buttons
		if(options.buttons) {
			if(typeof options.buttons === "function")
				buttons = options.buttons($dlg, buttons);
			else
				buttons = options.buttons;
		}
		
		// fill default class
	 	if(buttons?.length > 1) { 
			buttons.forEach(item => {
				if(!item.class && item.color) {
					item.class = 'btn btn-' + item.color;
				}
			});
		}

		
		// check if overlay exists
		if(options.overlay && $(options.overlay).length === 0) {
			// remove overlay (not found)
			options.overlay = null;
		}
		
		$dlg.dialog({
			autoOpen: false,
			width: options.width || 600,
			modal: options.modal,
			titleIcon: {
				background: options.color,
				icon: options.icon
			},
			responsive: {
				overlay: options.overlay,
				limit:  options.responsive || options.width || 600,	// become responsive and full screen when screen width is <= 600 pixel
				left: {
					'class': 'bg-icon active ' + options.color,
					text: '&#160;<i class="fas fa-chevron-left"/>&#160;<i class="'+options.icon+'"/>',
					click: function() { 
						// reset changed fields
						if($(this).jsForm) {
							$(this).jsForm("resetChanged");
						}
						$(this).dialog("close"); 
					}
				},
				center: { 'class': 'has-icon' },
				right: true
			},
			buttons: buttons 
				
		});
		
		if(options.subDialogs) {
			options.subDialogs.forEach((curDlg, index, array) => {
					$(curDlg.action, $dlg).click(function(){
	                    if($(this).hasClass("disabled")) {
	                        return;
	                    }
						curDlg.dlg.dialog("open");
						curDlg.dlg.data().updateData = $(this).closest(".POJO").data();
						curDlg.dlg.jsForm("fill", $(this).closest(".POJO").data().pojo);
					});
					
					let saveDlg = function() {
						let data = curDlg.dlg.jsForm("get");
						if(!data) {
							alert(i18n.dialog_validation_notOk);
							return;
						}
						// update original object
						curDlg.dlg.data().updateData.pojo = data;
						let updated = $dlg.jsForm("get");
						$dlg.jsForm("fill", updated);
					};
					
					curDlg.dlg.dialog({
						autoOpen: false,
						width: curDlg.width || 400,
						modal: true,
						buttons: 
							[
							    {
							    	'class': "ui-button-primary",
							    	text: i18n.dialog_ok,
									click: function() {
										saveDlg();
										curDlg.dlg.dialog("close");
									}
								},
								{
									text: i18n.dialog_cancel,
									click: function() {
										curDlg.dlg.dialog("close");
									}
								}
							]
					});
					
					curDlg.dlg.jsForm();
			});
		}
		
		$dlg.jsForm();
		let $form = $dlg.find("form");
		if($form) {
			$form.submit(function(ev){
				ev.preventDefault();
				save(false);
			});
		}
		
		/**
         * prepare bootstrap tabs for js trigger
		 * Fix for bootstrap bug
         */
        $dlg.find("a.nav-link").each(function (idx, ele) {
            let tabTrigger = new bootstrap.Tab(ele);
            $(ele).on('click', function (event) {
                event.preventDefault();
                tabTrigger.show();
            });
        });

	}
	
   /**
    * Opens a dialog with the specified ID, populates it with data, and sets up event handlers.
    *
    * @param {string} id - The ID of the dialog element.
    * @param {object} data - The data to populate the dialog with.
    * @param {Function} done - The callback function to execute when the dialog is closed.
    * @param {Function} onData - The callback function to execute when new data is received.
    */
	export function open(id: string | JQuery, data: any, done?: ((data: any, cb: ((data: any)=>void)) => boolean), onData?: ((data: any) => any)) {
		if(typeof Panel !== "undefined") {
			Panel.open(id, data, done, onData);
			return;
		}

		if (!data) {
        	data = {};
		}
		
		// save the callback
		const $dlg = $(id);
		$dlg.data().onDone = done;
		$dlg.data().onData = onData;
		
		// toggle view/edit mode		
		$dlg.jsForm("preventEditing", false);
		
        if(typeof data === "function") {
            data((retrieveData: any)=>{
				$dlg.data().pojo = retrieveData; 
                $dlg.jsForm("fill", retrieveData);
                if($dlg.hasClass("view")) {
                	$dlg.jsForm("preventEditing", true);
                }
                $dlg.dialog("open");
            });
        } else {
			if(!data) {
				data = {};
			}
				
			$dlg.data().pojo = data; 
            $dlg.jsForm("fill", data);
            if($dlg.hasClass("view")) {
            	$dlg.jsForm("preventEditing", true);
            }
            $dlg.dialog("open");
        }
	}
	
   /**
    * Closes the overlay or modal identified by the given ID.
    *
    * @param {string} id - The ID of the overlay or modal to be closed.
    */
	export function close(id: string | JQuery): void {
		if(typeof Panel !== "undefined") {
			Panel.close(id);
			return;
		}
		const $dlg = $(id);
        $dlg.dialog("close");
	}


   /**
    * Helper functions
    */


	/**
	 * Replace default buttonpane if button div or/and button dropdown exists
	 * @param dlg Dialog object contains HTMLDivElement
	 */
	 function replaceDefaultButtonPane(dlg: object) {
		if ($(dlg).find('.dialog-buttons').length > 0 || $(dlg).find('.dropdown').length > 0) {
            if ($(dlg).parent().find('.ui-dialog-buttonpane').length > 0) {
                $(dlg).parent().find('.ui-dialog-buttonpane').empty();
                
                if ($(dlg).find('.dialog-buttons').length === 1) {
                    $(dlg).parent().find('.ui-dialog-buttonpane').append($(dlg).find('.dialog-buttons'));
                    dispatchButtonEvents($(dlg).parent().find('.dialog-buttons') , dlg);
                }
            }
            else {
                $(dlg).parent().append('<div class="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix"></div>');
                replaceDefaultButtonPane(dlg);
            }
        }
    }

   /**
    * Dispatch button events for the given button container and dialog.
    *
    * @param {HTMLElement} buttonContainer - The container element that holds the buttons.
    * @param {HTMLElement} dlg - The dialog element.
    */
	function dispatchButtonEvents(buttonContainer: JQuery, dlg: JQuery): void {
        // Add click handler for event dispatching to every single element
        $(buttonContainer).children().each(function(index, element) {  
			
			 // For dropdown buttons set correct buttoncontainer
			 if(element.nodeName === 'DIV') {
                dispatchButtonEvents($(dlg).parent().find('.dropdown-menu'), dlg);
            }

            // Check if button has data-event, dispatch event if element is not disabled
      		if (element.hasAttribute('data-event') || element?.children[0]?.hasAttribute('data-event')) {
				let el: any = element; // button or anchor
                if (!element.hasAttribute('data-event')) {
					el= element.children[0];
				}
   
                $(el).on('click', function() {
                    if (this.classList.contains('disabled'))  
                        return;

                    let data = null;
                    if (this.classList.contains('data')) {
						data = $('.detail').jsForm('get');
					}
                    //console.log('----- Dispatched event', $(this).data().event);
                    dlg.trigger($(this).data().event, [dlg, data] );
                });
            }        
        }); 
    }

}