jquery.jsForm
=============

jQuery based form library to handle data in js objects

It allows you to handle data within a javascript object (like from a JSON request) with plain html.

The main features of this library are:

* Full standard html with data available in a js object
* Update an existing js object with changes done within a form
* Provide basic functions for formatting (i.e. date/time, money) using html markup
* Provide form validation functionality
* handle collections (arrays) with subobjects
* provides helper methods to handle array manipulation (add new entry/remove an entry) using only html markup
* Can be used in connection with an autocomplete function to add new array objects
* Compatible with jquery ui 
* fully unit tested using qunit
* jslint clean
* Minified+Gzipped: 6kb

# Download

Current Version: 1.0.5

* [Minified](https://github.com/corinis/jsForm/raw/master/dist/jquery.jsForm-1.0.5.min.js) + [map](https://raw.github.com/corinis/jsForm/master/dist/jquery.jsForm.min.map)
* [Source](https://github.com/corinis/jsForm/raw/master/dist/jquery.jsForm-1.0.5.js)

# Documentation

can be found in the github wiki:

* [Dom Layout](https://github.com/corinis/jsForm/wiki/JsForm-Dom-Layout)
* [API Documentation](https://github.com/corinis/jsForm/wiki/JsForm-Documentation)
* [Form Controls and Validation](https://github.com/corinis/jsForm/wiki/Controls)


# Quickstart

* Start with a simple html to show you the basic usage [download sample](https://raw.github.com/corinis/jsForm/master/sample.html):

```html
<html>
<head>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="https://raw.github.com/corinis/jsForm/master/src/jquery.jsForm.js"></script>
<script>
$(function(){
	// some json data
	var jsonData = {
		name: "TestName",	// standard inputs
		description: "long Description\nMultiline",	// textarea
		links: [{href:'http://www.gargan.org',description:'Gargan.org'},{href:'http://www.github.com',description:'GitHub'}],	// lists
		active: true,	// checkbox
		state: "VISIBLE"	// selects (enums)
	};

	// initialize the form, prefix is optional and defaults to data
	$("#details").jsForm({
		data:jsonData
	});

	$("#show").click(function() {
		// show the json data
		alert(JSON.stringify($("#details").jsForm("get"), null, " "));
	});
});
</script>
</head>
<body>
<h1>Simpel Form Test</h1>
<div id="details">
	Name: <input name="data.name"/><br/>
	<input type="checkbox" name="data.active"/> active<br/>
	<textarea name="data.description"></textarea><br/>
	<select name="data.state">
		<option value="VISIBLE">visible</option>
		<option value="IMPORTANT">important</option>
		<option value="HIDDEN">hidden</option>		
	</select>
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
