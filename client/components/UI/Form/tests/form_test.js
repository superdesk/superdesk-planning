import React from 'react';
import PropTypes from 'prop-types';
import {mount} from 'enzyme';
import sinon from 'sinon';
import {set} from 'lodash';

import * as helpers from '../../../tests/helpers/ui/form';

import {
    TextInput,
    SelectInput,
    TextAreaInput,
    LinkInput,
    InputArray,
} from '../';

const selectOptions = [
    {label: 'One', qcode: 'one'},
    {label: 'Two', qcode: 'two'},
    {label: 'Three', qcode: 'three'},
    {label: 'Four', qcode: 'four'},
];

const TestForm = ({onChange, values}) => (
    <div>
        <TextInput
            label="Name"
            field="name"
            value={values.name}
            onChange={onChange}
        />

        <TextInput
            label="Age"
            field="age"
            value={values.age}
            type="number"
            onChange={onChange}
        />

        <SelectInput
            label="Choice"
            field="choice"
            value={values.choice}
            onChange={onChange}
            options={selectOptions}
        />

        <TextAreaInput
            label="Bio"
            field="bio"
            value={values.bio}
            onChange={onChange}
        />

        <LinkInput
            label="URL"
            field="url"
            value={values.url}
            onChange={onChange}
        />

        <InputArray
            field="links"
            value={values.links}
            onChange={onChange}
            addButtonText="Add a link"
            element={LinkInput}
            defaultElement=""
        />
    </div>
);

TestForm.propTypes = {
    onChange: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
};

// TODO: To be revisited
xdescribe('components.UI.Form', () => {
    let onChange;
    let values;
    let wrapper;
    let inputs;

    beforeEach(() => {
        values = {};

        onChange = sinon.spy((field, value) => set(values, field, value));
    });

    const setWrapper = () => {
        wrapper = mount(
            <TestForm
                onChange={onChange}
                values={values}
            />
        );

        inputs = {
            name: new helpers.Input(wrapper, 'name'),
            age: new helpers.Input(wrapper, 'age'),
            choice: new helpers.Input(wrapper, 'choice', 'select'),
            bio: new helpers.Input(wrapper, 'bio', 'textarea'),
            url: new helpers.Input(wrapper, 'url'),
            links: new helpers.InputArray(wrapper, 'links')
        };
    };

    it('manages data using input elements', () => {
        setWrapper();
        let callCount = 0;

        inputs.name.change('Bob');
        callCount += 1;
        expect(onChange.callCount).toBe(callCount);
        expect(onChange.args[callCount - 1]).toEqual(['name', 'Bob']);
        expect(inputs.name.value()).toBe('Bob');
        expect(values).toEqual({
            name: 'Bob'
        });

        inputs.age.change(31);
        callCount += 1;
        expect(onChange.callCount).toBe(callCount);
        expect(onChange.args[callCount - 1]).toEqual(['age', 31]);
        expect(inputs.age.value()).toBe(31);
        expect(values).toEqual({
            name: 'Bob',
            age: 31
        });

        inputs.choice.change('two');
        callCount += 1;
        expect(onChange.callCount).toBe(callCount);
        expect(onChange.args[callCount - 1]).toEqual(['choice', {label: 'Two', qcode: 'two'}]);
        expect(inputs.choice.value()).toBe('two');
        expect(values).toEqual({
            name: 'Bob',
            age: 31,
            choice: {label: 'Two', qcode: 'two'}
        });

        inputs.bio.change('my\nname\nis\nBob');
        callCount += 1;
        expect(onChange.callCount).toBe(callCount);
        expect(onChange.args[callCount - 1]).toEqual(['bio', 'my\nname\nis\nBob']);
        expect(inputs.bio.value()).toBe('my\nname\nis\nBob');
        expect(values).toEqual({
            name: 'Bob',
            age: 31,
            choice: {label: 'Two', qcode: 'two'},
            bio: 'my\nname\nis\nBob'
        });

        inputs.links.add();
        callCount += 1;
        expect(onChange.callCount).toBe(callCount);
        expect(onChange.args[callCount - 1]).toEqual(['links', ['']]);
        expect(inputs.links.value()).toEqual(['']);
        expect(inputs.links.value(0)).toEqual('');
        expect(values).toEqual({
            name: 'Bob',
            age: 31,
            choice: {label: 'Two', qcode: 'two'},
            bio: 'my\nname\nis\nBob',
            links: ['']
        });

        inputs.links.update(0, 'https://github.com/superdesk');
        callCount += 1;
        expect(onChange.callCount).toBe(callCount);
        expect(onChange.args[callCount - 1]).toEqual(['links[0]', 'https://github.com/superdesk']);
        expect(inputs.links.value()).toEqual(['https://github.com/superdesk']);
        expect(inputs.links.value(0)).toEqual('https://github.com/superdesk');
        expect(values).toEqual({
            name: 'Bob',
            age: 31,
            choice: {label: 'Two', qcode: 'two'},
            bio: 'my\nname\nis\nBob',
            links: ['https://github.com/superdesk']
        });

        inputs.links.add();
        callCount += 1;
        expect(onChange.callCount).toBe(callCount);
        expect(onChange.args[callCount - 1]).toEqual(['links', ['https://github.com/superdesk', '']]);
        expect(inputs.links.value()).toEqual(['https://github.com/superdesk', '']);
        expect(inputs.links.value(0)).toEqual('https://github.com/superdesk');
        expect(inputs.links.value(1)).toEqual('');
        expect(values).toEqual({
            name: 'Bob',
            age: 31,
            choice: {label: 'Two', qcode: 'two'},
            bio: 'my\nname\nis\nBob',
            links: [
                'https://github.com/superdesk',
                ''
            ]
        });

        inputs.links.remove(0);
        callCount += 1;
        expect(onChange.callCount).toBe(callCount);
        expect(onChange.args[callCount - 1]).toEqual(['links', ['']]);
        expect(inputs.links.value()).toEqual(['']);
        expect(inputs.links.value(0)).toEqual('');
        expect(values).toEqual({
            name: 'Bob',
            age: 31,
            choice: {label: 'Two', qcode: 'two'},
            bio: 'my\nname\nis\nBob',
            links: ['']
        });
    });

    it('LinkInput', () => {
        setWrapper();

        // Sets the label to be the domain name of the URL
        inputs.url.change('https://github.com/superdesk');
        expect(
            inputs.url
                .find('a')
                .at(1)
                .text()
        ).toBe('github.com');
    });
});
