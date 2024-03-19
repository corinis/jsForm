jquery.jsForm
=============

jQuery based form library that allows you to handle data within a javascript object (like from a JSON request) with plain html forms.

This is a library allowing a binding between html and a javascript object as described in [MVVM](http://en.wikipedia.org/wiki/Model_View_ViewModel) similar to other libraries like [knockout.js](http://knockoutjs.com/) or [AngularJs](http://angularjs.org/). 
JsForm only takes care of the rendering of data in a html. The controller can be written in standard jQuery. This keeps the library clean and simple.


The main features of this library are:

* Use html markup to fill your forms/page with almost any js object dynamically 
* Update an existing js object with changes done within a form (=manipulate data without extra code)
* Provide basic functions for formatting (i.e. date/time, money, byte) using html markup
* Provide form validation functionality
* handle collections (arrays) with subobjects
* handle binaries (blobs) within json by converting them to data url
* provides helper methods to handle array manipulation (add new entry/remove an entry) using only html markup
* Can be used in connection with an autocomplete function to add new array objects
* Compatible with [bootstrap](https://getbootstrap.com/), [jQuery UI](http://jqueryui.com/) and [jQuery Mobile](http://jquerymobile.com/) and other frameworks by working directly on the DOM
* addon library for form controls and layouting (comes bundled in the minified version), internationalisation
* unit tested using [QUnit](http://www.gargan.org/jsform/test/test.jquery.jsForm.html)
* jslint clean
* Minified+Gzipped: 7kb

You can also check out some [Demos](http://www.gargan.org/jsform/index.jsp).

# Libraries

## Required
* [jQuery](http://jquery.com/) 1.9 or higher
* [luxon](https://moment.github.io/luxon/) Luxon for Date/Time Formatting

## Optional

Optional Libraries are used with jquery.jsForm.controls.js to allow various input methods:

* [jQuery Format Plugin](http://www.asual.com/jquery/format/) 1.2 or higher- used when working with date/number formats
* [clockpicker](https://weareoutman.github.io/clockpicker/) used to display a clock input using input class="time"
* [flatpickr](https://flatpickr.js.org) date and dateTime control (class="date" or class="dateTime") 
* [datetimepicker](https://eonasdan.github.io/bootstrap-datetimepicker/) alternative datetime picker (class="date" or class="dateTime")
* [Moment.js](http://momentjs.com/) allows for finer grained international date support (deprecated) -> use [luxon](https://moment.github.io/luxon/)

# Download

Current Version: 1.5.4

* [Minified](https://github.com/corinis/jsForm/raw/master/js/jquery.jsForm.min.js)
* [Combined Source](https://github.com/corinis/jsForm/raw/master/js/jquery.jsForm.js)
 
On bower.io:
```
bower install jquery-jsform --save
```

# Documentation

can be found in the github wiki:

* [Dom Layout](https://github.com/corinis/jsForm/wiki/JsForm-Dom-Layout) tells you how you can/should structure your html
* [API Documentation](https://github.com/corinis/jsForm/wiki/JsForm-Documentation) for the javascript options 
* [Form Controls and Validation](https://github.com/corinis/jsForm/wiki/Controls) additional formatting/validating controls

# Custom UI Controls

Additionally to the base form, I created some custom controls. There might be much more powerful versions out there,
but the aim here is to have simple to use controls that are compatible with the json-approach of jsForm and also 
compatible to jquery-ui. 
* [Tree](https://github.com/corinis/jsForm/wiki/Tree)
 - [jquery.tree.js](https://raw.github.com/corinis/jsForm/master/controls/jquery.tree.js)
 - [jquery.tree.css](https://raw.github.com/corinis/jsForm/master/controls/jquery.tree.css)
* [Sortable Table](https://github.com/corinis/jsForm/wiki/Sortable-Table)
 - [jquery.sorTable.js](https://raw.github.com/corinis/jsForm/master/controls/jquery.sorTable.js)
* [jquery.responsiveDialog.js](https://github.com/corinis/jsForm/wiki/jquery.responsiveDialog.js) Plugin which extends the default jquery.ui dialog to be more responsive

 
# Quickstart

* Start with a simple html to show you the basic usage [download sample](https://raw.github.com/corinis/jsForm/master/sample.html) [view life](http://www.gargan.org/jsform/index.jsp).
:

```html
<html>
<head>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="https://raw.github.com/corinis/jsForm/master/src/jquery.jsForm.js"></script>
<script>
$(function(){
	// some json data
	var jsonData = {
		name: "TestName",	// standard inputs
		description: "long Description\nMultiline",	// textarea
		links: [{href:'http://www.gargan.org',description:'Gargan.org'},{href:'http://www.github.com',description:'GitHub'}],	// lists
		active: true,	// checkbox
		type: "COOL", // radio (enums)
		state: "VISIBLE",	// selects (enums)
	};

	// initialize the form, prefix is optional and defaults to data
	$("#details").jsForm({ data:jsonData });

	$("#show").click(function() {
		// show the json data
		alert(JSON.stringify($("#details").jsForm("get"), null, " "));
	});
});
</script>
</head>
<body>
<h1>Simple Form Test</h1>
<div id="details">
	Name: <input name="data.name"/><br/>
	<input type="checkbox" name="data.active"/> active<br/>
	<textarea name="data.description"></textarea><br/>
	<select name="data.state">
		<option value="VISIBLE">visible</option>
		<option value="IMPORTANT">important</option>
		<option value="HIDDEN">hidden</option>		
	</select>
	<br/>
	<input type="radio" name="data.type" value="COOL"/> Cool<br/>
	<input type="radio" name="data.type" value="HOT"/> Hot<br/>
	<input type="radio" name="data.type" value="WARM"/> Warm<br/>
	<fieldset>
		<legend>Links</legend>
		<ul class="collection" data-field="data.links">
			<li><span class="field">links.description</span> Link: <input name="links.href"/> <button class="delete">x</button></li>
		</ul>
	</fieldset>
	<button class="add" data-field="data.links">add a link</button><br/>
	Additional field: <input name="data.addedField"/>
</div>
<button id="show">Show Object</button>
</body>
</html>
```

## Also check out the other samples:

[view life demos](http://www.gargan.org/jsform/index.jsp)

 * [complex json with collections within collections](https://raw.github.com/corinis/jsForm/master/complex-sample.html)
 * [complex json with collections, sortable and editable](https://raw.github.com/corinis/jsForm/master/sortable-editable-sample.html)
 * [select from a given list of objects](https://raw.github.com/corinis/jsForm/master/sample-multiselect.html)
 * [show elements based on conditions within the data](https://raw.github.com/corinis/jsForm/master/sample-conditional.html)
 * [use the tagit control to select from a list of objects](https://raw.github.com/corinis/jsForm/master/autocomplete-form-tagit.html)
 
