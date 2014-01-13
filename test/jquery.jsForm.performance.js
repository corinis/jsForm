module('jquery.jsForm.js');


test("predefined form", function(){
	// html code for basic form 
	var basicForm = $('<div>\n'+
  	'<input name="data.input1">\n'+
  	'<input name="data.input2">\n'+
  	'<input name="data.input3">\n'+
  	'<input name="data.input4">\n'+
  	'<input name="data.input5">\n'+
  	'<div class="collection" data-field="data.groups1">\n'+
  	' <div>\n'+
  	'  <input name="groups1.input1"/>\n'+
  	'  <input name="groups1.input2"/>\n'+
  	'  <input name="groups1.input3"/>\n'+
  	'  <input name="groups1.input4"/>\n'+
  	'  <input name="groups1.input5"/>\n'+
  	' </div>'+
  	'</div>\n'+
  	'<div class="collection" data-field="data.groups2">\n'+
  	' <div>\n'+
  	'  <textarea name="groups2.input1"></textarea>\n'+
  	'  <textarea name="groups2.input2"></textarea>\n'+
  	'  <textarea name="groups2.input3"></textarea>\n'+
  	'  <textarea name="groups2.input4"></textarea>\n'+
  	'  <textarea name="groups2.input5"></textarea>\n'+
  	' </div>'+
  	'</div>\n'+
  	'<div class="collection" data-field="data.groups3">\n'+
  	' <div>\n'+
  	'  <select name="groups3.input1"><option value="">none</option><option value="val1">val1</option><option value="val2">val2</option><option value="val3">val3</option></select>\n'+
  	'  <select name="groups3.input2"><option value="">none</option><option value="val1">val1</option><option value="val2">val2</option><option value="val3">val3</option></select>\n'+
  	'  <select name="groups3.input3"><option value="">none</option><option value="val1">val1</option><option value="val2">val2</option><option value="val3">val3</option></select>\n'+
  	'  <select name="groups3.input4"><option value="">none</option><option value="val1">val1</option><option value="val2">val2</option><option value="val3">val3</option></select>\n'+
  	'  <select name="groups3.input5"><option value="">none</option><option value="val1">val1</option><option value="val2">val2</option><option value="val3">val3</option></select>\n'+
  	' </div>'+
  	'</div>\n'+
  	'</div>');
	
	$("body").append(basicForm);
	var REPEAT = 20;
	
	var data = {groups1:[], groups2:[], groups3:[]};
	// basedata
	for(var i = 1; i <= 5; i++ ) {
		data["input" + i] = "LOREM IPSUM " + i;
	}
	//collection
	for(var j = 0; j < REPEAT; j++ ) {
		var obj = {};
		for(var i = 1; i <= 5; i++ )
			obj["input" + i] = "LOREM IPSUM " + i;
		
		data.groups1.push(obj);
	}
	//collection
	for(var j = 0; j < REPEAT; j++ ) {
		var obj = {};
		for(var i = 1; i <= 5; i++ )
			obj["input" + i] = "LOREM IPSUM DOLOR " + i;
		data.groups2.push(obj);
	}
	//collection
	for(var j = 0; j < REPEAT; j++ ) {
		var obj = {};
		for(var i = 1; i <= 5; i++ )
			obj["input" + i] = "val2";
		data.groups3.push(obj);
	}
	
	var start = new Date().getTime();
	
	// default init: prefix = data
	basicForm.jsForm({
		data: data
	});
	
	test("time for filling", function(){
		ok(true, (new Date().getTime() - start) + "ms");
	});
	

	equal(basicForm.jsForm("equals", data), true, "equals");
	
	var RUNS = 5;
	start = new Date().getTime();
	
	for(var i = 0; i < RUNS; i++) {
		basicForm.jsForm("get");
	}
	
	test("time for getting", function(){
		ok(true, (new Date().getTime() - start)/RUNS + "ms");
	});
	

	start = new Date().getTime();
	
	for(var i = 0; i < RUNS; i++) {
		basicForm.jsForm("changed");
	}
	
	test("time for changed", function(){
		ok(true, (new Date().getTime() - start)/RUNS + "ms");
	});

	basicForm.remove();
});

