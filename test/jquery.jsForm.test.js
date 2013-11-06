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
   equal($.jsFormControls.Format.decimal(1123456.54), "1,123,456.54", "decimal");
   //$.jsFormControls.Format.dateTime(cdata)
   //$.jsFormControls.Format.date(cdata)
   equal($.jsFormControls.Format.currency(1123456.54), "1,123,456.54", "currency"); 
	
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
	       "groupingSeparator": ",",
	       "decimalSeparator": "."
	     }
	   });
	   
		  
	   equal($.jsFormControls.Format.decimal(1123456.54), "1,123,456.54", "decimal");
	   //$.jsFormControls.Format.dateTime(cdata)
	   //$.jsFormControls.Format.date(cdata)
	   equal($.jsFormControls.Format.currency(1123456.54), "1,123,456.54", "currency"); 

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
	       "format": "#.##0,###",
	       "groupingSeparator": ".",
	       "decimalSeparator": ","
	     }
	   });
	   equal($.jsFormControls.Format.decimal(1123456.54), "1.123.456,54", "decimal");
	   //$.jsFormControls.Format.dateTime(cdata)
	   //$.jsFormControls.Format.date(cdata)
	   equal($.jsFormControls.Format.currency(1123456.54), "1.123.456,54", "currency"); 

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
			simpleNumber: [1, 2, 3],
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
			],
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
