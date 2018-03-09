import React from 'react';
import {mount} from 'enzyme';
import {GeoLookupInputComponent} from './index';
import sinon from 'sinon';
import * as helpers from '../../../tests/helpers';

// TODO: to be revisited
xdescribe('<AddGeoLookupInput />', () => {
    let inputText;
    let initialValue;
    let handleSearch;
    let onChange;
    let wrapper;

    beforeEach(() => {
        inputText = {target: {value: 'Syd'}};
        initialValue = {name: 'Timbaktu'};
        handleSearch = sinon.stub().returns(Promise.resolve());

        onChange = sinon.spy((field, value) => {
            wrapper.setProps({initialValue: value});
        });
    });

    const setWrapper = () => {
        wrapper = mount(
            <GeoLookupInputComponent
                initialValue={initialValue}
                onChange={onChange}
                searchLocalLocations={handleSearch}
            />
        );
        return wrapper;
    };

    it('calls location search action on typeahead', () => {
        setWrapper();
        wrapper.instance().handleInputChange(inputText);

        expect(onChange.callCount).toBe(1);
        expect(onChange.args[0]).toEqual([undefined, {name: 'Syd'}]);

        expect(handleSearch.callCount).toBe(1);
        expect(handleSearch.args[0]).toEqual(['Syd']);
    });

    it('opens search external popup on text input', () => {
        setWrapper();
        wrapper.instance().handleInputChange(inputText);

        const popup = new helpers.ui.Popup(wrapper);
        const suggestsPopup = popup.find('.addgeolookup__suggests-wrapper').at(0);

        expect(suggestsPopup.find('button').length).toBe(1);
    });

    it('invokes external search', () => {
        setWrapper();
        wrapper.instance().handleInputChange(inputText);
        const externalSearchSpy = sinon.stub(wrapper.instance(),
            'handleSearchClick').callsFake(() => { /* no-op */ });

        wrapper.update();

        const popup = new helpers.ui.Popup(wrapper);
        const suggestsPopup = popup.find('.addgeolookup__suggests-wrapper').at(0);

        expect(suggestsPopup.find('button').length).toBe(1);
        suggestsPopup.find('button').at(0)
            .simulate('click');

        expect(externalSearchSpy.callCount).toBe(1);
    });

    it('external search button can be controlled by disableSearch prop', () => {
        setWrapper();
        wrapper.instance().handleInputChange(inputText);

        let popup = new helpers.ui.Popup(wrapper);

        let suggestsPopup = popup.find('.addgeolookup__suggests-wrapper').at(0);
        let searchExternalButton = suggestsPopup.find('button');

        expect(searchExternalButton.length).toBe(1);
        expect(searchExternalButton.text()).toBe('Search External');

        wrapper = mount(<GeoLookupInputComponent
            initialValue={initialValue}
            onChange={onChange}
            searchLocalLocations={handleSearch}
            disableSearch={true} />);
        wrapper.instance().handleInputChange(inputText);
        popup = new helpers.ui.Popup(wrapper);

        suggestsPopup = popup.find('.addgeolookup__suggests-wrapper').at(0);
        searchExternalButton = suggestsPopup.find('button');
        expect(searchExternalButton.length).toBe(0);
    });
});
