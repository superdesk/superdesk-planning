'use strict'

var path = require('path')

module.exports = function(grunt) {

    // util for grunt.template
    grunt.toJSON = function(input) {
        return JSON.stringify(input)
    }

    var config = {
        pkg: grunt.file.readJSON(path.join(__dirname, 'package.json')),
        appDir: 'client',
        tasksDir: 'tasks',
        livereloadPort: 35729
    }

    grunt.initConfig(config)

    require('load-grunt-tasks')(grunt, {config: path.join(__dirname, 'package')})
    require('load-grunt-config')(grunt, {
        config: config,
        configPath: path.join(__dirname, 'tasks', 'options')
    })

    grunt.registerTask('hint', ['jshint', 'jscs', 'eslint'])

}
