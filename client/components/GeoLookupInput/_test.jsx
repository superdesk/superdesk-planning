import React from 'react';
import {mount} from 'enzyme';
import {GeoLookupInputComponent} from './AddGeoLookupInput';
import sinon from 'sinon';
import * as helpers from '../tests/helpers';

describe('<AddGeoLookupInput />', () => {
    let inputText;
    let initialValue;
    let handleSearch;
    let onChange;
    let wrapper;

    beforeEach(() => {
        inputText = {target: {value: 'Syd'}};
        initialValue = {
            name: 'Timbaktu',
            address: {
                line: ['all roads lead to timbaktu'],
                locality: 'City',
                country: 'Mali',
            },
        };
        handleSearch = sinon.stub().returns(Promise.resolve());

        onChange = sinon.spy((field, value) => { /* no-op */ });
    });

    const setWrapper = () => {
        wrapper = mount(
            <GeoLookupInputComponent
                initialValue={initialValue}
                onChange={onChange}
                searchLocalLocations={handleSearch}
                users={[]}
            />
        );
        return wrapper;
    };

    it('searches local locations on typeahead', () => {
        setWrapper();
        wrapper.instance().handleInputChange(inputText);

        expect(handleSearch.callCount).toBe(1);
        expect(handleSearch.args[0]).toEqual(['Syd']);
    });

    it('invokes external search', () => {
        setWrapper();
        wrapper.instance().handleInputChange(inputText);
        const externalSearchSpy = sinon.stub(wrapper.instance(),
            'handleSearchClick').callsFake(() => { /* no-op */ });


        // See https://github.com/airbnb/enzyme/issues/586
        // Force the component and wrapper to update so that the stub is used
        // ONLY works when both of these are present
        wrapper.instance().forceUpdate();
        wrapper.update();

        const popup = new helpers.ui.Popup(wrapper);
        const searchTab = popup.find('.nav-tabs').childAt(1);
        const searchBtn = searchTab.find('.btn');

        searchBtn.simulate('click');
        expect(externalSearchSpy.callCount).toBe(1);
    });

    it('external search button can be controlled by disableSearch prop', () => {
        wrapper = mount(<GeoLookupInputComponent
            initialValue={initialValue}
            onChange={onChange}
            searchLocalLocations={handleSearch}
            disableSearch={true} />);

        wrapper.instance().handleInputChange(inputText);

        // See https://github.com/airbnb/enzyme/issues/586
        // Force the component and wrapper to update so that the stub is used
        // ONLY works when both of these are present
        wrapper.instance().forceUpdate();
        wrapper.update();

        const popup = new helpers.ui.Popup(wrapper);
        const searchTab = popup.find('.nav-tabs').childAt(1);

        expect(searchTab.length).toBe(0);
    });
});
