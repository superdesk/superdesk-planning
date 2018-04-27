import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import Toggle from './index';

describe('components', () => {
    describe('<Toggle />', () => {
        let onChange;
        let value;
        let readOnly;

        beforeEach(() => {
            onChange = sinon.spy();
            value = undefined;
            readOnly = undefined;
        });

        const getWrapper = () => (
            mount(<Toggle
                value={value}
                onChange={onChange}
                readOnly={readOnly}
            />)
        );

        it('default value and readOnly values', () => {
            const wrapper = getWrapper();
            const props = wrapper.props();
            const button = wrapper.find('button').first();

            expect(props.value).toBe(false);
            expect(props.readOnly).toBe(false);

            // Test CSS classes
            expect(button.hasClass('sd-toggle')).toBe(true);
            expect(button.hasClass('checked')).toBe(false);
            expect(button.hasClass('disabled')).toBe(false);
        });

        it('readOnly', () => {
            value = true;
            readOnly = true;
            const wrapper = getWrapper();
            const props = wrapper.props();
            const button = wrapper.find('button').first();

            // Test properties
            expect(props.value).toBe(true);
            expect(props.readOnly).toBe(true);

            // Test CSS classes
            expect(button.hasClass('sd-toggle')).toBe(true);
            expect(button.hasClass('checked')).toBe(true);
            expect(button.hasClass('disabled')).toBe(true);
        });

        it('calls onChange', () => {
            let wrapper = getWrapper();
            let button = wrapper.find('button').first();

            button.simulate('click');
            expect(onChange.callCount).toBe(1);
            expect(onChange.args[0]).toEqual([{target: {value: true}}]);

            value = true;
            wrapper = getWrapper();
            button = wrapper.find('button').first();
            button.simulate('click');
            expect(onChange.callCount).toBe(2);
            expect(onChange.args[1]).toEqual([{target: {value: false}}]);
        });

        it('doesnt call onChange when readOnly', () => {
            readOnly = true;
            const wrapper = getWrapper();
            const button = wrapper.find('button').first();

            button.simulate('click');
            expect(onChange.callCount).toBe(0);
        });
    });
});
