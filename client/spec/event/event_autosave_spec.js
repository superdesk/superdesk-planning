import {subNavBar} from '../helpers/subNavBar';
import {editor} from '../helpers/editor';
import {listPanel} from '../helpers/listPanel';
import {workqueue} from '../helpers/workqueue';

import {nav} from 'superdesk-core/spec/helpers/utils';

describe('event_autosave', () => {
    let event;
    let expectedEvent;

    it('creating a new Event', () => {
        event = {
            slugline: 'Event',
            name: 'Test',
            definition_short: 'Desc.',
            dates: {start: {date: '12/12/2045'}},
            occur_status: 'eocstat:eos1',
            calendars: ['Sport', 'Finance'],
            location: 'Sydney, Australia',
            anpa_category: ['Domestic Sport', 'Finance'],
            subject: ['sports awards'],
            definition_long: 'Desc. Long',
            internal_note: 'Internal',
            ednote: 'Ed. Note',
            files: ['uploads/file1.test', 'uploads/file2.test'],
            links: ['https://www.google.com.au', 'https://en.wikipedia.org'],
        };

        expectedEvent = Object.assign({}, event, {
            dates: {
                start: {
                    date: '12/12/2045',
                    time: '00:00',
                },
                end: {
                    date: '12/12/2045',
                    time: '00:59',
                },
            },
            location: 'Sydney\nSydney, Australia',
            files: ['file1.test', 'file2.test'],
        });

        subNavBar.createEvent();

        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);
        expect(workqueue.getItemCount()).toBe(1);
        expect(workqueue.getItemTitles()).toEqual(['Untitled*']);

        const item1 = workqueue.getItem(0);

        editor.openAllToggleBoxes();
        editor.inputValues(event);
        editor.allDayButton.click();
        editor.expectValues(expectedEvent);

        // Wait for the Autosave to save the item
        // Which will then update the Workqueue item title
        browser.wait(() => item1.isTitle('Event*'), 7500);

        // Minimize then open the item
        editor.minimizeButton.click();

        // Files are not currently autosaved
        // So after we minimize (or navigate away), we expect our unsaved files
        // to be removed
        expectedEvent.files = [];

        item1.openItem();

        editor.openAllToggleBoxes();
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);
        editor.expectValues(expectedEvent);

        // Navigate to Workspace, then back to Planning
        nav('/workspace');
        nav('/planning');

        editor.openAllToggleBoxes();
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);
        editor.expectValues(expectedEvent);

        // Refresh the page while the Event is open in the Editor
        browser.navigate().refresh();

        editor.openAllToggleBoxes();
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);
        editor.expectValues(expectedEvent);

        // Now minimize the item and reload the page (so the editor is not open when the page opens)
        editor.minimizeButton.click();
        browser.navigate().refresh();
        item1.openItem();

        editor.openAllToggleBoxes();
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);
        editor.expectValues(expectedEvent);

        // Now save the Event
        editor.createButton.click();
        browser.wait(() => listPanel.getItemCount());
    });

    it('keeps existing files and removes unsaved files', () => {
        event = {
            slugline: 'Event',
            name: 'Test',
            dates: {start: {date: '12/12/2045'}},
            files: ['uploads/file1.test', 'uploads/file2.test'],
        };

        expectedEvent = {files: ['file1.test', 'file2.test']};

        subNavBar.createEvent();

        expect(listPanel.getItemCount()).toBe(0);
        expect(editor.editors.count()).toBe(1);
        expect(editor.eventType.count()).toBe(1);
        expect(workqueue.getItemCount()).toBe(1);
        expect(workqueue.getItemTitles()).toEqual(['Untitled*']);

        editor.openAllToggleBoxes();
        editor.inputValues(event);
        editor.expectValues(expectedEvent);

        // Now save the Event
        editor.createButton.click();
        browser.wait(() => listPanel.getItemCount());

        // Now make the changes to the files
        // '\xA0' === '&nbsp' (non-breaking space)
        editor.inputValues({files: ['uploads/file3.test']});
        expectedEvent.files = ['file1.test\xA0 (0kB)', 'file2.test\xA0 (0kB)', 'file3.test'];
        editor.expectValues(expectedEvent);

        // Minimize then open the item
        editor.minimizeButton.click();
        workqueue.getItem(0).openItem();
        browser.sleep(2000);
        editor.openAllToggleBoxes();

        expectedEvent.files = ['file1.test\xA0 (0kB)', 'file2.test\xA0 (0kB)'];
        editor.expectValues(expectedEvent);
    });
});
