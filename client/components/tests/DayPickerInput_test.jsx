import React from 'react';
import { mount } from 'enzyme';
import { DayPickerInput } from '../index';
import Formsy from 'formsy-react';
import sinon from 'sinon';
import moment from 'moment';

const TestForm = React.createClass({
    render() {
        return (
            <Formsy.Form onSubmit={this.props.onSubmit}>
                <DayPickerInput defaultValue={'1989-12-12T13:43:00+00:00'}
                name="datetime"
                ref='dayPicker'
                withTime={this.props.withTime} />
            </Formsy.Form>
        );
    }
});

describe('<DayPickerInput />', () => {
    it('parse the defaultValue', () => {
        const wrapper = mount(<TestForm withTime={true} />);
        const dayPickerState = wrapper.ref('dayPicker').get(0).state;
        expect(dayPickerState.selectedTime).toBe('1:43 PM');
        expect(dayPickerState.selectedDate.isSame(moment.utc('1989-12-12'))).toBe(true);
    });
    it('hide the time when needed', () => {
        var wrapper;
        wrapper = mount(<TestForm withTime={false}/>);
        expect(wrapper.find('[name="time"]').length).toBe(0);
        wrapper = mount(<TestForm withTime={true}/>);
        expect(wrapper.find('[name="time"]').length).toBe(1);
    });
    it('return the right date', () => {
        const onSubmit = sinon.spy((form) =>
            expect(form.datetime.isSame('1989-12-12T13:43:00+00:00')).toBe(true)
        );
        const wrapper = mount(<TestForm withTime={true} onSubmit={onSubmit}/>);
        wrapper.find('form').simulate('submit');
        expect(onSubmit.calledOnce).toBe(true);
    });
});
