var path = require('path');

module.exports = {
    entry: './index.js',
    devtool: 'inline-source-map', //just do inline source maps instead of the default
    output: {
        path: path.join(process.cwd(), 'dist'),
        filename: 'app.bundle.js',
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel',
                query: {
                    cacheDirectory: true,
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.html$/,
                loader: 'html'
            },
            {
                test: /\.css/,
                loader: 'style!css'
            },
            {
                test: /\.scss$/,
                loader: 'style!css!sass'
            }
        ]
    },
    externals: {
        cheerio: 'window',
        'react/addons': true,
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': true
    }
};
