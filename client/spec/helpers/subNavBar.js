export const createEvent = (action) => {
    element(by.className('icon-plus-large')).click();
    element(by.id('create_event')).click();
    browser.sleep(500);
};

export const createPlanning = (action) => {
    element(by.className('icon-plus-large')).click();
    element(by.id('create_planning')).click();
    browser.sleep(500);
};
