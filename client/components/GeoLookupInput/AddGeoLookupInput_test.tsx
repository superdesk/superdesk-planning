import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';

import {planningApis} from '../../api';
import {GeoLookupInputComponent} from './AddGeoLookupInput';
import * as helpers from '../tests/helpers';
import {restoreSinonStub} from '../../utils/testUtils';

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
        sinon.stub(planningApis.locations, 'search').callsFake(
            () => Promise.resolve({_items: []})
        );
        sinon.stub(planningApis.locations, 'searchExternal').callsFake(
            () => Promise.resolve([])
        );
    });

    afterEach(() => {
        restoreSinonStub(planningApis.locations.search);
        restoreSinonStub(planningApis.locations.searchExternal);
    });

    const setWrapper = () => {
        wrapper = mount(
            <GeoLookupInputComponent
                field="location"
                initialValue={initialValue}
                onChange={onChange}
                users={[]}
                regions={[]}
                countries={[]}
                language="en"
            />
        );
        return wrapper;
    };

    it('searches local locations on typeahead', () => {
        setWrapper();
        wrapper.instance().handleInputChange(inputText);

        expect(planningApis.locations.search.callCount).toBe(1);
        expect(planningApis.locations.search.args[0]).toEqual(['Syd']);
    });

    it('invokes external search', () => {
        setWrapper();
        wrapper.instance().handleInputChange(inputText);
        wrapper.update();

        const popup = new helpers.ui.Popup(wrapper);
        const searchTab = popup.find('.nav-tabs').childAt(1);
        const searchBtn = searchTab.find('.btn');

        searchBtn.simulate('click');
        expect(planningApis.locations.searchExternal.callCount).toBe(2);
        // There's a bug in the library `react-geoloookup` that causes
        // our `searchExternal` to be called twice
        expect(planningApis.locations.searchExternal.args[0]).toEqual([
            undefined,
            'en',
        ]);
        expect(planningApis.locations.searchExternal.args[1]).toEqual([
            'Syd',
            'en',
        ]);
    });

    it('external search button can be controlled by disableSearch prop', () => {
        wrapper = mount(
            <GeoLookupInputComponent
                field="location"
                initialValue={initialValue}
                onChange={onChange}
                disableSearch={true}
                users={[]}
                regions={[]}
                countries={[]}
            />
        );
        wrapper.instance().handleInputChange(inputText);
        wrapper.update();

        const popup = new helpers.ui.Popup(wrapper);
        const searchTab = popup.find('.nav-tabs').childAt(1);

        expect(searchTab.length).toBe(0);
    });
});
