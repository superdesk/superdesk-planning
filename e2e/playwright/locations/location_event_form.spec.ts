import {test, expect} from '../fixtures';

import {login, waitForPageLoad, SubNavBar} from '../utils/common';
import {EventEditor, NewLocationPopup} from '../utils/planning';
import {CVs} from '../utils/fixtures/cvs';

test.describe('Planning.Locations: from the Event form', () => {
    let editor: EventEditor;
    let subnav: SubNavBar;
    let locationPopup: NewLocationPopup;

    test.beforeEach(async ({page, backendApi}) => {
        editor = new EventEditor(page);
        subnav = new SubNavBar(page);
        locationPopup = new NewLocationPopup(page);

        await backendApi.resetApp('planning_prepopulate_data');
        await page.goto('/#/planning');
        await backendApi.addItems(
            'vocabularies',
            [CVs.COUNTRIES, CVs.REGIONS]
        );
        await login(page);
        await waitForPageLoad.planning(page);
        await subnav.createEvent();
        await editor.waitTillOpen();
    });

    test('can create a new Location', async () => {
        await editor.clickBookmark('location');
        await editor.fields.location.search('Sydney Opera House');
        await editor.fields.location.addNewButton.click();

        // Wait till the Location Popup is available
        // and make sure the name is copied from the search input
        await locationPopup.waitTillOpen();
        await locationPopup.fields.name.expect('Sydney Opera House');

        // Make sure the `CREATE LOCATION` button is disabled
        await expect(locationPopup.cancelButton).toBeEnabled();
        await expect(locationPopup.createButton).toBeDisabled();

        // Fill in the required fields
        await locationPopup.fields.address.type('2 Macquarie Street');
        await locationPopup.fields.city.type('Sydney');
        await locationPopup.fields.country.type('Australia');
        // And make sure the `CREATE LOCATION` button is enabled
        await expect(locationPopup.createButton).toBeEnabled();

        // Fill in all the other fields
        await locationPopup.fields.area.type('Council of the City of Sydney');
        await locationPopup.fields.suburb.type('Sydney');
        await locationPopup.fields.locality.type('Sydney');
        await locationPopup.fields.state.type('New South Wales');
        await locationPopup.fields.postal_code.type('2000');
        await locationPopup.fields.notes.type('Testing the ability to manually create a Location');

        // Create the new location and wait till the popup form is closed
        await locationPopup.createButton.click();
        await locationPopup.waitTillClosed();

        // Make sure the new location has been added to the Event
        await editor.fields.location.expect('Sydney Opera House');
    });
});
