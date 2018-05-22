const isFieldEmpty = (field) => field.getText().then((text) => {
    if (text || text !== '') {
        return Promise.resolve(false);
    }

    return Promise.resolve(true);
});

export const inputToField = (field, input) => {
    field.clear();
    browser.wait(() => isFieldEmpty(field), 7500);
    field.sendKeys(input);
};
