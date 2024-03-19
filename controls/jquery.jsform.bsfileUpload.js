$(function(){
	
	let uploadModal = new bootstrap.Modal(document.getElementById('uploadDlg'), {});
	
	$(".jsfileupload").on("click", function(){
		let options = {
			title: $(this).data().title || "Upload",
			service: $(this).data().service,
			method: $(this).data().method || "method",
			params: $(this).data().params || [],
			ele: $(this)
		}
		
		$("#uploadDlg .modal-title").html(options.title);
		$("#uploadDlgLoadFile").data().options = options;
		
		// reset
		$("#uploadDlgStatus").hide();
		$("#uploadDlgProgress").hide();
		$("#uploadDlgBtn").show();
		
		uploadModal.show();
	});
	
	$("#uploadDlgLoadFile").on("change", function(){
		// read data
		$("#uploadDlgProgress").show();
		$("#uploadDlgBtn").hide();
		
		let options = $("#uploadDlgLoadFile").data().options;

		let done = 0;		

		let allFiles = $('#uploadDlgLoadFile')[0].files
		
		let result = [];
		
		console.log("files", allFiles);
		for(let i = 0; i < allFiles.length; i++) 
		{
			let files = allFiles[i];
			let fd = new FormData();
			let transData = {
				service: options.service,
				method: options.method,
				param: options.params,
			};
			fd.append('data', JSON.stringify(transData));
			fd.append('files[]',files);

			// upload
			$.ajax({
		      url: Core.conn.SERVICE_URL ? Core.conn.SERVICE_URL : '/service',
		      type: 'post',
		      data: fd,
		      contentType: false,
		      processData: false
		    }).done(function(data, textStatus, _xhr) {
				done++;
				data = data.length > 0 ? data[0] : data;
				
				if(data.success === false || data.error) {
					$("#uploadDlgStatus").html("Error: " + data.longMessage);
					options.ele.trigger("error", [data.error]);
					return;
				}

				result.push(data.data);
				
				if(done == $('#uploadDlgLoadFile')[0].files.length) {
					options.ele.trigger("success", [result]);
					uploadModal.hide();
				}
			}).fail(function(_xhr, textStatus, error) {
				done++;
				console.log("error", textStatus, error);
				$("#uploadDlgStatus").html("Error: " + textStatus);
				options.ele.trigger("error", [error]);
			});
		}
	});
	
});