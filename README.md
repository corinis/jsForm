jquery.jsForm
=============

jQuery based form library to handle data in js objects

It allows you to handle data within a javascript object (like from a JSON request) with plain html.

The main features of this library are:

* Fill standard html with data available in a js object
* Update an existing js object with changes done within a form
* Provide basic functions for formatting (i.e. date/time, money) using html markup
* Provide form validation functionality
* handle collections (arrays) with subobjects
* provides helper methods to handle array manipulation (add new entry/remove an entry) using only html markup
* Can be used in connection with an autocomplete function to add new array objects
* Compatible with jquery ui 
* fully unit tested using qunit

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

# Documentation

## Function

### jsForm(config)

Constructor with the config object:
```javascript
$("#myForm").jsForm({
	data: myDataObject,
	prefix: "customPrefix"
})
```

Note: the default prefix is "data" all fields are accessed through html using the prefix and
	using dot-notation (i.e. prefix.field.value). It is NOT possible to reference into collections
	use javascript for that.

### jsForm("get")
Deserialize the object based on the form and returns the new object. This will analyze any
fields matching the given prefix and update the existing data object.

```javascript
alert(JSON.stringify($("#details").jsForm("get"), null, " "));
```

## jsForm("clear")
Calling this will clear the given form.

```javascript
$("#clear").click(functin(){
	$("#details").jsForm("clear");
});
```


## Dom Layout

### Form Fields
The name attribute is used for matching the object structure.

Following form fields are supported:
* input type="text"
* input type="checkbox"
* input type="password"
* textarea
* select
* input type="file" class="blob": blobs will be converted to base64 
	encoded strings and added to the object. make sure to annotate
	the input with class="blob". This only works for current browsers
	(so no IE<10!)

### Display
You can also jsut display any data by using an element with the class="field":
* <span class="field">prefix.field</span>

Note: the matching is in the content of the field. A name attribute will not work!

### Collections
A collection can contain either primitives (i.e. String, Number) or whole object structures. These have to be handled in the ui and the data structures.

A collection needs two tags: a wrapper with the collection marker, and a container that is used as template.

```html
<div class="collection" data-field="data.links"> <!-- the wrapper -->
	<div> <!--the container -->
		... stuff to be repeated for each element of the collection ...
	</div>
</div>
```

Note: it does not matter what kind of tags are used for wrapper/container. It can be ul/li, tbody/tr, div/span. It is just
	important to note, that only the FIRST CHILD of the wrappter is used as collection. If you have multiple elements,
	they will be ignored.

#### Collection Editing

You can add simple controls for modifying the collection (adding/removing elements). This is accomplished by adding 
specific classes to tags within the collection:

```html
<table>
<tbody class="collection" data-field="data.links"> <!-- the wrapper -->
	<tr> <!--the container -->
		<td><input name="links.href"/></td>
		<td><span class="ui-icon ui-icon-trash delete"></span></td> <!-- class="delete" this control will delete the row -->
	</tr>
</tbody>
</table>
<span class="ui-icon ui-icon-plusthick add" data-field="data.links"></span> <!-- class="add" this control will create a new empty row -->
```

* class="delete": any element with this class within the container will get a click event that removes the current element. 
* class="add" data-field="data.collection": any element OUTSIDE of the wrapper with the class add will act as a trigger 
	for adding a new element

```javascript
$(".collection").on("deleteCollection", function(ev, line, data) {
	// additional code when removing an element in the collection
	alert("deleted: " + data.href);
});

$(".collection").on("addCollection", function(ev, line, data) {
	// additional code when add an element to the collection, i.e. init the data
	data.href = "http://www.example.com";
	data.name = "unknown";
});

```

# Field Validation

Field validation within a JsForm is done by setting the correct classes to the input fields (or textareas).

If there is an issue with a field, it will be marked with the css class "invalid", if everything is correct it will get the class "valid"

* mandatory: at least one non-whitespace character must be in the field
* number: only allows number (can use autoclean to only allow correct input)
* date: you can set the date-format by use the "data-format=''" attribute (java style)
* regexp: do a regular expression check with the value in "data-regexp=''"
