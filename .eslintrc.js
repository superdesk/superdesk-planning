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
        requirejs: false,
        arguments: false,
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
        'react/react-in-jsx-scope': 'error',
        'react/jsx-uses-vars': 'error',
        'react/jsx-no-undef': 'error',
        'react/prop-types': 2,
        'react/no-children-prop': 2,
        'react/no-did-update-set-state': 2,
        'react/no-direct-mutation-state': 2,
        'react/no-multi-comp': 2,
        'react/no-render-return-value': 2,
        'react/no-unknown-property': 2,
        'react/no-unused-prop-types': 2,
        'react/self-closing-comp': 2,
        'react/prefer-es6-class': 2,
        'no-trailing-spaces': 'error',
        'object-property-newline': 'error',
        'object-curly-newline': 'error',
        'comma-dangle': ['error', 'always-multiline'],
        'object-curly-spacing':['error', 'always'],
        'no-console': 'error',
        'jasmine/no-disabled-tests': 'warn',
        'block-scoped-var': 2,
        complexity: [2, 10],
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
