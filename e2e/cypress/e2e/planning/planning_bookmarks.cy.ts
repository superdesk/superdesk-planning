import {setup, login, waitForPageLoad, SubNavBar} from '../../support/common';
import {PlanningEditor} from '../../support/planning';

describe('Planning.Events: planning bookmarks', () => {
    const editor = new PlanningEditor();
    const subnav = new SubNavBar();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('can scroll to each bookmark', () => {
        subnav.createPlanning();
        editor.waitTillOpen();

        editor.clickBookmark('title');
        editor.fields.slugline.element
            .should('be.visible')
            .should('be.focused');

        editor.clickBookmark('schedule');
        editor.fields.planning_date.date.element
            .should('be.visible')
            .should('be.focused');

        editor.clickBookmark('description');
        editor.fields.description_text.element
            .should('be.visible')
            .should('be.focused');

        editor.clickBookmark('details');
        editor.fields.ednote.element
            .should('be.visible')
            .should('be.focused');

        editor.clickBookmark('add_coverage');
    });
});
