module('jquery.jsForm.js');

test("data formatting", function(){
	equal($.jsForm.format.humanTime(320), "320ms", "milliseconds");
	equal($.jsForm.format.humanTime(4320), "4s", "seconds");
	equal($.jsForm.format.humanTime(184200), "3m 4s", "minutest and seconds");
	equal($.jsForm.format.humanTime(5*3600000 + 32*60000 + 3580), "5h 32m", "hours and minutes");
});


test("slickgrid parameter formatting", function(){
	equal($.jsForm.format.humanTime(10, 10, 320), "320ms", "human time");
});


test("basic form", function(){
	// html code for basic form 
	var basicForm = $('<div id="simpleForm">\n'+
  	'<input name="data.input">\n'+
  	'<select name="data.select">\n'+
  	'	<option>opt1</option>\n'+
  	'	<option value="opt2">option2</option>\n'+
  	'	<option value="opt3">opt3</option>\n'+
  	'</select>\n'+
  	'<input type="checkbox" name="data.checkbox"/>\n'+
  	'<textarea name="data.textarea"></textarea>\n'+
  	'<input name="input" value="nochange"/>\n'+
  	'<span id="simpleFormField" class="field">data.field</span>\n'+
  	'</div>');
	
	$("body").append(basicForm);
	
	var original = {
			input: "inputTest",
			checkbox: true,
			select: "opt2",
			textarea: "ta\ntest",
			field: 123456
		};
	
	// default init: prefix = data
	basicForm.jsForm({
		data: original
	});

	equal($("input[name='data.input']", basicForm).val(), "inputTest", "input");
	equal($("input[name='data.checkbox']", basicForm).is(":checked"), true, "checkbox");
	equal($("select[name='data.select']", basicForm).val(), "opt2", "select");
	equal($("textarea[name='data.textarea']", basicForm).val(), "ta\ntest", "textarea");
	equal($("input[name='input']", basicForm).val(), "nochange", "ignore non-namespace input");
	equal($("#simpleFormField", basicForm).html(), "123456", "field");

	// make sure we get the same data out of the form
	equal(basicForm.jsForm("equals", original), true, "form hasn't changed the data");
	
	// update the fields
	$("input[name='data.input']", basicForm).val("input2");
	$("input[name='data.checkbox']", basicForm).click();
	$("select[name='data.select']", basicForm).find('option[value="opt3"]').attr('selected', true);
	$("textarea[name='data.textarea']", basicForm).val("test\n2");
	$("input[name='input']", basicForm).val("CHANGED");
	$("#simpleFormField", basicForm).html("ASDF");

	// compare the form with the original data 
	equal(basicForm.jsForm("equals", original), false, "form has different data");

	// get the pojo
	var pojo = basicForm.jsForm("get");
	
	
	// check the pojo with the updated values
	equal(pojo.input,"input2", "input (updated)");
	equal(pojo.checkbox, false, "checkbox (updated)");
	equal(pojo.select, "opt3", "select (updated)");
	equal(pojo.textarea, "test\n2", "textarea (updated)");
	equal(pojo.field, 123456, "field (no change) (updated)");
	
	// cleanup
	basicForm.remove();
});


test("collection test", function(){
	// html code for basic form 
	var basicForm = $('<div>\n'+
  	'<input name="data.input">\n'+
  	'<div class="collection" data-field="data.groups">\n'+
  	'<div class="entry">'+
  	'<span class="field">groups.id</span>\n'+
  	'  <input name="groups.name"/>\n'+
  	'  <span class="delete">X</span>\n'+
  	'</div>'+
  	'</div>\n'+
  	'<span class="add" data-field="data.groups">N</span>\n'+
  	'</div>');
	
	$("body").append(basicForm);
	
	var original = {
			input: "inputTest",
			test: "testValue",
			groups: [
			   { name: "group1", id: 1 }, 
			   { name: "group2", id: 2 },
			   { name: "group3", id: 3 }
			]
		};
	
	// default init: prefix = data
	basicForm.jsForm({
		data: original
	});
	
	equal($("input[name='data.input']", basicForm).val(), "inputTest", "simple input");
	equal($("div.collection", basicForm).children().size(), 3, "3 repeats");

	equal(basicForm.jsForm("equals", original), true, "form has not changed");

	// update a field
	$("div.collection div", basicForm).eq(1).find("input").val("TEST2");
	
	equal(basicForm.jsForm("equals", original), false, "form has different data");

	// get object back and test
	var pojo = basicForm.jsForm("get");
	
	equal(pojo.groups[1].name, "TEST2", "test change in collection");
	
	// add a new entry using "simple controls"
	$("span.add", basicForm).click();
	equal($("div.collection", basicForm).children().size(), 4, "4 repeats");
	
	pojo = basicForm.jsForm("get");
	equal(pojo.groups.length, 3, "no data yet - 3 entries");
	
	// enter some data
	$("div.collection div", basicForm).eq(3).find("input").val("newTest");
	
	pojo = basicForm.jsForm("get");
	equal(pojo.groups.length, 4, "with data - 4 entries");
	
	// remove 
	$("div.collection div", basicForm).eq(1).find("span.delete").click();
	equal($("div.collection", basicForm).children().size(), 3, "3 repeats");
	equal($("div.collection div", basicForm).eq(1).find("input").val(), "group3", "check if correct field is removed");
	pojo = basicForm.jsForm("get");
	equal(pojo.groups.length, 3, "remove entry")
	
	basicForm.remove();
});
