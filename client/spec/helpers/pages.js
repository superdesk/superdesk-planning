/* eslint-disable newline-per-chained-call */


exports.login = LoginModal;
exports.logout = logout;

require('./waitReady');

function LoginModal() {
    this.username = element(by.model('username'));
    this.password = element(by.model('password'));
    this.btn = element(by.id('login-btn'));
    this.error = element(by.css('p.error'));

    this.login = function(username, password) {
        var self = this;
        let usr = username || browser.params.username;
        let pwd = password || browser.params.password;

        return self.username.waitReady()
            .then(() => self.username.clear())
            .then(() => self.username.sendKeys(usr))
            .then(() => self.password.sendKeys(pwd))
            .then(() => self.btn.click());
    };
}

function logout() {
    var signOutBtn = element(by.buttonText('SIGN OUT'));

    element(by.css('button.current-user')).click();

    browser.wait(() => signOutBtn.isDisplayed(), 200);

    signOutBtn.click();
    browser.sleep(500);
    browser.refresh();
}
