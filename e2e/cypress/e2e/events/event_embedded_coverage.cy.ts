import {setup, login, waitForPageLoad, SubNavBar, addItems, CLIENT_FORMAT} from '../../support/common';
import {TIME_STRINGS} from '../../support/utils/time';
import {EventEditor, PlanningList} from '../../support/planning';
import {EmbeddedCoverageEditor} from '../../support/planning/events/embeddedCoverageEditor';
import moment from 'moment';
import {createEventFor} from '../../fixtures/events';

describe('Planning.Events: embedded coverage', () => {
    const editor = new EventEditor();
    const embeddedCoverages = new EmbeddedCoverageEditor(editor);
    const subnav = new SubNavBar();
    const list = new PlanningList();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('can add a planning item to a new Event', () => {
        subnav.createEvent();
        editor.waitTillOpen();

        // Enter required fields (so we can create the Event & Planning)
        editor.type({
            'dates.start.date': moment().format(CLIENT_FORMAT),
            slugline: 'slugline of the event',
            name: 'name of the event',
        });

        editor.element
            .find('[data-test-id="editor--planning-item__0"]')
            .should('not.exist');

        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .click();

        // wait for item to save and create button to disappear
        editor.createButton.should('not.exist');

        editor.clickBookmark('add_planning');

        editor.element
            .find('[data-test-id="editor--planning-item__0"]')
            .should('exist');

        editor.saveButton
            .should('exist')
            .click();

        // Test the new Event appears in the list view
        list.expectItemCount(2);
        list.expectItemText(0, 'slugline of the event');
    });

    it('can add a planning item to an existing event', () => {
        addItems('events', [createEventFor.today({
            type: 'event',
            occur_status: {
                name: 'Planned, occurs certainly',
                label: 'Confirmed',
                qcode: 'eocstat:eos5',
            },
            calendars: [],
            state: 'draft',
            place: [],
            name: 'Test',
            slugline: 'slugline of the event',
        })]);

        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        editor.clickBookmark('add_planning');

        editor.waitForAutosave();
        editor.saveButton
            .should('exist')
            .click();

        // Wait for save to be completed
        editor.closeButton
            .should('exist')
            .should('be.enabled');
        editor.waitForAutosave();

        editor.closeButton
            .should('exist')
            .click();
        editor.waitTillClosed();

        // Wait for item to be unlocked in the list
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');
        cy.wait(1000);

        // Open the same item and add another Planning item
        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        editor.clickBookmark('add_planning');

        editor.waitForAutosave();
        editor.saveButton
            .should('exist')
            .should('be.enabled')
            .click();

        // Wait for save to be completed
        editor.closeButton
            .should('exist')
            .should('be.enabled');
        editor.waitForAutosave();

        editor.closeButton
            .should('exist')
            .should('be.enabled')
            .click();
        editor.waitTillClosed();

        // Wait for item to be unlocked in the list
        list.item(0)
            .find('.sd-list-item__border--locked')
            .should('not.exist');

        list.toggleAssociatedPlanning(0);

        list.nestedPlanningItems(0)
            .should('have.length', 2);
    });

    it('SDESK-6022: planning items should stay after post/unpost', () => {
        addItems('events', [createEventFor.today({
            type: 'event',
            occur_status: {
                name: 'Planned, occurs certainly',
                label: 'Confirmed',
                qcode: 'eocstat:eos5',
            },
            calendars: [],
            state: 'draft',
            place: [],
            name: 'Test',
            slugline: 'slugline of the event',
        })]);

        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        editor.clickBookmark('add_planning');

        editor.waitForAutosave();

        embeddedCoverages.getPlanningItem(0)
            .should('exist');
        editor.saveButton
            .should('exist')
            .click();
        editor.waitForAutosave();

        editor.postButton
            .should('exist')
            .should('be.enabled')
            .click();

        editor.waitForAutosave();
        embeddedCoverages.getPlanningItem(0)
            .should('exist');

        editor.unpostButton
            .should('exist')
            .should('be.enabled')
            .click();
        editor.waitForAutosave();
        embeddedCoverages.getPlanningItem(0)
            .should('exist');
    });

    // PR-TODO: drop this test?
    xit('SDESK-6071: update new Planning when event dates changes', () => {
        subnav.createEvent();
        editor.waitTillOpen();
        editor.openAllToggleBoxes();

        // Fill in some fields (excluding date/times)
        editor.type({
            slugline: 'slugline of the event',
            name: 'name of the event',
            definition_short: 'Desc.',
            occur_status: 'Planned, occurence planned only',
        });

        // Add a Planning item to the Event
        editor.clickBookmark('add_planning');
        editor.element
            .find('[data-test-id="editor--planning-item__0"]')
            .should('exist');

        embeddedCoverages.getAddCoverageForm(0)
            .should('exist')
            .should('be.visible');

        // Attempt to create the Event & Planning item
        // knowing that it will error out
        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .should('be.enabled')
            .click();

        // Make sure validation failed
        editor.fields.dates.start.date.expectError('This field is required');
        editor.createButton
            .should('exist')
            .should('be.enabled');

        const now = moment();

        // Fill in the dates (which should also update the Planning/Coverage dates)
        editor.type({
            'dates.start.date': now.format(CLIENT_FORMAT),
        });

        // Make sure the date has been updated for the Coverage
        embeddedCoverages.getRelatedCoverage(0, 0)
            .should('exist')
            .should('contain.text', `${now.format(CLIENT_FORMAT)} @ 00:00`);

        // Now create the Event & Planning item
        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .should('be.enabled')
            .click();

        // Make sure the item is created
        editor.createButton.should('not.exist');
        editor.postButton
            .should('exist')
            .should('be.enabled');
        list.expectItemCount(2);
        list.expectItemText(0, 'slugline of the event');

        // Make sure the Text coverage was created as well
        list.toggleAssociatedPlanning(0);
        list.nestedItem(0)
            .find('[data-test-id="coverage-icons"]')
            .should('exist');
        list.nestedPlanningItem(0, 0)
            .find('[data-test-id="coverage-icons"] .icon-text')
            .should('exist');
    });
});
