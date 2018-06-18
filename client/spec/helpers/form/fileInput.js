import path from 'path';
import {map} from 'lodash';

export class FileInput {
    constructor(form) {
        this.row = form.element(by.id('form-row-files'));
        this.element = this.row.element(by.xpath('//input[@name="files"]'));
        this.files = this.row.all(by.className('file-input__file'));
    }

    getValue() {
        return this.files.map((item) => item.getAttribute('textContent'));
    }

    setValue(values) {
        // Return a promise once all the files have been set
        return Promise.all(
            map(values, (filePath) => this.addFile(filePath))
        );
    }

    addFile(filePath) {
        const absolutePath = path.resolve(__dirname, filePath);

        // Make the file input element visible so that protractor can
        // set the file location
        browser.executeScript(
            'arguments[0].className.replace("file-input--hidden", "");',
            this.element.getWebElement()
        );

        return this.element.sendKeys(absolutePath);
    }
}
