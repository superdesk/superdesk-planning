import React from 'react';
import {mount} from 'enzyme';

// Configures the enzyme adapter as an import side effect
import '../../../utils/testUtils';

import {superdeskApi} from '../../../superdeskApi';
import {PreviewFieldCustomVocabulary} from './CustomVocabulary';

describe('<PreviewFieldCustomVocabulary />', () => {
    const item = {
        subject: [
            {qcode: '01000000', name: 'arts and entertainment', scheme: 'topics'},
            {qcode: '02000000', name: 'crime and justice', scheme: 'topics'},
            {qcode: 'other', name: 'other value', scheme: 'another_cv'},
        ],
    };

    let originalVocabulary;

    beforeEach(() => {
        originalVocabulary = superdeskApi.entities.vocabulary;
    });

    afterEach(() => {
        Object.assign(superdeskApi.entities, {vocabulary: originalVocabulary});
    });

    const setVocabulary = (selectionType) => {
        Object.assign(superdeskApi.entities, {
            vocabulary: {
                getVocabulary: (id) => (id !== 'topics' ? null : {
                    _id: 'topics',
                    display_name: 'IPTC',
                    selection_type: selectionType,
                }),
            },
        });
    };

    it('renders multi selection values as read-only pills', () => {
        setVocabulary('multi selection');
        const wrapper = mount(<PreviewFieldCustomVocabulary item={item} fieldName="topics" language="en" />);
        const pills = wrapper.find('.tag-label');

        expect(pills.length).toBe(2);
        expect(pills.at(0).text()).toBe('arts and entertainment');
        expect(pills.at(1).text()).toBe('crime and justice');

        // Read-only: no remove buttons
        expect(wrapper.find('.tag-label__remove').length).toBe(0);
    });

    it('renders single selection values as plain text', () => {
        setVocabulary('single selection');
        const wrapper = mount(<PreviewFieldCustomVocabulary item={item} fieldName="topics" language="en" />);

        expect(wrapper.find('.tag-label').length).toBe(0);
        expect(wrapper.text()).toContain('arts and entertainment, crime and justice');
    });

    it('renders a labelled dash when empty and renderEmpty is set', () => {
        setVocabulary('multi selection');
        const wrapper = mount(
            <PreviewFieldCustomVocabulary
                item={{subject: []}}
                fieldName="topics"
                language="en"
                renderEmpty={true}
            />
        );

        expect(wrapper.text()).toContain('IPTC');
        expect(wrapper.text()).toContain('-');
    });

    it('renders nothing when empty without renderEmpty', () => {
        setVocabulary('multi selection');
        const wrapper = mount(
            <PreviewFieldCustomVocabulary item={{subject: []}} fieldName="topics" language="en" />
        );

        expect(wrapper.isEmptyRender()).toBe(true);
    });
});
