import {setup, login, addItems, waitForPageLoad, SubNavBar, TreeSelect} from '../../support/common';
import {EventEditor, ManageContentProfiles} from '../../support/planning';

import {CVs} from '../../fixtures/cvs';

const MULTILINGUAL_FIELDS = ['slugline', 'name', 'definition_short'];

describe('Planning.Events: multilingual functionality', () => {
    let editor = new EventEditor();
    const subnav = new SubNavBar();
    const manageProfiles = new ManageContentProfiles();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        addItems('vocabularies', [CVs.LANGUAGES]);

        login();
        waitForPageLoad.planning();
    });

    it('Can enable multilingual functionality', () => {
        // Show the `Manage event profiles` modal, and switch to the fields tab
        manageProfiles.show('event');
        manageProfiles.expectSelectedTab('Groups');
        manageProfiles.selectTab(1);
        manageProfiles.expectSelectedTab('Event Fields');

        // Enable the standard `Language` field
        manageProfiles.openAddFieldMenu(3);
        manageProfiles.addField('Language');

        // Make sure the `multilingual` checkbox is not shown for text fields
        MULTILINGUAL_FIELDS.forEach((field) => {
            manageProfiles.getFieldListItem(field).click();
            manageProfiles.getEditorCheckbox('schema.multilingual')
                .element
                .should('not.exist');
        });

        // Open the `Language` field for editing
        manageProfiles.getFieldListItem('language').click();
        manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);

        // Attempting to save without filling out `Languages` or `Default Language` fields
        manageProfiles.getHeaderButton('Save')
            .should('exist')
            .click();

        const languageInput = manageProfiles.getEditorTreeSelect('schema.languages', true);
        const defaultLanguageInput = manageProfiles.getEditorTreeSelect('schema.default_language', false);

        // `Languages` and `Default Language` fields are invalid
        languageInput.expectValidData(false);
        defaultLanguageInput.expectValidData(false);

        // Fill in `Languages` and make sure it is not marked as invalid
        languageInput.type(['English', 'German']);
        languageInput.expect(['English', 'German']);
        manageProfiles.getHeaderButton('Save')
            .should('exist')
            .click();

        languageInput.expectValidData(true);
        defaultLanguageInput.expectValidData(false);

        // Fill in `Default Language` field and make sure we can now save the field
        defaultLanguageInput.type(['English']);
        defaultLanguageInput.expect(['English']);
        manageProfiles.getHeaderButton('Save')
            .should('exist')
            .click();

        // Make sure the Editor has been closed (data is now valid)
        manageProfiles.getEditor().should('not.exist');

        // Make sure the `multilingual` checkbox is now shown for text fields
        // And enable it for each
        MULTILINGUAL_FIELDS.forEach((field) => {
            manageProfiles.getFieldListItem(field).click();
            manageProfiles.getEditorCheckbox('schema.multilingual').type(true);
            manageProfiles.getHeaderButton('Save')
                .should('exist')
                .click();
        });

        // Close the modal, and re-open (to make sure the settings were applied)
        manageProfiles.getFooterButton('Save').click();
        manageProfiles.waitTillClosed();
        manageProfiles.show('event');
        manageProfiles.selectTab(1);

        // Make sure the `multilingual` checkbox is not shown for text fields
        MULTILINGUAL_FIELDS.forEach((field) => {
            manageProfiles.getFieldListItem(field).click();
            manageProfiles.getEditorCheckbox('schema.multilingual')
                .element
                .should('exist');
        });

        // Turn off multilingual functionality
        manageProfiles.getFieldListItem('language').click();
        manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(false);
        manageProfiles.getHeaderButton('Save')
            .should('exist')
            .click();

        MULTILINGUAL_FIELDS.forEach((field) => {
            manageProfiles.getFieldListItem(field).click();
            manageProfiles.getEditorCheckbox('schema.multilingual')
                .element
                .should('not.exist');
        });
    });

    it('Can enable multilingual functionalitys', () => {
        // Enable standard `Language` field
        manageProfiles.show('event');
        manageProfiles.selectTab(1);

        manageProfiles.openAddFieldMenu(3);
        manageProfiles.addField('Language');
        manageProfiles.getFooterButton('Save').click();
        manageProfiles.waitTillClosed();

        // Open EventEditor with new Event and test `Language` field with single value
        subnav.createEvent();
        editor.waitTillOpen();
        editor.type({language: ['German']});

        // Enable multilingual support
        manageProfiles.show('event');
        manageProfiles.selectTab(1);
        manageProfiles.expectSelectedTab('Event Fields');
        manageProfiles.getFieldListItem('language').click();
        manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);

        const languageInput = manageProfiles.getEditorTreeSelect('schema.languages', true);
        const defaultLanguageInput = manageProfiles.getEditorTreeSelect('schema.default_language', false);

        languageInput.type(['English', 'German']);
        languageInput.expect(['English', 'German']);
        defaultLanguageInput.type(['English']);
        defaultLanguageInput.expect(['English']);
        manageProfiles.saveField();

        manageProfiles.getFieldListItem('slugline').click();
        manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);
        manageProfiles.saveField();

        manageProfiles.getFieldListItem('name').click();
        manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);
        manageProfiles.saveField();

        manageProfiles.getFieldListItem('definition_short').click();
        manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);
        manageProfiles.saveField();

        manageProfiles.getFooterButton('Save').click();

        manageProfiles.waitTillClosed();

        editor = new EventEditor(['en', 'de'], ['slugline', 'name', 'definition_short']);
        editor.type({
            language: ['English'],
            'slugline.de': 'slug-de',
            'slugline.en': 'slug-en',
            'name.de': 'name-de',
            'name.en': 'name-en',
            'definition_short.de': 'desc-de',
            'definition_short.en': 'desc-en',
        });
        editor.expect({
            language: ['German', 'English'],
            'slugline.de': 'slug-de',
            'slugline.en': 'slug-en',
            'name.de': 'name-de',
            'name.en': 'name-en',
            'definition_short.de': 'desc-de',
            'definition_short.en': 'desc-en',
        });
        editor.toggleShowAllLanguages();
        editor.getMainLanguageButton('en')
            .should('exist')
            .click();
        editor.fields['slugline.en'].element.should('exist');
        editor.fields['slugline.de'].element.should('not.exist');
        editor.getMainLanguageButton('de')
            .should('exist')
            .click();
        editor.fields['slugline.en'].element.should('not.exist');
        editor.fields['slugline.de'].element.should('exist');

        editor.toggleShowAllLanguages();
        editor.fields['slugline.en'].element.should('exist');
        editor.fields['slugline.de'].element.should('exist');
    });
});
