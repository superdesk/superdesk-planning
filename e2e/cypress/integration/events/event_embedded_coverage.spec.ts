import {setup, login, waitForPageLoad, SubNavBar, addItems} from '../../support/common';
import {TIME_STRINGS} from '../../support/utils/time';
import {EventEditor, PlanningList} from '../../support/planning';
import {EmbeddedCoverageEditor} from '../../support/planning/events/embeddedCoverageEditor';

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
            'dates.start.date': '12/12/2045',
            'dates.allDay': true,
            slugline: 'slugline of the event',
            name: 'name of the event',
        });

        // Test a new Planning item is added, scrolled to and focused
        editor.element
            .find('[data-test-id="editor--planning-item__0"]')
            .should('not.exist');
        editor.clickBookmark('add_planning');
        editor.element
            .find('[data-test-id="editor--planning-item__0"]')
            .should('exist');
        embeddedCoverages.getAddCoverageForm(0)
            .should('exist')
            .should('be.visible');

        let addCoverageForm = embeddedCoverages.getCoverageEntry(0, 0);

        // Test enabling & disabling a coverage type
        // and associated input fields shown only when enabled

        // Test metadata inputs are hidden when Coverage is disabled
        addCoverageForm.fields.desk.element.should('not.exist');
        addCoverageForm.fields.user.element.should('not.exist');
        addCoverageForm.fields.status.element.should('not.exist');
        addCoverageForm.fields.enabled.element.should('exist');

        // Enable the Coverage, and test metadata inputs are visible
        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.element
            .should('exist')
            .should('be.visible');
        addCoverageForm.fields.user.element
            .should('exist')
            .should('be.visible');
        addCoverageForm.fields.status.element
            .should('exist')
            .should('be.visible');

        // Disable the Coverage again, and re-test metadata inputs are hidden
        addCoverageForm.fields.enabled.type('disabled');
        addCoverageForm.fields.desk.element.should('not.exist');
        addCoverageForm.fields.user.element.should('not.exist');
        addCoverageForm.fields.status.element.should('not.exist');

        // Enable Text coverage
        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.type('Sports Desk');
        addCoverageForm.fields.user.type('first name2 last name2');

        // Enable Photo coverage
        addCoverageForm = embeddedCoverages.getCoverageEntry(0, 1);
        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.type('Politic Desk');
        addCoverageForm.fields.user.type('first name last name');
        addCoverageForm.fields.status.type('On merit');

        // Add the coverage to the Planning item
        addCoverageForm.addButton.click();

        // Test the coverages were added properly to the associated Planning item
        embeddedCoverages.getRelatedCoverage(0, 0)
            .should('exist')
            .should('contain.text', 'Text')
            .should('contain.text', 'Sports Desk')
            .should('contain.text', 'first name2 last name2');
        embeddedCoverages.getRelatedCoverage(0, 1)
            .should('exist')
            .should('contain.text', 'Picture')
            .should('contain.text', 'Politic Desk')
            .should('contain.text', 'first name last name');

        // Create the Event & Planning items
        editor.waitForAutosave();
        editor.createButton
            .should('exist')
            .click();

        // Test the new Event appears in the list view
        list.expectItemCount(1);
        list.expectItemText(0, 'slugline of the event');

        // Test coverage icons in the related Planning item
        list.toggleAssociatedPlanning(0);
        list.nestedItem(0)
            .find('[data-test-id="coverage-icons"]')
            .should('exist');
        list.nestedPlanningItem(0, 0)
            .find('[data-test-id="coverage-icons"] .icon-text')
            .should('exist');
        list.nestedPlanningItem(0, 0)
            .find('[data-test-id="coverage-icons"] .icon-photo')
            .should('exist');
    });

    it('can add a planning item to an existing event', () => {
        addItems('events', [{
            type: 'event',
            occur_status: {
                name: 'Planned, occurs certainly',
                label: 'Confirmed',
                qcode: 'eocstat:eos5',
            },
            dates: {
                start: '2045-12-11' + TIME_STRINGS[0],
                end: '2045-12-11' + TIME_STRINGS[1],
                tz: 'Australia/Sydney',
            },
            calendars: [],
            state: 'draft',
            place: [],
            name: 'Test',
            slugline: 'slugline of the event',
        }]);

        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        editor.clickBookmark('add_planning');
        let addCoverageForm = embeddedCoverages.getCoverageEntry(0, 0);

        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.type('Sports Desk');
        addCoverageForm.fields.user.type('first name2 last name2');

        addCoverageForm.addButton.click();

        editor.waitForAutosave();
        editor.saveButton
            .should('exist')
            .click();

        // Wait for save to be completed
        editor.closeButton
            .should('exist')
            .should('be.enabled');
        editor.waitForAutosave();

        // Test coverage icons in the related Planning item
        list.toggleAssociatedPlanning(0);
        list.nestedItem(0)
            .find('[data-test-id="coverage-icons"]')
            .should('exist');
        list.nestedPlanningItem(0, 0)
            .find('[data-test-id="coverage-icons"] .icon-text')
            .should('exist');

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
        addCoverageForm = embeddedCoverages.getCoverageEntry(1, 1);

        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.type('Politic Desk');
        addCoverageForm.fields.user.type('first name last name');
        addCoverageForm.fields.status.type('On request');

        addCoverageForm.addButton.click();

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
        list.nestedPlanningItems(0)
            .should('have.length', 2);

        list.nestedPlanningItem(0, 0)
            .find('[data-test-id="coverage-icons"] .icon-text')
            .should('exist');

        list.nestedPlanningItem(0, 1)
            .find('[data-test-id="coverage-icons"] .icon-photo')
            .should('exist');
    });

    it('SDESK-6022: planning items should stay after post/unpost', () => {
        addItems('events', [{
            type: 'event',
            occur_status: {
                name: 'Planned, occurs certainly',
                label: 'Confirmed',
                qcode: 'eocstat:eos5',
            },
            dates: {
                start: '2045-12-11' + TIME_STRINGS[0],
                end: '2045-12-11' + TIME_STRINGS[1],
                tz: 'Australia/Sydney',
            },
            calendars: [],
            state: 'draft',
            place: [],
            name: 'Test',
            slugline: 'slugline of the event',
        }]);

        list.item(0)
            .dblclick();
        editor.waitTillOpen();
        editor.waitLoadingComplete();

        editor.clickBookmark('add_planning');
        let addCoverageForm = embeddedCoverages.getCoverageEntry(0, 0);

        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.type('Sports Desk');
        addCoverageForm.fields.user.type('first name2 last name2');

        addCoverageForm.addButton.click();

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

    it('SDESK-6071: update new Planning when event dates changes', () => {
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

        // Add a text coverage to the Planning item
        let addCoverageForm = embeddedCoverages.getCoverageEntry(0, 0);

        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.type('Sports Desk');
        addCoverageForm.fields.user.type('first name2 last name2');
        addCoverageForm.addButton.click();

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

        // Fill in the dates (which should also update the Planning/Coverage dates)
        editor.type({
            'dates.start.date': '12/12/2045',
            'dates.allDay': true,
        });

        // Make sure the date has been updated for the Coverage
        embeddedCoverages.getRelatedCoverage(0, 0)
            .should('exist')
            .should('contain.text', '12/12/2045 @ 00:00');

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
        list.expectItemCount(1);
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
