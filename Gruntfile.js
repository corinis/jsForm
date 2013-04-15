module.exports = function( grunt ) {

	"use strict";

	var readOptionalJSON = function( filepath ) {
			var data = {};
			try {
				data = grunt.file.readJSON( filepath );
			} catch(e) {}
			return data;
		},
		srcHintOptions = readOptionalJSON("src/.jshintrc");

	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
//		dst: readOptionalJSON("dist/.destination.json"),
		concat: {
			js: {
				src: ["src/jquery.jsForm.js", "src/jquery.jsForm.controls.js"],
				dest: "dist/jquery.jsForm-<%= pkg.version %>.js"
			}
		},
		jshint: {
			dist: {
				src: [ "dist/jquery.jsForm-<%= pkg.version %>.js" ],
				options: srcHintOptions
			},
			grunt: {
				src: [ "Gruntfile.js" ],
				options: {
					jshintrc: ".jshintrc"
				}
			}
//			tests: {
				// TODO: Once .jshintignore is supported, use that instead.
				// issue located here: https://github.com/gruntjs/grunt-contrib-jshint/issues/1
//				src: [ "test/data/{test,testinit,testrunner}.js", "test/unit/**/*.js" ],
//				options: {
//					jshintrc: "test/.jshintrc"
//				}
//			}
		},
		uglify: {
			all: {
				files: {
					"dist/jquery.jsForm.<%= pkg.version %>.min.js": [ "dist/jquery.jsForm-<%= pkg.version %>.js" ]
				},
				options: {
					banner: "/*!\n * jQuery.jsForm v<%= pkg.version %> | (c) 2013 <%=pkg.author.name%> <%=pkg.author.url%>\n * Usage: <%=pkg.homepage%>\n */\n",
					sourceMap: "dist/jquery.jsForm.min.map",
					beautify: {
						ascii_only: true
					}
				}
			}
		}
	});

	// Load grunt tasks from NPM packages
	grunt.loadNpmTasks("grunt-compare-size");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-concat");


	// Short list as a high frequency watch task
	grunt.registerTask( "default", [ "concat:js", "uglify", "jshint" ] );
};

