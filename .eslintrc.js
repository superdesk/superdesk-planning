const sharedConfigs = require('superdesk-code-style');

module.exports = Object.assign({}, sharedConfigs, {
    parser: '@typescript-eslint/parser',
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            rules: {
                'no-unused-vars': 0,
                'no-undef': 0,
                'comma-dangle': 0,
                'camelcase': 0,
                'no-prototype-builtins': 0, // allow hasOwnProperty
            },
        },
        {
            files: ['*.js', '*.jsx'],
            rules: {
                'no-empty-pattern': 0,
                'no-prototype-builtins': 0, // allow hasOwnProperty
            },
        },
        {
            files: ['*.d.ts'],
            rules: {
                'spaced-comment': 0,
            },
        },
    ],
});

