import React from 'react';
import {mount} from 'enzyme';

// Configures the enzyme adapter as an import side effect
import '../../../utils/testUtils';

import {superdeskApi} from '../../../superdeskApi';
import {PreviewFieldPriority} from './Priority';

describe('<PreviewFieldPriority />', () => {
    let originalVocabulary;

    beforeEach(() => {
        originalVocabulary = superdeskApi.entities.vocabulary;
        Object.assign(superdeskApi.entities, {
            vocabulary: {
                getAll: () => new Map([['priority', {
                    _id: 'priority',
                    display_name: 'Aiheen tärkeys',
                    items: [
                        {qcode: 1, name: 'Pääaihe (3 300)', color: '#ed021a'},
                        {qcode: 2, name: 'Perus (2 000)', color: '#dfa37c'},
                    ],
                }]]),
                getVocabularyItemNameTranslated: (item) => item.name,
            },
        });
    });

    afterEach(() => {
        Object.assign(superdeskApi.entities, {vocabulary: originalVocabulary});
    });

    it('renders the value as a coloured badge', () => {
        const wrapper = mount(<PreviewFieldPriority item={{priority: 2}} />);

        expect(wrapper.text()).toContain('Priority');
        expect(wrapper.text()).toContain('Perus (2 000)');
    });

    it('renders plain text when the value has no colour configured', () => {
        const wrapper = mount(<PreviewFieldPriority item={{priority: 9}} />);

        expect(wrapper.text()).toContain('9');
        expect(wrapper.find('div[data-test-id="priority-badge"]').length).toBe(0);
        expect(wrapper.find('span[data-test-id="priority-badge"]').length).toBe(1);
    });

    it('renders a dash when empty and renderEmpty is set', () => {
        const wrapper = mount(<PreviewFieldPriority item={{}} renderEmpty={true} />);

        expect(wrapper.text()).toContain('Priority');
        expect(wrapper.text()).toContain('-');
    });

    it('renders nothing when empty without renderEmpty', () => {
        const wrapper = mount(<PreviewFieldPriority item={{}} />);

        expect(wrapper.isEmptyRender()).toBe(true);
    });
});
