
var path = require('path')
var root = path.dirname(path.dirname(__dirname))

var files = []
files.push.apply(files, require('./files').scripts)

module.exports = {
    options: {
        config: path.join(root, '.jscs.json')
    },
    all: {src: files}
}
