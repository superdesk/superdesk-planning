import React from 'react';
import {mount} from 'enzyme';

// Configures the enzyme adapter as an import side effect
import '../../../utils/testUtils';

import {ExpandableText} from './ExpandableText';

describe('<ExpandableText />', () => {
    const getLink = (wrapper) => wrapper.find('.sd-text__expandable-link');

    it('does not truncate short values', () => {
        const wrapper = mount(<ExpandableText value={'short text'} />);

        expect(wrapper.text()).toContain('short text');
        expect(getLink(wrapper).length).toBe(0);
    });

    it('truncates values with more lines than expandAt', () => {
        const wrapper = mount(<ExpandableText value={'one\ntwo\nthree\nfour'} />);

        expect(wrapper.text()).toContain('one');
        expect(wrapper.text()).toContain('three');
        expect(wrapper.text()).not.toContain('four');
        expect(getLink(wrapper).text()).toContain('Show all');
    });

    it('truncates a single long paragraph by character count', () => {
        const wrapper = mount(<ExpandableText value={'a'.repeat(600)} />);
        const text = wrapper.find('p').text();

        expect(text).toContain('a'.repeat(500));
        expect(text).not.toContain('a'.repeat(501));
        expect(getLink(wrapper).text()).toContain('Show all');
    });

    it('does not offer expanding when newlines push the raw length over the limit but no content is hidden', () => {
        // 500 visible characters over 2 lines: raw length is 501 due to the newline
        const wrapper = mount(<ExpandableText value={'a'.repeat(250) + '\n' + 'b'.repeat(250)} />);

        expect(getLink(wrapper).length).toBe(0);
        expect(wrapper.text()).toContain('b'.repeat(250));
    });

    it('expands and collapses on link click', () => {
        const wrapper = mount(<ExpandableText value={'b'.repeat(600)} />);

        getLink(wrapper).simulate('click');
        expect(wrapper.find('p').text()).toContain('b'.repeat(600));
        expect(getLink(wrapper).text()).toContain('Show less');

        getLink(wrapper).simulate('click');
        expect(wrapper.find('p').text()).not.toContain('b'.repeat(600));
        expect(getLink(wrapper).text()).toContain('Show all');
    });
});
