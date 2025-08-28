
module.exports = function( grunt ) {
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
				dest: "js/jquery.jsForm-<%= pkg.version %>.js"
			},
			js2: {
				src: ["src/jquery.jsForm.js", "src/jquery.jsForm.controls.js"],
				dest: "js/jquery.jsForm.js"
			}

		},
		jshint: {
			dist: {
				src: [ "js/jquery.jsForm-<%= pkg.version %>.js" ],
				options: srcHintOptions
			},
			grunt: {
				src: [ "Gruntfile.js" ],
				options: {
					jshintrc: ".jshintrc"
				}
			},
			options: {
				esversion: 2020
			}
		},
		uglify: {
			all: {
				files: {
					"js/jquery.jsForm.min.js": [ "js/jquery.jsForm-<%= pkg.version %>.js" ]
				},
				options: {
					banner: "/*!\n * jQuery.jsForm v<%= pkg.version %> | (c) 2015 <%=pkg.author.name%> <%=pkg.author.url%>\n * Usage: <%=pkg.homepage%>\n */\n",
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
	grunt.registerTask( "default", [ "concat:js", "concat:js2", "uglify" ] );
};

