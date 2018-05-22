import {resetApp} from 'superdesk-core/spec/helpers/fixtures';
import {waitForSuperdesk} from 'superdesk-core/spec/helpers/utils';
import {nav} from 'superdesk-core/spec/helpers/utils';

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

module.exports = function(params) {
    // runs before every spec
    beforeEach((done) => {
        require('superdesk-core/spec/helpers/waitReady');
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
