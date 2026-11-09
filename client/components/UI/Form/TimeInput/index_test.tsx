import React from 'react';
import {mount} from 'enzyme';
import moment from 'moment';
import sinon from 'sinon';

import '../../../../utils/testUtils';
import {TimeInput} from './index';

describe('TimeInput', () => {
    let wrapper;
    let onChange;

    const mountInput = (props = {}) => {
        onChange = sinon.stub();
        wrapper = mount(
            <TimeInput
                field="time"
                value={moment('2040-01-02T09:30:00').local(true)}
                onChange={onChange}
                canClear={true}
                {...props}
            />
        );
    };

    const changeAndBlur = (value) => {
        wrapper.find('input').simulate('change', {target: {value}});
        wrapper.find('input').simulate('blur');
        wrapper.update();
    };

    afterEach(() => {
        wrapper.unmount();
    });

    it('restores the mounted time after an invalid first edit without clearing it', () => {
        mountInput();
        changeAndBlur('25:00');

        expect(wrapper.find('input').prop('value')).toBe('09:30');
        expect(onChange.called).toBe(false);
    });

    it('restores the latest valid edit after invalid input', () => {
        mountInput();
        changeAndBlur('10:45');
        onChange.resetHistory();
        changeAndBlur('25:00');

        expect(wrapper.find('input').prop('value')).toBe('10:45');
        expect(onChange.callCount).toBe(1);
        expect(onChange.args[0][1].format('HH:mm')).toBe('10:45');
    });

    it('still allows explicitly clearing a mounted time', () => {
        mountInput();
        changeAndBlur('');

        expect(wrapper.find('input').prop('value')).toBe('');
        expect(onChange.calledWith('time', null)).toBe(true);
    });

    it('does not restore a removed time after clearing and then entering invalid input', () => {
        mountInput();
        onChange.callsFake(() => {
            expect(wrapper.state('invalid')).toBe(false);
            expect(wrapper.state('previousValidValue')).toBe('');
            wrapper.setProps({value: null});
        });
        changeAndBlur('');

        expect(onChange.calledWith('time', null)).toBe(true);
        onChange.resetHistory();
        onChange.resetBehavior();
        changeAndBlur('25:00');

        expect(wrapper.find('input').prop('value')).toBe('');
        expect(wrapper.state('invalid')).toBe(false);
        expect(onChange.callCount).toBe(1);
        expect(onChange.calledWithExactly('time', null)).toBe(true);
    });

    it('keeps the previous valid value empty for To Be Confirmed', () => {
        mountInput({toBeConfirmed: true});

        expect(wrapper.find('input').prop('value')).toBe('To Be Confirmed');
        expect(wrapper.state('previousValidValue')).toBe('');
    });

    it('keeps an initially empty time empty after invalid input', () => {
        mountInput({value: null});
        changeAndBlur('25:00');

        expect(wrapper.find('input').prop('value')).toBe('');
        expect(onChange.calledWith('time', null)).toBe(true);
    });
});
