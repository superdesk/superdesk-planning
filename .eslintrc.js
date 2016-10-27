module.exports = {
    env: {
        browser: true,
        commonjs: true,
        jasmine: true,
        es6: true
    },
    extends: ['eslint:recommended', 'plugin:jasmine/recommended'],
    globals: {
        $: false,
        $$: false,
        _: false,
        angular: false,
        browser: false,
        by: false,
        element: false,
        gettext: false,
        inject: false,
        protractor: false,
        requirejs: false
    },
    parserOptions: {
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
            jsx: true
        },
        sourceType: 'module'
    },
    plugins: [
        'react',
        'jasmine'
    ],
    rules: {
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react/jsx-no-undef': 'error',
        'no-console': 'error',
        'jasmine/no-disabled-tests': 'warn',
        indent: [
            'error',
            4,
            { SwitchCase: 1 }
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        quotes: [
            'error',
            'single'
        ],
        semi: [
            'error',
            'never'
        ]
    }
}
