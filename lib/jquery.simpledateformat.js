/**
 * <h1>jquery.simpledateformat.js</h1>
 * <h2>Date and time patterns</h2>
 * <ul>
 *  <li>yy = short year</li>
 *  <li><p>yyyy = long year</p></li>
 *  <li><p>M = month (1-12)</p></li>
 *  <li><p>MM = month (01-12)</p></li>
 *  <li><p>MMM = month abbreviation (Jan, Feb … Dec)</p></li>
 *  <li><p>MMMM = long month (January, February … December)</p></li>
 *  <li><p>d = day (1 - 31)</p></li>
 *  <li><p>dd = day (01 - 31)</p></li>
 *  <li><p>ddd = day of the week in words (Monday, Tuesday … Sunday)</p></li>
 *  <li><p>h = hour in am/pm (0-12)</p></li>
 *  <li><p>hh = hour in am/pm (00-12)</p></li>
 *  <li><p>HH = hour in day (00-23)</p></li>
 *  <li><p>mm = minute</p></li>
 *  <li><p>ss = second</p></li>
 *  <li><p>SSS = milliseconds</p></li>
 *  <li><p>a = am/pm marker</p></li>
 * </ul>
 * <h2>Usage</h2>
 * <code>$.simpledateformat.format(new Date(), "dd/MM/yyyy hh:mm:ss");</code><br/>
 * <code>$.simpledateformat.format(100, "hh:mm:ss");</code><br/>
 * @based https://github.com/phstc/jquery-dateFormat
 * @license MIT License GPL
 * @contributor albertjan, christopherstott, cipa, dahdread, docchang, eemeyer, gwilson2151, jafin, jakemonO, jharting, kitto, larryzhao, leesolutions, nashg842, fuzzygroove, stuttufu, thiloplanz, Zyber17.
 */
"use strict";

