import {setup, login, waitForPageLoad, SubNavBar, addItems} from '../../support/common';
import {TIME_STRINGS} from '../../support/utils/time';
import {EventEditor, PlanningList} from '../../support/planning';
import {EmbeddedCoverageEditor} from '../../support/planning/events/embeddedCoverageEditor';

describe('Planning.Events: editor bookmarks', () => {
    const editor = new EventEditor();
    const embeddedCoverages = new EmbeddedCoverageEditor(editor);
    const subnav = new SubNavBar();
    const list = new PlanningList();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('can scroll to each bookmark', () => {
        subnav.createEvent();
        editor.waitTillOpen();

        editor.clickBookmark('schedule');
        editor.fields.dates.start.date.element
            .should('be.visible')
            .should('be.focused');

        editor.clickBookmark('description');
        editor.fields.slugline.element
            .should('be.visible')
            .should('be.focused');

        editor.clickBookmark('location');
        editor.fields.location.inputElement
            .should('be.visible')
            .should('be.focused');

        editor.clickBookmark('details');
        editor.fields.anpa_category.addButton
            .should('be.visible')
            .should('be.focused');

        editor.clickBookmark('attachments');
        editor.getFormGroup('attachments')
            .find('.basic-drag-block')
            .should('be.visible')
            .should('be.focused');

        editor.clickBookmark('links');
        editor.getFormGroup('links')
            .find('.link-input__add-btn')
            .should('be.visible')
            .should('be.focused');

        editor.element
            .find('[data-test-id="editor--bookmarks__planning-0"]')
            .should('not.exist');
        editor.clickBookmark('add_planning');
        editor.element
            .find('[data-test-id="editor--bookmarks__planning-0"]')
            .should('exist');
        editor.element
            .find('[data-test-id="editor--planning-item__0"]')
            .should('exist')
            .should('be.visible')
            .should('be.focused');

        editor.element
            .find('[data-test-id="editor--bookmarks__planning-1"]')
            .should('not.exist');
        editor.clickBookmark('add_planning');
        editor.element
            .find('[data-test-id="editor--bookmarks__planning-1"]')
            .should('exist');
        editor.element
            .find('[data-test-id="editor--planning-item__1"]')
            .should('exist')
            .should('be.visible')
            .should('be.focused');

        editor.element
            .find('[data-test-id="editor--bookmarks__planning-0"]')
            .should('exist')
            .click();
        editor.element
            .find('[data-test-id="editor--planning-item__0"]')
            .should('exist')
            .should('be.visible')
            .should('be.focused');

        editor.element
            .find('[data-test-id="editor--bookmarks__planning-1"]')
            .should('exist')
            .click();
        editor.element
            .find('[data-test-id="editor--planning-item__1"]')
            .should('exist')
            .should('be.visible')
            .should('be.focused');
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
        addCoverageForm.fields.desk.element.should('not.exist');
        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.element
            .should('exist')
            .should('be.visible');
        addCoverageForm.fields.enabled.type('disabled');
        addCoverageForm.fields.desk.element.should('not.exist');

        // Enable Text coverage
        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.type('Sports Desk');
        addCoverageForm.fields.user.type('first name2 last name2');

        // Enable Photo coverage
        addCoverageForm = embeddedCoverages.getCoverageEntry(0, 1);
        addCoverageForm.fields.enabled.type('enabled');
        addCoverageForm.fields.desk.type('Politic Desk');
        addCoverageForm.fields.user.type('first name last name');

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
});
