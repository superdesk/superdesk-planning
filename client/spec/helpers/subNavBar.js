import {editor} from './editor';
import {listPanel} from './listPanel';


class SubNavBar {
    createEvent() {
        element(by.className('icon-plus-large')).click();
        browser.sleep(150);
        element(by.id('create_event')).click();
        browser.sleep(500);
        editor.waitTillOpen();
    }

    createPlanning() {
        element(by.className('icon-plus-large')).click();
        browser.sleep(150);
        element(by.id('create_planning')).click();
        browser.sleep(500);
        editor.waitTillOpen();
    }

    createAndSaveEvent(data, openToggleBoxes = true) {
        this.createEvent();

        if (openToggleBoxes) {
            editor.openAllToggleBoxes();
        }

        editor.inputValues(data);

        editor.createButton.click();
        browser.wait(
            () => listPanel.getItemCount(),
            30000,
            'Timeout while waiting for the list panel to be populated'
        );

        return editor.closeButton.click();
    }
}

export const subNavBar = new SubNavBar();
