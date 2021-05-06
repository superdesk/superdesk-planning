const path = require('path');
const dir = path.join(require.resolve('superdesk-core/package.json'), '../tasks/build-extensions');


const execSync = require('child_process').execSync;

execSync(`cp -r ${dir} ./`, {stdio: 'inherit'});
execSync('node build-extensions/index.js', {stdio: 'inherit'});
execSync('rm -r build-extensions', {stdio: 'inherit'});
