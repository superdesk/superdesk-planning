/* eslint-disable react/no-multi-comp */
import React from 'react';
import {mount} from 'enzyme';
import simulant from 'simulant';
import {TagSelectField} from '../index';

const options = [
    {
        name: 'keyword1',
        qcode: 'qcode1',
    },
    {
        name: 'keyword2',
        qcode: 'qcode2',
    },
    {
        name: 'keyword3',
        qcode: 'qcode3',
    }];

const input = {onChange: () => { /* no-op */ }};

describe('<TagSelectField />', () => {
    it('Click will open the popup', () => {
        const wrapper = mount(
            <TagSelectField options={options} input={input}/>
        );

        wrapper.find('input').simulate('click');
        expect(wrapper.find('.Select__popup').length).toBe(1);
    });

    it('Down arrow key will open the popup', () => {
        const wrapper = mount(
            <TagSelectField options={options} input={input}/>,
            {attachTo: document.body}
        );

        expect(wrapper.find('.Select__popup').length).toBe(0);
        const event = simulant('keydown', {keyCode: 40});

        simulant.fire(document.body.querySelector('.sd-line-input__input'), event);
        expect(wrapper.find('.Select__popup').length).toBe(1);
    });

    it('Enter key will save tag', () => {
        const onChange = (val) => {
            expect(['qcode1', 'qcode2']).toContain(val[0]);
        };

        let inputWithValueCheck = {
            value: ['qcode2'],
            onChange: onChange,
        };

        mount(
            <TagSelectField options={options} input={inputWithValueCheck}/>,
            {attachTo: document.body}
        );

        const event = simulant('keydown', {keyCode: 13});

        simulant.fire(document.body.querySelector('.sd-line-input__input'), event);
    });

    xit('ESC key will close the popup', () => {
        const wrapper = mount(
            <TagSelectField options={options} input={input}/>,
            {attachTo: document.body}
        );

        expect(wrapper.find('.Select__popup').length).toBe(0);
        const event1 = simulant('keydown', {keyCode: 40});

        simulant.fire(document.body.querySelector('.sd-line-input__input'), event1);
        expect(wrapper.find('.Select__popup').length).toBe(1);

        const event2 = simulant('keydown', {keyCode: 27});

        simulant.fire(document.body.querySelector('.sd-line-input__input'), event2);
        expect(wrapper.find('.Select__popup').length).toBe(0);
    });
});