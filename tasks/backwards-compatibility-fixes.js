var fs = require('fs');
var path = require('path');

const filePath = path.resolve(`${__dirname}/../node_modules/superdesk-core/scripts/core/get-superdesk-api-implementation.tsx`);

if (fs.existsSync(filePath) !== true) {
    fs.writeFileSync(filePath, `export function getSuperdeskApiImplementation() {return {}; }\n`);
}