;(function ($) {

	var daysInWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var shortMonthsInYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var longMonthsInYear = ["January", "February", "March", "April", "May", "June",
	                        "July", "August", "September", "October", "November", "December"];
	var shortMonthsToNumber = [];
	shortMonthsToNumber["Jan"] = "01";
	shortMonthsToNumber["Feb"] = "02";
	shortMonthsToNumber["Mar"] = "03";
	shortMonthsToNumber["Apr"] = "04";
	shortMonthsToNumber["May"] = "05";
	shortMonthsToNumber["Jun"] = "06";
	shortMonthsToNumber["Jul"] = "07";
	shortMonthsToNumber["Aug"] = "08";
	shortMonthsToNumber["Sep"] = "09";
	shortMonthsToNumber["Oct"] = "10";
	shortMonthsToNumber["Nov"] = "11";
	shortMonthsToNumber["Dec"] = "12";

	$.simpledateformat = (function () {
		function strDay(value) {
			return daysInWeek[parseInt(value, 10)] || value;
		}

		function strMonth(value) {
			var monthArrayIndex = parseInt(value, 10) - 1;
			return shortMonthsInYear[monthArrayIndex] || value;
		}

		function strLongMonth(value) {
			var monthArrayIndex = parseInt(value, 10) - 1;
			return longMonthsInYear[monthArrayIndex] || value;
		}

		var parseMonth = function (value) {
			return shortMonthsToNumber[value] || value;
		};

		var parseTime = function (value) {
			var retValue = value;
			var millis = "";
			if (retValue.indexOf(".") !== -1) {
				var delimited = retValue.split('.');
				retValue = delimited[0];
				millis = delimited[1];
			}

			var values3 = retValue.split(":");

			if (values3.length === 3) {
				return {
					time: retValue,
					hour: values3[0],
					minute: values3[1],
					second: values3[2],
					millis: millis
				};
			} else {
				return {
					time: "",
					hour: "",
					minute: "",
					second: "",
					millis: ""
				};
			}
		};

		return {
			format: function (value, format) {
				/*
					value = new java.util.Date()
					2009-12-18 10:54:50.546
				 */
				try {
					var date = null;
					var year = null;
					var month = null;
					var dayOfMonth = null;
					var dayOfWeek = null;
					var time = null;
					
					// convert number to date
					if (typeof value == "number"){
						value = new Date(value);
					}
						
					if ($.isFunction(value.getFullYear)) {
						year = value.getFullYear();
						month = value.getMonth() + 1;
						dayOfMonth = value.getDate();
						dayOfWeek = value.getDay();
						time = {
								time: "",
								hour: value.getHours(),
								minute: value.getMinutes(),
								second: value.getSeconds(),
								millis: value.getMilliseconds()
						};
					} else if (value.search(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d{0,3}[Z\-+]?(\d{2}:?\d{2})?/) != -1) {
						/* 2009-04-19T16:11:05+02:00 || 2009-04-19T16:11:05Z */
						var values = value.split(/[T\+-]/);
						year = values[0];
						month = values[1];
						dayOfMonth = values[2];
						time = parseTime(values[3].split(".")[0]);
						date = new Date(year, month - 1, dayOfMonth);
						dayOfWeek = date.getDay();
					} else {
						var values = value.split(" ");
						switch (values.length) {
						case 6:
							/* Wed Jan 13 10:43:41 CET 2010 */
							year = values[5];
							month = parseMonth(values[1]);
							dayOfMonth = values[2];
							time = parseTime(values[3]);
							date = new Date(year, month - 1, dayOfMonth);
							dayOfWeek = date.getDay();
							break;
						case 2:
							/* 2009-12-18 10:54:50.546 */
							var values2 = values[0].split("-");
							year = values2[0];
							month = values2[1];
							dayOfMonth = values2[2];
							time = parseTime(values[1]);
							date = new Date(year, month - 1, dayOfMonth);
							dayOfWeek = date.getDay();
							break;
						case 7:
							/* Tue Mar 01 2011 12:01:42 GMT-0800 (PST) */
						case 9:
							/*added by Larry, for Fri Apr 08 2011 00:00:00 GMT+0800 (China Standard Time) */
						case 10:
							/* added by Larry, for Fri Apr 08 2011 00:00:00 GMT+0200 (W. Europe Daylight Time) */
							year = values[3];
							month = parseMonth(values[1]);
							dayOfMonth = values[2];
							time = parseTime(values[4]);
							date = new Date(year, month - 1, dayOfMonth);
							dayOfWeek = date.getDay();
							break;
						case 1:
							/* added by Jonny, for 2012-02-07CET00:00:00 (Doctrine Entity -> Json Serializer) */
							var values2 = values[0].split("");
							year=values2[0]+values2[1]+values2[2]+values2[3];
							month= values2[5]+values2[6];
							dayOfMonth = values2[8]+values2[9];
							time = parseTime(values2[13]+values2[14]+values2[15]+values2[16]+values2[17]+values2[18]+values2[19]+values2[20]);
							date = new Date(year, month - 1, dayOfMonth);
							dayOfWeek = date.getDay();
							break;
						default:
							return value;
						}
					}

					var pattern = "";
					var retValue = "";
					var unparsedRest = "";
					/*
Issue 1 - variable scope issue in format.date
Thanks jakemonO
					 */
					for (var i = 0; i < format.length; i++) {
						var currentPattern = format.charAt(i);
						
						pattern += currentPattern;
						unparsedRest = "";
						switch (pattern) {
						case "ddd":
							retValue += strDay(dayOfWeek);
							pattern = "";
							break;
						case "dd":
							if (format.charAt(i + 1) == "d") {
								break;
							}
							if (String(dayOfMonth).length === 1) {
								dayOfMonth = '0' + dayOfMonth;
							}
							retValue += dayOfMonth;
							pattern = "";
							break;
						case "d":
							if (format.charAt(i + 1) == "d") {
								break;
							}
							retValue += parseInt(dayOfMonth, 10);
							pattern = "";
							break;
						case "MMMM":
							retValue += strLongMonth(month);
							pattern = "";
							break;
						case "MMM":
							if (format.charAt(i + 1) === "M") {
								break;
							}
							retValue += strMonth(month);
							pattern = "";
							break;
						case "MM":
							if (format.charAt(i + 1) == "M") {
								break;
							}
							if (String(month).length === 1) {
								month = '0' + month;
							}
							retValue += month;
							pattern = "";
							break;
						case "M":
							if (format.charAt(i + 1) == "M") {
								break;
							}
							retValue += parseInt(month, 10);
							pattern = "";
							break;
						case "yyyy":
							retValue += year;
							pattern = "";
							break;
						case "yy":
							if (format.charAt(i + 1) == "y" &&
									format.charAt(i + 2) == "y") {
								break;
							}
							retValue += String(year).slice(-2);
							pattern = "";
							break;
						case "HH":
						case "hh":
							/* time.hour is "00" as string == is used instead of === */
							var hour = (time.hour == 0 ? 12 : time.hour < 13 ? time.hour : time.hour - 12);
							hour = hour < 10 ? '0' + hour : hour;
							retValue += hour;
							pattern = "";
							break;
						case "h":
							if (format.charAt(i + 1) == "h") {
								break;
							}
							var hour = (time.hour == 0 ? 12 : time.hour < 13 ? time.hour : time.hour - 12);
							retValue += hour;
//							Fixing issue https://github.com/phstc/jquery-dateFormat/issues/21
//							retValue = parseInt(retValue, 10);
							pattern = "";
							break;
						case "mm":
							retValue += (time.minute < 10 ? '0' : '') + time.minute;
							pattern = "";
							break;
						case "ss":
							/* ensure only seconds are added to the return string */
							retValue += (time.second < 10 ? '0' : '') + time.second.substring(0, 2);
							pattern = "";
							break;
						case "SSS":
							retValue += time.millis.substring(0, 3);
							pattern = "";
							break;
						case "a":
							retValue += time.hour >= 12 ? "PM" : "AM";
							pattern = "";
							break;
						case " ":
							retValue += currentPattern;
							pattern = "";
							break;
						case ".":
							retValue += currentPattern;
							pattern = "";
							break;
						case "/":
							retValue += currentPattern;
							pattern = "";
							break;
						case ":":
							retValue += currentPattern;
							pattern = "";
							break;
						default:
							if (pattern.length === 2 && pattern.indexOf("y") !== 0 && pattern != "SS") {
								retValue += pattern.substring(0, 1);
								pattern = pattern.substring(1, 2);
							} else if ((pattern.length === 3 && pattern.indexOf("yyy") === -1)) {
								pattern = "";
							} else {
								unparsedRest = pattern;
							}
						}
					}
					retValue += unparsedRest;
					return retValue;
				} catch (e) {
					console.log(e);
					return value;
				}
			}
		};
	}());
}(jQuery));