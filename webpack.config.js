var path = require('path');
var webpack = require('webpack');

const isExternalDependency = (absolutePath) => {
    if (
        absolutePath.includes('/node_modules/date-fns/')
        || absolutePath.includes('/@sourcefabric/date-fns-tz/')
    ) {
        return false;
    }

    return absolutePath.match(/node_modules\/(?!(superdesk-core)\/).*/) != null;
};

module.exports = {
    entry: [path.join(__dirname, 'index')],
    devtool: 'inline-source-map', // just do inline source maps instead of the default
    output: {
        path: path.join(process.cwd(), 'dist'),
        filename: 'app.bundle.js',
    },
    resolve: {
        modules: [
            __dirname,
            path.join(__dirname, 'client'),
            path.join(__dirname, 'node_modules/superdesk-core'),
            path.join(__dirname, 'node_modules/superdesk-core/scripts'),
            path.join(__dirname, 'node_modules/superdesk-core/styles/sass'),
            'node_modules',
        ],
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
        alias: {
            images: path.resolve(__dirname, 'node_modules/superdesk-core/images'),
            'draft-js': '@sourcefabric/draft-js',
            // Force single React version to avoid "Invalid hook call" errors
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)?$/,
                exclude: isExternalDependency,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                },
            },
            {
                test: /\.(js|jsx)?$/,
                exclude: isExternalDependency,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                },
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
                loader: 'file-loader',
            },
        ],
    },
    externals: {
        cheerio: 'window',
        'react/addons': true,
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': true,
    },

    // Define mock gettext ('required when running unit_tests for planning)
    plugins: [
        new webpack.DefinePlugin({
            gettext: 'function gettext(msg) { return msg; }',
            __SUPERDESK_CONFIG__: JSON.stringify({view: {}}),
        }),
    ],
};
