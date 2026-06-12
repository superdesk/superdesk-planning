import {test, expect} from '@playwright/test';

import {setup, login, addItems, waitForPageLoad, SubNavBar} from '../utils/common';
import {EventEditor, ManageContentProfiles} from '../page-object-models/planning';
import {CVs} from '../utils/fixtures/cvs';

const MULTILINGUAL_FIELDS = ['slugline', 'name', 'definition_short'];

test.describe('Planning.Events: multilingual functionality', () => {
    let editor: EventEditor;
    let subnav: SubNavBar;
    let manageProfiles: ManageContentProfiles;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);
        manageProfiles = new ManageContentProfiles(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'vocabularies', [CVs.LANGUAGES]);
        await login(page);
        await waitForPageLoad.planning(page);
    });

    // TODO: Fix this flaky test -- passes locally
    test.skip('Can enable multilingual functionality', async () => {
        // Show the `Manage event profiles` modal, and switch to the fields tab
        await manageProfiles.show('event');
        await manageProfiles.expectSelectedTab('Groups');
        await manageProfiles.selectTab(1);
        await manageProfiles.expectSelectedTab('Event Fields');

        // Enable the standard `Language` field
        await manageProfiles.openAddFieldMenu(3);
        await manageProfiles.addField('Language');

        // Make sure the `multilingual` checkbox is not shown for text fields
        for (const field of MULTILINGUAL_FIELDS) {
            await manageProfiles.getFieldListItem(field).click();
            await expect(manageProfiles.getEditorCheckbox('schema.multilingual').element).not.toBeAttached();
        }

        // Open the `Language` field for editing
        await manageProfiles.getFieldListItem('language').click();
        await manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);

        // Attempting to save without filling out `Languages` or `Default Language` fields
        await manageProfiles.getHeaderButton('Save').click();

        const languageInput = manageProfiles.getEditorTreeSelect('schema.languages', true);
        const defaultLanguageInput = manageProfiles.getEditorTreeSelect('schema.default_language', false);

        // `Languages` and `Default Language` fields are invalid
        await languageInput.expectValidData(false);
        await defaultLanguageInput.expectValidData(false);

        // Fill in `Languages` and make sure it is not marked as invalid
        await languageInput.type(['English', 'German']);
        await languageInput.expect(['English', 'German']);
        await manageProfiles.getHeaderButton('Save').click();

        await languageInput.expectValidData(true);
        await defaultLanguageInput.expectValidData(false);

        // Fill in `Default Language` field and make sure we can now save the field
        await defaultLanguageInput.type(['English']);
        await defaultLanguageInput.expect(['English']);
        await manageProfiles.getHeaderButton('Save').click();

        // Make sure the Editor has been closed (data is now valid)
        await expect(manageProfiles.getEditor()).not.toBeAttached()

        // Make sure the `multilingual` checkbox is now shown for text fields
        // And enable it for each
        for (const field of MULTILINGUAL_FIELDS) {
            await manageProfiles.getFieldListItem(field).click();
            await manageProfiles.getEditorCheckbox('schema.multilingual').type(true);
            await manageProfiles.getHeaderButton('Save').click();
        }

        // Close the modal, and re-open (to make sure the settings were applied)
        await manageProfiles.getFooterButton('Save').click();
        await manageProfiles.waitTillClosed();

        await manageProfiles.show('event');
        await manageProfiles.selectTab(1);

        // Make sure the `multilingual` checkbox is now shown for text fields
        for (const field of MULTILINGUAL_FIELDS) {
            await manageProfiles.getFieldListItem(field).click();
            await expect(manageProfiles.getEditorCheckbox('schema.multilingual').element).toBeAttached();
        }

        // Turn off multilingual functionality
        await manageProfiles.getFieldListItem('language').click();
        await manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(false);
        await manageProfiles.getHeaderButton('Save').click();

        for (const field of MULTILINGUAL_FIELDS) {
            await manageProfiles.getFieldListItem(field).click();
            await expect(manageProfiles.getEditorCheckbox('schema.multilingual').element).not.toBeAttached();
        }
    });

    // TODO: Fix this flaky test -- passes locally
    test.skip('Can enable multilingual functionalities', async ({page}) => {
        // Enable standard `Language` field
        await manageProfiles.show('event');
        await manageProfiles.selectTab(1);

        await manageProfiles.openAddFieldMenu(3);
        await manageProfiles.addField('Language');
        await manageProfiles.getFooterButton('Save').click();
        await manageProfiles.waitTillClosed();

        // Open EventEditor with new Event and test `Language` field with single value
        await subnav.createEvent();
        await editor.waitTillOpen();
        await editor.type({language: ['German']});

        // Enable multilingual support
        await manageProfiles.show('event');
        await manageProfiles.selectTab(1);
        await manageProfiles.expectSelectedTab('Event Fields');
        await manageProfiles.getFieldListItem('language').click();
        await manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);

        const languageInput = manageProfiles.getEditorTreeSelect('schema.languages', true);
        const defaultLanguageInput = manageProfiles.getEditorTreeSelect('schema.default_language', false);

        await languageInput.type(['English', 'German']);
        await languageInput.expect(['English', 'German']);
        await defaultLanguageInput.type(['English']);
        await defaultLanguageInput.expect(['English']);
        await manageProfiles.saveField();

        await manageProfiles.getFieldListItem('slugline').click();
        await manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);
        await manageProfiles.saveField();

        await manageProfiles.getFieldListItem('name').click();
        await manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);
        await manageProfiles.saveField();

        await manageProfiles.getFieldListItem('definition_short').click();
        await manageProfiles
            .getEditorCheckbox('schema.multilingual')
            .type(true);
        await manageProfiles.saveField();

        await manageProfiles.getFooterButton('Save').click();

        await manageProfiles.waitTillClosed();

        editor = new EventEditor(page, ['en', 'de'], ['slugline', 'name', 'definition_short']);
        await editor.type({
            language: ['English', 'German'],
            'slugline.de': 'slug-de',
            'slugline.en': 'slug-en',
            'name.de': 'name-de',
            'name.en': 'name-en',
            'definition_short.de': 'desc-de',
            'definition_short.en': 'desc-en',
        });
        await editor.expect({
            language: ['German', 'English'],
            'slugline.de': 'slug-de',
            'slugline.en': 'slug-en',
            'name.de': 'name-de',
            'name.en': 'name-en',
            'definition_short.de': 'desc-de',
            'definition_short.en': 'desc-en',
        });
        await editor.toggleShowAllLanguages();
        await editor.getMainLanguageButton('en').click();
        await expect(editor.fields['slugline.en'].element).toBeVisible();
        await expect(editor.fields['slugline.de'].element).not.toBeAttached();
        await editor.getMainLanguageButton('de').click();
        await expect(editor.fields['slugline.en'].element).not.toBeAttached();
        await expect(editor.fields['slugline.de'].element).toBeVisible();

        await editor.toggleShowAllLanguages();
        await expect(editor.fields['slugline.en'].element).toBeVisible();
        await expect(editor.fields['slugline.de'].element).toBeVisible();
    });
});
