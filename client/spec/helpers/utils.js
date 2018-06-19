export const isFieldEmpty = (field) => field.getAttribute('value').then((text) => {
    if (text || text !== '') {
        return Promise.resolve(false);
    }

    return Promise.resolve(true);
});

export const inputToField = (field, input) => {
    field.clear();
    browser.wait(
        () => isFieldEmpty(field),
        7500,
        'Timeout while waiting for an input field to be cleared'
    );
    field.sendKeys(input);
};

export const waitClickable = (domElement, timeout) => (
    browser.wait(
        protractor.ExpectedConditions.elementToBeClickable(domElement),
        timeout,
        'Timeout while waiting for an element to be clickable'
    )
);

export const waitPresent = (domElement, timeout = 7500) => (
    browser.wait(
        () => domElement.isPresent(),
        timeout,
        'Timeout while waiting for an element to be visible'
    )
);

export const waitAndClick = (domElement, timeout = 7500) => {
    waitClickable(domElement, timeout);
    browser.actions()
        .mouseMove(domElement)
        .click()
        .perform();
};

export const hasClass = (domElement, className) => (
    domElement.getAttribute('class')
        .then((classes) => classes.split(' ').indexOf(className) !== -1)
);

export const isCount = (domElement, count) => (
    domElement.count()
        .then((numElements) => Promise.resolve(numElements >= count))
);
