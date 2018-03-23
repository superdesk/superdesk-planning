import React from 'react';
import {shallow} from 'enzyme';
import {ToggleBox} from './index';

describe('components', () => {
    describe('<ToggleBox/>', () => {
        const getWrapper = (title, style, isOpen) => (
            shallow(<ToggleBox
                title={title}
                style={style}
                isOpen={isOpen}>
                <span className="children">Foo Bar</span>
            </ToggleBox>)
        );

        it('set the title', () => {
            const wrapper = getWrapper('title', null, true);
            const props = wrapper.instance().props;

            expect(props.title).toBe('title');
            expect(props.isOpen).toBe(true);
            expect(wrapper.find('.toggle-box__label').childAt(0)
                .text()).toBe('title');
            expect(wrapper.find('.toggle-box__content').length).toBe(1);
            expect(wrapper.contains(<span className="children">Foo Bar</span>)).toEqual(true);
        });

        it('toggle the component', () => {
            const wrapper = getWrapper('title', null, true);
            const props = wrapper.instance().props;

            expect(props.title).toBe('title');
            expect(props.isOpen).toBe(true);
            expect(wrapper.contains(<span className="children">Foo Bar</span>)).toEqual(true);
            const header = wrapper.find('.toggle-box__header');

            header.simulate('click');
            expect(wrapper.find('.toggle-box__content').length).toBe(0);
            expect(wrapper.contains(<span className="children">Foo Bar</span>)).toEqual(false);
            header.simulate('click');
            expect(wrapper.find('.toggle-box__content').length).toBe(1);
            expect(wrapper.contains(<span className="children">Foo Bar</span>)).toEqual(true);
        });
    });
});