import React from 'react';
import {shallow} from 'enzyme';
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
            shallow(<Toggle
                value={value}
                onChange={onChange}
                readOnly={readOnly}
            />)
        );

        // TODO: to be revisted
        xit('default value and readOnly values', () => {
            const wrapper = getWrapper();
            const props = wrapper.instance().props;
            const span = wrapper.find('span').first();

            // Test properties
            expect(props.value).toBe(false);
            expect(props.readOnly).toBe(false);

            // Test CSS classes
            expect(span.hasClass('sd-toggle')).toBe(true);
            expect(span.hasClass('checked')).toBe(false);
            expect(span.hasClass('disabled')).toBe(false);
        });

        // TODO: to be revisted
        xit('readOnly', () => {
            value = true;
            readOnly = true;
            const wrapper = getWrapper();
            const props = wrapper.instance().props;
            const span = wrapper.find('span').first();

            // Test properties
            expect(props.value).toBe(true);
            expect(props.readOnly).toBe(true);

            // Test CSS classes
            expect(span.hasClass('sd-toggle')).toBe(true);
            expect(span.hasClass('checked')).toBe(true);
            expect(span.hasClass('disabled')).toBe(true);
        });

        it('calls onChange', () => {
            let wrapper = getWrapper();
            let span = wrapper.find('span').first();

            span.simulate('click');
            expect(onChange.callCount).toBe(1);
            expect(onChange.args[0]).toEqual([{target: {value: true}}]);

            value = true;
            wrapper = getWrapper();
            span = wrapper.find('span').first();
            span.simulate('click');
            expect(onChange.callCount).toBe(2);
            expect(onChange.args[1]).toEqual([{target: {value: false}}]);
        });

        it('doesnt call onChange when readOnly', () => {
            readOnly = true;
            const wrapper = getWrapper();
            const span = wrapper.find('span').first();

            span.simulate('click');
            expect(onChange.callCount).toBe(0);
        });
    });
});
