module('jquery.jsForm.js');

test("data formatting", function(){
	equal($.jsFormControls.Format.humanTime(320), "320ms", "milliseconds");
	equal($.jsFormControls.Format.humanTime(6000), "6s", "milliseconds");
	equal($.jsFormControls.Format.humanTime(4320), "4s", "seconds");
	equal($.jsFormControls.Format.humanTime(184200), "3m 4s", "minutest and seconds");
	equal($.jsFormControls.Format.humanTime(5*3600000 + 32*60000 + 3580), "5h 32m", "hours and minutes");
	equal($.jsFormControls.Format.decimal(51234.1234), "51,234.12", "decimal");
	equal($.jsFormControls.Format.decimal(4.1234), "4.12", "decimal");
});

test("internationalization", function(){
	// default: english
   equal($.jsFormControls.Format.decimal(1123456.54), "1,123,456.54", "default decimal");
   //$.jsFormControls.Format.dateTime(cdata)
   //$.jsFormControls.Format.date(cdata)
   equal($.jsFormControls.Format.asNumber("1,123,456.54"), 1123456.54, "decimal to number"); 
	
	 // set english locale
	   $(document).data("i18n", {
	     date: {
	       "format": "M/d/yy h:mm a",
	       "monthsFull":["January","February","March","April","May","June","July","August","September","October","November","December"],
	       "monthsShort": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
	       "daysFull": ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
	       "daysShort": ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
	       "timeFormat": "h:mm a",
	       "longDateFormat": "EEEE, MMMM d, yyyy",
	       "shortDateFormat": "M/d/yy"
	     },
	     number: {
	       "format": "#,##0.###",
	       "groupingSeparator": ".",
	       "decimalSeparator": ","
	     },
	     currency: {
	    	 "prefix": "",
	    	 "suffix": " €",
	    	 "fractionDigits": 2
	    }
	   });
	   
		  
	   equal($.jsFormControls.Format.decimal(1123456.54), "1.123.456,54", "decimal (de)");
	   //$.jsFormControls.Format.dateTime(cdata)
	   //$.jsFormControls.Format.date(cdata)
	   equal($.jsFormControls.Format.currency(1123456.54), "1.123.456,54 €", "currency (€ suffix)"); 
	   equal($.jsFormControls.Format.asNumber("1.123.456,54 €"), 1123456.54, "currency number  (€ suffix)"); 

	   // set german locale
	   $(document).data("i18n", {
	     date: {
	       "format": "dd.MM.yy HH:mm",
	       "monthsFull":["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
	       "monthsShort": ["Jan","Feb","Mrz","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],
	       "daysFull": ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"],
	       "daysShort": ["So","Mo","Di","Mi","Do","Fr","Sa"],
	       "timeFormat": "HH:mm",
	       "longDateFormat": "EEEE, d. MMMM yyyy",
	       "shortDateFormat": "dd.MM.yy"
	     },
	     number: {
	       "format": "#,##0.###",
	       "groupingSeparator": ",",
	       "decimalSeparator": "."
	     },
	     currency: {
	    	 "prefix": "$",
	    	 "suffix": "",
	    	 "fractionDigits": 2
    	 }
	   });
	   equal($.jsFormControls.Format.decimal(1123456.54), "1,123,456.54", "decimal US");
	   //$.jsFormControls.Format.dateTime(cdata)
	   //$.jsFormControls.Format.date(cdata)
	   equal($.jsFormControls.Format.currency(1123456.54), "$1,123,456.54", "currency  ($ prefix)"); 
	   equal($.jsFormControls.Format.asNumber("$1,123,456.54"), 1123456.54, "currency number ($ prefix)"); 

});

test("slickgrid parameter formatting", function(){
	equal($.jsFormControls.Format.humanTime(10, 10, 320), "320ms", "human time");
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
	$("select[name='data.select']", basicForm).find('option[value="opt3"]').prop('selected', true);
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
  	'<div class="collection group" data-field="data.groups">\n'+
  	'<div class="entry">'+
  	'<span class="field">groups.id</span>\n'+
  	'  <input name="groups.name"/>\n'+
  	'  <span class="delete">X</span>\n'+
  	'</div>'+
  	'</div>\n'+
  	'<span class="add" data-field="data.groups">N</span>\n'+
  	'<div class="collection string" data-field="data.simpleString"><div><input name="simpleString."/></div></div>\n'+
  	'<div class="collection number" data-field="data.simpleNumber"><div><input class="number" name="simpleNumber."/></div></div>\n'+
  	'</div>');
	
	$("body").append(basicForm);
	
	var original = {
			input: "inputTest",
			test: "testValue",
			groups: [
			   { name: "group1", id: 1 }, 
			   { name: "group2", id: 2 },
			   { name: "group3", id: 3 }
			],
			simpleString: ["test", "test2", "test3"],
			simpleNumber: [1, 2, 3]
		};
	
	// default init: prefix = data
	basicForm.jsForm({
		data: original
	});
	
	equal($("input[name='data.input']", basicForm).val(), "inputTest", "simple input");
	equal($("div.collection.group", basicForm).children().size(), 3, "3 repeats");
	equal($("div.collection.number", basicForm).children().size(), 3, "3 repeats");
	equal($("div.collection.string", basicForm).children().size(), 3, "3 repeats");

	
	equal(basicForm.jsForm("equals", original), true, "form has not changed");

	// update a field
	$("div.collection.group div", basicForm).eq(1).find("input").val("TEST2");
	$("div.collection.string div", basicForm).eq(1).find("input").val("HELLO WORLD");
	$("div.collection.number div", basicForm).eq(1).find("input").val("1000");
	
	equal(basicForm.jsForm("equals", original), false, "form has different data");

	// get object back and test
	var pojo = basicForm.jsForm("get");
	
	equal(pojo.groups[1].name, "TEST2", "test change in collection");
	equal(pojo.simpleString[1], "HELLO WORLD", "test change in collection");
	equal(pojo.simpleNumber[1] === 1000, true, "test change in collection");
	
	// add a new entry using "simple controls"
	$("span.add", basicForm).click();
	equal($("div.collection.group", basicForm).children().size(), 4, "4 repeats");
	
	pojo = basicForm.jsForm("get");
	equal(pojo.groups.length, 3, "no data yet - 3 entries");
	
	// enter some data
	$("div.collection.group div", basicForm).eq(3).find("input").val("newTest");
	
	pojo = basicForm.jsForm("get");
	equal(pojo.groups.length, 4, "with data - 4 entries");
	
	// remove 
	$("div.collection.group div", basicForm).eq(1).find("span.delete").click();
	equal($("div.collection.group", basicForm).children().size(), 3, "3 repeats");
	equal($("div.collection.group div", basicForm).eq(1).find("input").val(), "group3", "check if correct field is removed");
	pojo = basicForm.jsForm("get");
	equal(pojo.groups.length, 3, "remove entry");
	
	basicForm.remove();
});


test("collection in collection test", function(){
	// html code for basic form 
	var basicForm = $('<div>\n'+
  	'<input name="data.input">\n'+
  	'<div class="collection group" data-field="data.groups">\n'+
  	' <div>\n'+
  	'  <input name="groups.name"/>\n'+
  	'  <div class="collection users" data-field="groups.users">\n'+
  	'    <div class="entry">'+
  	'      <input name="users.name"/>\n'+
  	'      <span class="delete">X</span>\n'+
  	'    </div>'+
  	'  </div>'+
  	' </div>'+
  	'</div>\n'+
  	'<span class="add" data-field="data.groups">N</span>\n'+
  	'</div>');
	
	$("body").append(basicForm);
	
	var original = {
			input: "inputTest",
			groups: [
			   { name: "group1", users: [{name: "user11"}, {name: "user12"}] }, 
			   { name: "group2"},
			   { name: "group3", users: [{name: "user31"}, {name: "user32"}] }
			]
		};
	
	// default init: prefix = data
	basicForm.jsForm({
		data: original
	});
	
	equal($("div.collection.group", basicForm).children().size(), 3, "3 repeats");
	equal($("div.collection.group", basicForm).children().eq(0).find(".collection.users").children(".entry").size(), 2, "2 repeats (child)");
	
	equal(basicForm.jsForm("equals", original), true, "form has not changed");

	// update a field
	$("div.collection.group", basicForm).children().eq(0).find(".collection.users").children().eq(0).find("input[name='users.name']").val("TESTUSER");
	
	equal(basicForm.jsForm("equals", original), false, "form has different data");

	// get object back and test
	var pojo = basicForm.jsForm("get");
	
	equal(pojo.groups[0].users[0].name, "TESTUSER", "test change in collection");
	
	basicForm.remove();
});

test("simple arrays and checkboxes", function(){
	// html code for basic form 
	var basicForm = $('<div>\n'+
  	'<input type="checkbox" class="array" name="data.checks" value="a">\n'+
  	'<input type="checkbox" class="array" name="data.checks" value="b">\n'+
  	'<input type="checkbox" class="array" name="data.checks" value="c">\n'+
  	'<input type="checkbox" class="array" name="data.checks" value="d">\n'+
  	'</div>');
	
	$("body").append(basicForm);
	
	var original = {
		checks: ["a", "c"]
	};
	
	// default init: prefix = data
	basicForm.jsForm({
		data: original
	});
	
	equal($("input.array[value='a']", basicForm).is(":checked"), true, "a checked");
	equal($("input.array[value='b']", basicForm).is(":checked"), false, "b not checked");
	equal($("input.array[value='c']", basicForm).is(":checked"), true, "c checked");
	equal($("input.array[value='d']", basicForm).is(":checked"), false, "d not checked");
	equal(basicForm.jsForm("equals", original), true, "form has not changed");
/*
	// update a field
	$("input.array[value='a']", basicForm).prop("checked", false);
	$("input.array[value='b']", basicForm).prop("checked", true);
	
	equal(basicForm.jsForm("equals", original), false, "form has different data");

	// get object back and test
	var pojo = basicForm.jsForm("get");
	
	equal(pojo.checks, ["b", "c"], "b and c checked");
*/	
	basicForm.remove();

});


test("direct access simple arrays", function(){
	// html code for basic form 
	var basicForm = $('<div>\n'+
  	'<ul class="collection" data-field="data.steps" id="list1">\n'+
  	'<li><input type="text" class="number" name="steps." /></li>\n' +
  	'</ul>\b'+
  	'<button class="add" data-field="data.steps" id="add1">add</button>\n'+
  	'<ul class="collection" data-field="data.test.steps" id="list2">\n'+
  	'<li><input type="text" class="number" name="steps." /></li>\n' +
  	'</ul>\b'+
  	'<button class="add" data-field="data.test.steps" id="add2">add</button>\n'+
  	'</div>');
	
	$("body").append(basicForm);
	
	var original = {
		steps: [10,20,30,40,50],
		test: {
			steps: [100,200,300,400,500]
		}
	};
	
	// default init: prefix = data
	basicForm.jsForm({
		data: original
	});
	
	equal($("#list1", basicForm).children().length, 5, "5 items in list1");
	equal($("#list2", basicForm).children().length, 5, "5 items in list2");
	equal(basicForm.jsForm("changed"), false, "form has not changed");
	equal(basicForm.jsForm("equals", original), true, "form data has not changed");
	// add an item in each list
	$("#add1", basicForm).click();
	$("#add2", basicForm).click();
	equal($("#list1", basicForm).children().length, 6, "6 items in list1");
	equal($("#list2", basicForm).children().length, 6, "6 items in list2");

	$("#list1", basicForm).children().first().find("input").val("1111").change();
	$("#list1", basicForm).children().last().find("input").val("1112").change();
	$("#list2", basicForm).children().first().find("input").val("2221").change();
	$("#list2", basicForm).children().last().find("input").val("2222").change();
	var updated = basicForm.jsForm("get");
	equal(updated.steps.length, 6, "6 steps");
	equal(updated.steps[0], 1111, "first element: 1111");
	equal(updated.steps[5], 1112, "last element: 1112");
	equal(updated.test.steps.length, 6, "6 steps in test");
	equal(updated.test.steps[0], 2221, "first element: 2221");
	equal(updated.test.steps[5], 2222, "last element: 2222");

	equal($("#list1", basicForm).children().first().find("input").hasClass("changed"), true, "first input changed");
	equal($("#list1", basicForm).children().eq(2).find("input").hasClass("changed"), false, "second input not changed");
	equal($("#list1", basicForm).children().last().find("input").hasClass("changed"), true, "last input changed");
	equal($("#list2", basicForm).children().first().find("input").hasClass("changed"), true, "first input changed");
	equal($("#list2", basicForm).children().last().find("input").hasClass("changed"), true, "last input changed");

	equal(basicForm.jsForm("changed"), true, "form has changed");
	equal(basicForm.jsForm("equals", original), false, "form data has changed");
	// clean up
	basicForm.remove();
});