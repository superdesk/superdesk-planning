import {forEach, set} from 'lodash';
import {Popup} from './popup';
import {ActionMenu} from './actionMenu';
import {getInputHelper} from './form';
import {waitAndClick, waitPresent, waitNotPresent} from './utils';

class Editor {
    constructor() {
        this.editors = element.all(by.className('sd-edit-panel'));
        this.editor = element.all(by.className('sd-edit-panel')).first();
        this.eventType = this.editor.all(by.className('icon-event'));
        this.planningType = this.editor.all(by.css('.icon-calendar.icon--2x.icon--light-blue'));
        this.postState = this.editor.all(by.className('label--success')).first();
        this.unpostState = this.editor.all(by.className('label--warning')).first();

        this.nameField = this.editor.element(by.xpath('//input[@name="name"]'));
        this.slugField = this.editor.element(by.xpath('//input[@name="slugline"]'));
        this.fromDateField = this.editor.element(by.xpath('//input[@name="dates.start.date"]'));
        this.planningDate = this.editor.element(by.xpath('//input[@name="planning_date.date"]'));
        this.countField = this.editor.element(by.xpath('//input[@name="count"]'));
        this.untilDateField = this.editor.element(by.xpath('//input[@name="dates.recurring_rule.until"]'));

        this.createButton = this.editor.element(by.id('create'));
        this.closeButton = this.editor.element(by.id('close'));
        this.postButton = this.editor.element(by.id('post'));
        this.unpostButton = this.editor.element(by.id('unpost'));
        this.saveButton = this.editor.element(by.id('save'));
        this.repeatButton = this.editor.element(by.xpath('//button[@name="dates.recurring"]'));
        this.allDayButton = this.editor.element(by.xpath('//button[@name="dates.all_day"]'));
        this.minimizeButton = this.editor.element(by.xpath('//button[@title="Minimise"]'));

        this.createCoverageButton = this.editor.element(by.xpath('//button[@title="Create new coverage"]'));
        this.textCoverageOption = this.editor.element(by.xpath('//button[@id="coverage-menu-add-text"]'));
        this.editAssignmentButton = this.editor.element(by.xpath('//button[@id="editAssignment"]'));

        this.actionMenu = new ActionMenu(this.editor);
    }

    isItemPosted() {
        return this.postState.getText().then((text) => {
            if (text === 'SCHEDULED') {
                return Promise.resolve(true);
            } else {
                return Promise.resolve(false);
            }
        });
    }

    isItemUnposted() {
        return this.unpostState.getText().then((text) => {
            if (text === 'KILLED') {
                return Promise.resolve(true);
            } else {
                return Promise.resolve(false);
            }
        });
    }

    inputValues(event) {
        forEach(
            event,
            (value, field) => {
                getInputHelper(this.editor, field).setValue(value);
                // After uploading a file, editor reloads
                // So, open the toggle boxes back
                if (field === 'files') {
                    this.openAllToggleBoxes();
                }
            });

        return browser.actions()
            .sendKeys(protractor.Key.TAB)
            .perform();
    }

    expectValues(event) {
        forEach(
            event,
            (value, field) => expect(getInputHelper(this.editor, field).getValue(value)).toEqual(value)
        );
    }

    openAllToggleBoxes() {
        const xpath = '//div[@class="toggle-box toggle-box--circle hidden"]/a';

        // Wait for the Toggle boxes to be visible before opening them
        waitPresent(this.editor.all(by.xpath(xpath)));
        this.editor.all(by.xpath(xpath))
            .each((toggleHeader) => waitAndClick(toggleHeader));
    }

    addCoverageToWorkflow(index, plan) {
        // Open the coverage
        const coverageBox = this.editor.all(by.className('sd-collapse-box')).get(0);

        waitAndClick(coverageBox);

        const itemAction = coverageBox.element(by.id(`coverages[${index}]-item-actions`));

        waitAndClick(itemAction);

        let menuPopup = new Popup();
        let menu = menuPopup.getMenu('item-actions-menu__popup');

        return waitAndClick(menu.element(by.id('addToWorkflow'))).
            then(() => set(plan, 'coverages[0].assigned_to.state', 'ASSIGNED'));
    }

    waitTillOpen(button = null) {
        return waitPresent(button || this.closeButton);
    }

    waitTillClose() {
        return waitNotPresent(this.closeButton);
    }
}

export const editor = new Editor();