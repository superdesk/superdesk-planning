var path = require('path')

module.exports = {
    entry: [path.join(__dirname, 'index')],
    devtool: 'inline-source-map', //just do inline source maps instead of the default
    output: {
        path: path.join(process.cwd(), 'dist'),
        filename: 'app.bundle.js',
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json']
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    plugins: ['transform-object-rest-spread'],
                    cacheDirectory: true,
                    presets: ['es2015', 'react'],
                }
            },
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.json$/,
                use: ['json-loader']
            },
            {
                enforce: 'post',
                test: /\.jsx?/,
                loader: 'istanbul-instrumenter-loader',
                exclude: [
                    /node_modules\//,
                    /client\/index\.js/,
                    /_test\.jsx?/,
                    /tests\.js/,
                    /client\/controllers\//
                ]
            }
        ],
    },
    externals: {
        cheerio: 'window',
        'react/addons': true,
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': true
    }
}
