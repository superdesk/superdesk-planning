import React from 'react';
import {mount} from 'enzyme';
import {DaysOfWeek} from '../index';
import sinon from 'sinon';

describe('<DaysOfWeek />', () => {
    it('generates strings with day names', () => {
        const onButtonClick = sinon.spy((s) => {
            if (onButtonClick.callCount === 3) {
                expect(s).toBe('MO WE SA');
            }
        });
        let meta = {touched: false};
        let input = {
            onChange: onButtonClick,
            value: '',
        };
        let wrapper = mount(<DaysOfWeek input={input} meta={meta} />);

        wrapper.find('.sd-checkbox').at(0)
            .simulate('click');
        wrapper.find('.sd-checkbox').at(2)
            .simulate('click');
        wrapper.find('.sd-checkbox').at(5)
            .simulate('click');
        expect(onButtonClick.callCount).toBe(3);
    });

    it('works well with initial value', () => {
        let meta = {touched: false};
        let input = {
            onChange: sinon.spy((s) => {
                expect(s).toBe('MO TU SA SU');
            }),
            value: 'MO TU SU',
        };
        let wrapper = mount(<DaysOfWeek input={input} meta={meta}/>);

        expect(wrapper.state().MO).toBe(true);
        expect(wrapper.state().TU).toBe(true);
        expect(wrapper.state().WE).toBe(false);
        expect(wrapper.state().TH).toBe(false);
        expect(wrapper.state().FR).toBe(false);
        expect(wrapper.state().SA).toBe(false);
        expect(wrapper.state().SU).toBe(true);
        expect(wrapper.find('Checkbox').at(0)
            .props().value).toBe(true);
        expect(wrapper.find('Checkbox').at(2)
            .props().value).toBe(false);
        wrapper.find('.sd-checkbox').at(5)
            .simulate('click');
        expect(input.onChange.calledOnce).toBe(true);
    });
});
