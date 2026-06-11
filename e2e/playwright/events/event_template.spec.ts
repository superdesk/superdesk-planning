import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar, UiFrameworkModal} from '../utils/common';
import {EventEditor} from '../page-object-models/planning';

test.describe('Planning.Events: event templates', () => {
    let editor: EventEditor;
    let subnav: SubNavBar;
    let modal: UiFrameworkModal;

    const event = {
        'dates.start.date': '12/12/2045',
        'dates.start.time': '00:00',
        'dates.end.time': '00:59',
        slugline: 'Event',
        name: 'Test',
        definition_short: 'Desc.',
        definition_long: 'Desc. Long',
        internal_note: 'Internal',
        ednote: 'Ed. Note',
        occur_status: 'Planned, occurence planned only',

        calendars: ['Sport', 'Finance'],
        anpa_category: ['Domestic Sport'],
        subject: ['sports awards'],

        links: ['https://www.google.com.au', 'https://en.wikipedia.org'],
    };

    const expectedEvent = Object.assign({}, event, {
        'dates.end.date': '12/12/2045',
    });

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);
        modal = new UiFrameworkModal(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
        await subnav.createEvent();
        await editor.waitTillOpen();
    });

    test('can create a template from an Event', async ({page}) => {
        // Create the Event which will be used as the template
        await editor.openAllToggleBoxes();
        await editor.type(event);
        await editor.expect(expectedEvent);
        await editor.waitForAutosave();
        await editor.createButton.click();
        await editor.waitLoadingComplete();

        // Now create the Template
        await editor.actionMenu.open();
        await editor.actionMenu
            .getAction('Save event as a template')
            .click();
        await modal.waitTillOpen();
        await modal.element
            .getByRole('textbox')
            .fill('Example');
        await modal.getFooterButton('Submit').click();
        await modal.waitTillClosed();

        // Wait for the Editor to re-render
        // otherwise the close button may re-render during attempts to click it
        await page.waitForTimeout(3500);
        await editor.closeButton.click();
        await editor.waitTillClosed();

        // Open Manage Templates modal
        await subnav.menuBtn.click();
        await subnav.menu.getByText('Manage event templates').click();

        // Make sure our new template is there
        await modal.waitTillOpen();
        await expect(
            modal.element.getByTestId('list-page--items').locator('.sd-list-item')
        ).toHaveCount(1);
        await expect(
            modal.element.getByTestId('list-page--items').locator('.sd-list-item')
        ).toContainText('Example');

        // Filter templates to show our new one and make sure it exists in the list
        await modal.element
            .locator('.search-handler')
            .getByRole('textbox')
            .fill('Exam');
        await page.keyboard.press('Enter');

        await expect(modal.element
            .getByTestId('list-page--filters-active')
            .getByText('Exam')).toBeVisible();

        // Modify search query to exclude our template and make sure it's not in the list
        await expect(
            modal.element.getByTestId('list-page--items').locator('.sd-list-item')
        ).toHaveCount(1);
        await expect(
            modal.element.getByTestId('list-page--items').locator('.sd-list-item')
        ).toContainText('Example');

        await modal.element
            .locator('.search-handler')
            .getByRole('textbox')
            .fill('ExamTest');
        await page.keyboard.press('Enter');

        await expect(
            modal.element
                .getByTestId('list-page--filters-active')
                .getByText('ExamTest')
        ).toBeVisible();

        await expect(
            modal.element.locator('.sd-list-item')
        ).toContainText('There are no items matching the search')

        // Clear the search filter
        await modal.element
            .locator('.search-handler')
            .getByRole('textbox')
            .clear();
        await page.keyboard.press('Enter');

        // Open our filter and make sure the template_name is correct
        await modal.element
            .getByTestId('list-page--items')
            .locator('.sd-list-item')
            .hover();

        await modal.element
            .getByTestId('list-page--items')
            .locator('.sd-list-item')
            .locator('.icon-pencil')
            .click();

        await expect(
            modal.element.getByTestId('gform-input--template_name')
        ).toHaveValue('Example');

        // Close the Manage Templates modal
        await modal.getFooterButton('Close').click();

        // Create a new Event from this template
        await subnav.plusBtn.click();
        await subnav.createMenu
            .getByRole('textbox')
            .fill('Example');

        await subnav.createMenu
            .getByRole('button')
            .getByText('Example')
            .click();

        // Check the form values are the same as the template (excluding date/time values)
        await editor.waitLoadingComplete();
        await editor.openAllToggleBoxes();

        await editor.expect(Object.assign({}, expectedEvent, {
            'dates.start.date': '',
            'dates.start.time': '',
            'dates.end.time': '',
            'dates.end.date': '',
        }));
    });
});
