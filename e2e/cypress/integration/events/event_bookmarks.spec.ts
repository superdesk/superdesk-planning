import {setup, login, waitForPageLoad, SubNavBar} from '../../support/common';
import {EventEditor} from '../../support/planning';

describe('Planning.Events: editor bookmarks', () => {
    const editor = new EventEditor();
    const subnav = new SubNavBar();

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
            .find('[data-test-id="event-links__add-new-button"]')
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
});
