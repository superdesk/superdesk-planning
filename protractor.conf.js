

var path = require('path');
require('ts-node/register/transpile-only');

function getChromeOptions() {
    var chromeOptions = {
        args: ['--no-sandbox', '--headless', 'window-size=1920,1080'],
    };

    if (process.env.CHROME_BIN) {
        chromeOptions.binary = process.env.CHROME_BIN;
    }

    return chromeOptions;
}

var config = {
    allScriptsTimeout: 34000,
    getPageTimeout: 200000,
    baseUrl: 'http://localhost:9000',
    params: {
        baseBackendUrl: 'http://localhost:5000/api/',
        username: 'admin',
        password: 'admin',
    },

    suites: {
        a: path.join(__dirname, '/client/spec/**/[a-f]*[Ss]pec.js'),
        b: path.join(__dirname, '/client/spec/**/[g-m]*[Ss]pec.js'),
        c: path.join(__dirname, '/client/spec/**/[n-z]*[Ss]pec.js'),
    },

    framework: 'jasmine2',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 200000,
    },

    capabilities: {
        browserName: 'chrome',
        chromeOptions: getChromeOptions(),
    },

    directConnect: true,

    onPrepare: function() {
        require('./client/spec/helpers/setup')({fixture_profile: 'planning_prepopulate_data'});

        // so it can be used without import in tests
        // useful when debugging on CI server
        browser.screenshot = require('superdesk-core/spec/helpers/utils').screenshot;

        var reporters = require('jasmine-reporters');

        jasmine.getEnv().addReporter(
            new reporters.JUnitXmlReporter({
                savePath: 'e2e-test-results',
                consolidateAll: true,
            })
        );
        function CustomReporter() {
            this.specDone = function(result) {
                if (result.failedExpectations.length > 0) {
                    browser.screenshot(result.fullName.replace(/[^\w]+/g, '-'));
                }
            };
        }
        jasmine.getEnv().addReporter(new CustomReporter());
    },
};

exports.config = config;

