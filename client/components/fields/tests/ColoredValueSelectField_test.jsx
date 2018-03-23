import React from 'react';
import {mount} from 'enzyme';
import {ColoredValueSelectField} from '../ColoredValueSelectField/';
import {createTestStore} from '../../../utils';
import {Provider} from 'react-redux';

const options = [
    {
        label: '1',
        value: {
            name: '1',
            qcode: 1,
        },
    },
    {
        label: '2',
        value: {
            name: '2',
            qcode: 2,
        },
    },
    {
        label: '3',
        value: {
            name: '3',
            qcode: 3,
        },
    },
];

class ColoredValueSelectFieldForm extends React.Component {
    render() {
        return (

            <ColoredValueSelectField
                options={options}
                iconName="urgency-label" />
        );
    }
}

describe('<ColoredValueSelectFieldForm />', () => {
    it('Can open pop selection pop-up', () => {
        const store = createTestStore();
        const wrapper = mount(
            <Provider store={store}>
                <ColoredValueSelectFieldForm/>
            </Provider>
        );

        wrapper.find('.dropdown__toggle').simulate('click');
        expect(wrapper.find('.ColoredValueSelect__popup').length).toBe(1);
    });

    // TODO: To be revisted
    xit('Populates all options with None as an added option', () => {
        const store = createTestStore();
        const wrapper = mount(
            <Provider store={store}>
                <ColoredValueSelectFieldForm/>
            </Provider>
        );

        wrapper.find('.dropdown__toggle').simulate('click');
        const list = wrapper.find('ul');

        expect(list.children().length).toBe(options.length + 1);
        const firstChild = list.children().first()
            .find('span')
            .get(0);

        expect(firstChild.textContent).toBe('None');
    });

    it('Appropriate class names are assigned to each option', () => {
        const store = createTestStore();
        const wrapper = mount(
            <Provider store={store}>
                <ColoredValueSelectFieldForm/>
            </Provider>
        );

        wrapper.find('.dropdown__toggle').simulate('click');
        const children = wrapper.find('ul').children();

        expect(children.length).toBe(options.length + 1);
        expect(children.at(1).find('span')
            .first()
            .hasClass('urgency-label--1')).toBe(true);
        expect(children.at(2).find('span')
            .first()
            .hasClass('urgency-label--2')).toBe(true);
        expect(children.at(3).find('span')
            .first()
            .hasClass('urgency-label--3')).toBe(true);
    });
});