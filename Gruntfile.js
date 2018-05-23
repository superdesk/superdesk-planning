var path = require('path');

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-webpack');

    var config = {
        appDir: './node_modules/superdesk-core/app',
        tmpDir: '.tmp',
        specDir: 'spec',
        tasksDir: 'tasks',
        nggettext_extract: {
            options: {
                // add jsx
                extensions: {
                    htm: 'html',
                    html: 'html',
                    js: 'js',
                    jsx: 'js',
                },
            },
            planning: {
                files: {
                    'po/planning.pot': ['index.js', 'client/**/*.{html,js,jsx}'],
                },
            },
        },
        livereloadPort: 35729,
    };

    grunt.initConfig(config);

    // Auto-load configuration
    require('load-grunt-config')(grunt, {
        config: config,
        configPath: path.join(__dirname, 'tasks', 'options'),
    });

    grunt.registerTask('gettext:extract', [
        'nggettext_extract:planning',
    ]);

    // Development server
    grunt.registerTask('build', [
        'clean',
    ]);
};
