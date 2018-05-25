

/* global beforeEach */

var resetApp = require('./fixtures').resetApp;
var waitForSuperdesk = require('./utils').waitForSuperdesk;
var nav = require('./utils').nav;

function clearStorage() {
    return browser.driver.executeScript('sessionStorage.clear();localStorage.clear();');
}

function openBaseUrl() {
    return browser.get(browser.baseUrl);
}

function resize(width, height) {
    var win = browser.driver.manage().window();

    return win.getSize().then((size) => {
        if (size.width !== width || size.height !== height) {
            return win.setSize(width, height);
        }
    });
}

function openPlanning() {
    return nav('/planning');
}

module.exports.waitForElementByClassName = waitForElementByClassName;
/**
 * @name waitForElementByClassName
 * @param className
 * @description Will wait for element with className to be loaded within 60 seconds
 */
function waitForElementByClassName() {
    return browser.driver.wait(function() {
        return element(by.className('superdesk.flags')).isPresent().then(function(goOn) {
            return goOn === true;
        });
    }, 100000, 'Element with class name superdesk.flags not loaded');
};

module.exports = function(params) {
    // runs before every spec
    beforeEach((done) => {
        require('./waitReady');
        resize(1280, 800)
            .then(() => {
                resetApp(params.fixture_profile, () => {
                    openBaseUrl()
                        .then(clearStorage)
                        .then(openBaseUrl)
                        .then(waitForSuperdesk)
                        .then(openPlanning)
                        .then(done);
                });
            });
    });
};
