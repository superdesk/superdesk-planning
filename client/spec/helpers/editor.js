import {forEach} from 'lodash';

import {getInputHelper} from './form';
import {waitAndClick} from './utils';

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


        this.createButton = this.editor.element(by.id('create'));
        this.closeButton = this.editor.element(by.id('close'));
        this.postButton = this.editor.element(by.id('post'));
        this.unpostButton = this.editor.element(by.id('unpost'));
        this.repeatButton = this.editor.element(by.xpath('//button[@name="dates.recurring"]'));
        this.allDayButton = this.editor.element(by.xpath('//button[@name="dates.all_day"]'));
        this.minimizeButton = this.editor.element(by.xpath('//button[@title="Minimise"]'));
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
            (value, field) => getInputHelper(this.editor, field).setValue(value)
        );
    }

    expectValues(event) {
        forEach(
            event,
            (value, field) => expect(getInputHelper(this.editor, field).getValue(value)).toEqual(value)
        );
    }

    openAllToggleBoxes() {
        this.editor.all(by.xpath('//div[@class="toggle-box toggle-box--circle hidden"]/a'))
            .each((toggleHeader) => waitAndClick(toggleHeader));
    }
}

export const editor = new Editor();
