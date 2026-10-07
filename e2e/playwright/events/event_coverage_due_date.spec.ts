import {test} from '@playwright/test';
import moment from 'moment';

import {setup, login, waitForPageLoad, SubNavBar, CLIENT_FORMAT} from '../utils/common';
import {EventEditor} from '../page-object-models/planning';

test.describe('Planning.Events: coverage due date', () => {
    let editor: EventEditor;
    let subnav: SubNavBar;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('sets the due date from the event dates for a coverage added before the event is saved', async () => {
        // A future date, otherwise the due date falls back to the current time
        const eventDate = moment()
            .add(1, 'day')
            .format(CLIENT_FORMAT);

        await subnav.createEvent();
        await editor.waitTillOpen();

        await editor.type({
            'dates.start.date': eventDate,
            'dates.start.time': '10:00',
            'dates.end.time': '12:00',
            slugline: 'slugline of the event',
            name: 'name of the event',
        });
        await editor.expect({
            'dates.end.date': eventDate,
            'dates.end.time': '12:00',
        });

        await editor.addCoverage('Text');

        // Due one hour after the event ends
        await editor.getCoverageEditor(0).expect({
            'scheduled.date': eventDate,
            'scheduled.time': '13:00',
        });
    });
});
