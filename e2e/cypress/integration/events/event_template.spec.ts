import {setup, login, waitForPageLoad, Modal, SubNavBar} from '../../support/common';
import {EventEditor} from '../../support/planning';

describe('Planning.Events: event templates', () => {
    const editor = new EventEditor();
    const subnav = new SubNavBar();
    const modal = new Modal();

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
        anpa_category: ['Domestic Sport', 'Finance'],
        subject: ['sports awards'],

        links: ['https://www.google.com.au', 'https://en.wikipedia.org'],
    };

    const expectedEvent = Object.assign({}, event, {
        'dates.end.date': '12/12/2045',
    });

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        login();
        waitForPageLoad.planning();
        subnav.createEvent();
        editor.waitTillOpen();
    });

    it('can create a template from an Event', () => {
        // Create the Event which will be used as the template
        editor.openAllToggleBoxes();
        editor.type(event);
        editor.expect(expectedEvent);
        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .click();
        editor.waitLoadingComplete();

        // Now create the Template
        editor.actionMenu.open();
        editor.actionMenu
            .getAction('Save event as a template')
            .click();
        modal.waitTillOpen(30000);
        modal.element
            .find('textarea')
            .type('Example');
        modal.getFooterButton('Submit')
            .click();
        modal.waitTillClosed(30000);

        // Wait for the Editor to re-render
        // otherwise the close button may re-render during attempts to click it
        cy.wait(3500);
        editor.closeButton
            .should('exist')
            .click();
        editor.waitTillClosed();

        // Open Manage Templates modal
        subnav.menuBtn.click();
        subnav.menu
            .contains('Manage event templates')
            .should('exist')
            .click();

        // Make sure our new template is there
        modal.waitTillOpen(30000);
        modal.element
            .find('[data-test-id=list-page--items]')
            .find('.sd-list-item')
            .should('have.length', 1)
            .should('contain.text', 'Example');

        // Filter templates to show our new one and make sure it exists in the list
        modal.element
            .find('.search-handler')
            .find('input')
            .type('Exam');

        modal.element
            .find('[data-test-id=list-page--filters-active]')
            .contains('Exam')
            .should('exist');

        // Modify search query to exclude our template and make sure it's not in the list
        modal.element
            .find('[data-test-id=list-page--items]')
            .find('.sd-list-item')
            .should('have.length', 1)
            .should('contain.text', 'Example');

        modal.element
            .find('.search-handler')
            .find('input')
            .type('Test');

        modal.element
            .find('[data-test-id=list-page--filters-active]')
            .contains('ExamTest')
            .should('exist');

        modal.element
            .find('.sd-list-item')
            .should('contain.text', 'There are no items matching the search');

        // Clear the search filter
        modal.element
            .find('.search-handler')
            .find('input')
            .clear();

        // Open our filter and make sure the template_name is correct
        modal.element
            .find('[data-test-id=list-page--items]')
            .find('.sd-list-item')
            .find('.icon-pencil')
            .click();

        modal.element
            .find('[data-test-id=gform-input--template_name]')
            .should('have.value', 'Example');

        // Close the Manage Templates modal
        modal.getFooterButton('Close')
            .click();

        // Create a new Event from this template
        subnav.plusBtn.click();
        subnav.createMenu
            .find('input')
            .type('Example');

        subnav.createMenu
            .find('button')
            .contains('Example')
            .should('exist')
            .click();

        // Check the form values are the same as the template (excluding date/time values)
        editor.waitTillOpen();
        editor.openAllToggleBoxes();

        editor.expect(Object.assign({}, expectedEvent, {
            'dates.start.date': '',
            'dates.start.time': '',
            'dates.end.time': '',
            'dates.end.date': '',
        }));
    });
});
