module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-angular-gettext');

    grunt.initConfig({
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
    });

    grunt.registerTask('gettext:extract', [
        'nggettext_extract:planning',
    ]);
};
