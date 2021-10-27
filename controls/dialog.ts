/// <reference path="../3rdparty/jquery.d.ts" />
/// <reference path="ConnectionUtils.ts" />
/// <reference path="jquery.jsForm.d.ts" />

/**
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
 * $dlg.on("dialogopen", function(){ alert("dosth"); });
 * ```
 */
namespace Dialog {
	
	class DialogConfig {
		service?: string;
		saveMethod?: string | ((data: any, any) => void);
		buttons? : (($detail: JQuery)=>any);
        create?: ActionConfig;
        update?: ActionConfig;
        view?: ActionConfig;
        onDone?:((data:any ) => boolean);
		icon?: string;
		color?: string;
		width?: number = 600;
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
     * Init a new dialog, everything is stored directly in data
     */
	export function init(id: string | JQuery, options?: DialogConfig) {
		let $dlg = $(id);
		if(!$dlg.length) {
            console.log("Unable to find dialog: " + id, new Error().stack);
			return;
		}
		
		if(!options) {
		    options = {};
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
		
		
		/**
		 * Save the form (and close)
		 */
		var save = function() {
			if(options && options.saveMethod && !$dlg.hasClass("view")) {
				var data = $dlg.jsForm("get");
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
						if(postResult === false) {
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
	
						if(postResult === false) {
							$dlg.jsForm("fill", data);
							return;
						}
    					$dlg.dialog("close");
    				});
				}
			} else if($dlg.data().onDone) {
                var data = $dlg.jsForm("get");
				if($dlg.data().onData) {
					data = $dlg.data().onData(data);
				}
			    if($dlg.data().onDone(data) === false) {
                    alert(i18n.dialog_validation_notOk);
                    return;
			    }
                $dlg.dialog("close");
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
		
		let buttons = [
				    {
				    	'class': "ui-button-primary",
				    	text: i18n.dialog_ok,
						responsive: {
				    		html: '<i class="fas fa-2x fa-check"></i>',
				    		position: 1
				    	},
						click: function() {
							save();
						}
					},
					{
						text: i18n.dialog_cancel,
						click: function() {
							$dlg.dialog("close");
						}
					}
				];

		// default buttons
		if(options.buttons) {
			buttons = options.buttons($dlg);
		}
		
		// check if overlay exists
		if(options.overlay && $(options.overlay).length === 0) {
			// remove overlay (not found)
			options.overlay = null;
		}
		
		$dlg.dialog({
			autoOpen: false,
			width: options.width || 600,
			modal: true,
			titleIcon: {
				background: options.color,
				icon: options.icon
			},
			responsive: {
				overlay: options.overlay,
				limit: options.width || 600,	// become responsive and full screen when screen width is <= 600 pixel
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
					
					var saveDlg = function() {
						var data = curDlg.dlg.jsForm("get");
						if(!data) {
							alert(i18n.dialog_validation_notOk);
							return;
						}
						// update original object
						curDlg.dlg.data().updateData.pojo = data;
						var updated = $dlg.jsForm("get");
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
		var $form = $dlg.find("form");
		if($form) {
			$form.submit(function(ev){
				ev.preventDefault();
				save();
			});
		}
		
		/**
         * prepare bootstrap tabs for js trigger
		 * Fix for bootstrap bug
         */
        $dlg.find("a.nav-link").each(function (idx, ele) {
            var tabTrigger = new bootstrap.Tab(ele);
            $(ele).on('click', function (event) {
                event.preventDefault();
                tabTrigger.show();
            });
        });

	}
	/**
	 * Open a dialog window
	 * @param id the id or jquery selector for the dialog dom object
	 * @param data a data object used to fill the dialog form or a callback function 
	 * @param done callback when the dialog is closed with "OK"
	 * @param onData callback for data processing right before processed with done
	 */
	export function open(id: String | JQuery, data: any, done?: ((data: any) => boolean), onData?: ((data: any) => any)) {
		if(!data)
			data =  {};
		
		// save the callback
		let $dlg = $(id);
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
			if(!data)
				data = {};
				
			$dlg.data().pojo = data; 
            $dlg.jsForm("fill", data);
            if($dlg.hasClass("view")) {
            	$dlg.jsForm("preventEditing", true);
            }
            $dlg.dialog("open");
        }
	}
	
	/**
	 * Helper to close a dialog
	 * @param id the id or jquery selector for the dialog dom object
	 */
	export function close(id: String | JQuery) {
		let $dlg = $(id);
        $dlg.dialog("close");
	}

}