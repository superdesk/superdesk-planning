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
                    tsx: 'js',
                    ts: 'js',
                },
            },
            planning: {
                files: {
                    'po/planning.pot': [
                        'index.ts',
                        'client/**/*.{html,js,jsx,tsx,ts}',
                        '!client/planning-extension/node_modules/**/*',
                    ],
                },
            },
        },
    });

    grunt.registerTask('gettext:extract', [
        'nggettext_extract:planning',
    ]);
};
