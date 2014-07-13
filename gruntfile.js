'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        jshint: {
            options: JSON.parse(require('fs').readFileSync('.jshintrc')),
            all: ['**/*.js', 'bin/n_', '!node_modules/**/*', '!coverage/**/*']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', 'jshint');
};
