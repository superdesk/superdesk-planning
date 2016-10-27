
var path = require('path')
var root = path.dirname(path.dirname(__dirname))

module.exports = {
    options: {configFile: path.join(root, '.eslintrc')},
    app: {
        src: require('./files').scripts,
        envs: ['browser', 'amd']
    },
    tasks: {
        src: '<%= tasksDir %>/**/*.js',
        envs: ['node']
    },
    root: {
        src: path.join(root, '*.js'),
        envs: ['node']
    }
}
