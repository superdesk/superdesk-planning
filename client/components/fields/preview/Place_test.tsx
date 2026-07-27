import React from 'react';
import {mount} from 'enzyme';

// Configures the enzyme adapter as an import side effect
import '../../../utils/testUtils';

import {superdeskApi} from '../../../superdeskApi';
import {PreviewFieldPlaceComponent} from './Place';

describe('<PreviewFieldPlace />', () => {
    const places = [
        {qcode: 'ACT', name: 'ACT'},
        {qcode: 'NSW', name: 'New South Wales'},
    ];
    const item = {place: [{qcode: 'ACT', name: 'ACT'}, {qcode: 'NSW', name: 'New South Wales'}]};

    let originalVocabulary;

    beforeEach(() => {
        originalVocabulary = superdeskApi.entities.vocabulary;
    });

    afterEach(() => {
        Object.assign(superdeskApi.entities, {vocabulary: originalVocabulary});
    });

    const setLocatorsVocabulary = (selectionType) => {
        Object.assign(superdeskApi.entities, {
            vocabulary: {
                getVocabulary: (id) => (id !== 'locators' ? null : {
                    _id: 'locators',
                    selection_type: selectionType,
                }),
            },
        });
    };

    it('renders places as read-only pills when locators is multi selection', () => {
        setLocatorsVocabulary('multi selection');
        const wrapper = mount(<PreviewFieldPlaceComponent item={item} places={places} language="en" />);
        const pills = wrapper.find('.tag-label');

        expect(pills.length).toBe(2);
        expect(pills.at(0).text()).toBe('ACT');
        expect(pills.at(1).text()).toBe('New South Wales');
        expect(wrapper.find('.tag-label__remove').length).toBe(0);
    });

    it('renders places as plain text when locators is single selection', () => {
        setLocatorsVocabulary('single selection');
        const wrapper = mount(<PreviewFieldPlaceComponent item={item} places={places} language="en" />);

        expect(wrapper.find('.tag-label').length).toBe(0);
        expect(wrapper.text()).toContain('ACT, New South Wales');
    });

    it('renders a dash when empty and renderEmpty is set', () => {
        setLocatorsVocabulary('multi selection');
        const wrapper = mount(
            <PreviewFieldPlaceComponent item={{}} places={places} language="en" renderEmpty={true} />
        );

        expect(wrapper.text()).toContain('Places');
        expect(wrapper.text()).toContain('-');
    });
});
