import {setup, login, waitForPageLoad, SubNavBar, addItems} from '../../support/common';
import {NewLocationPopup} from '../../support/planning/location';
import {EventEditor} from '../../support/planning';
import {CVs} from '../../fixtures/cvs';

describe('Planning.Locations: from the Event form', () => {
    const editor = new EventEditor();
    const subnav = new SubNavBar();
    const locationPopup = new NewLocationPopup();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        addItems('vocabularies', [
            CVs.COUNTRIES,
            CVs.REGIONS
        ]);

        login();

        waitForPageLoad.planning();
        subnav.createEvent();
        editor.waitTillOpen();
    });

    it('can create a new Location', () => {
        editor.clickBookmark('location');
        editor.fields.location.search('Sydney Opera House');
        editor.fields.location.addNewButton.click();

        // Wait till the Location Popup is available
        // and make sure the name is copied from the search input
        locationPopup.waitTillOpen();
        locationPopup.fields.name.expect('Sydney Opera House');

        // Make sure the `CREATE LOCATION` button is disabled
        locationPopup.cancelButton.should('not.have.class', 'btn--disabled');
        locationPopup.createButton.should('have.class', 'btn--disabled');

        // Fill in the required fields
        locationPopup.fields.address.type('2 Macquarie Street');
        locationPopup.fields.city.type('Sydney');
        locationPopup.fields.country.type('Australia');
        // And make sure the `CREATE LOCATION` button is enabled
        locationPopup.createButton.should('not.have.class', 'btn--disabled');

        // Fill in all the other fields
        locationPopup.fields.area.type('Council of the City of Sydney');
        locationPopup.fields.suburb.type('Sydney');
        locationPopup.fields.locality.type('Sydney');
        locationPopup.fields.state.type('New South Wales');
        locationPopup.fields.postal_code.type('2000');
        locationPopup.fields.notes.type('Testing the ability to manually create a Location');

        // Create the new location and wait till the popup form is closed
        locationPopup.createButton.click();
        locationPopup.waitTillClosed();

        // Make sure the new location has been added to the Event
        editor.fields.location.expect('Sydney Opera House');
    });
});
