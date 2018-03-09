import React from 'react';
import PropTypes from 'prop-types';
import {mount} from 'enzyme';
import sinon from 'sinon';
import {get, set, cloneDeep} from 'lodash';

import {validateItem, validators} from '../index';
import {
    Field,
    TextInput,
    TextAreaInput,
    FileInput,
    LinkInput,
    SelectInput,
    ColouredValueInput,
    DateInput,
    DateTimeInput,
    TimeInput,
    SelectMetaTermsInput,
    SelectTagInput,
} from '../../components/UI/Form';

import * as helpers from '../../components/tests/helpers/ui/form';

const TestForm = ({formData}) => {
    const fieldProps = {
        item: formData.item,
        diff: formData.diff,
        onChange: formData.onChange,
        errors: formData.errors,
        showErrors: formData.showErrors
    };

    return (
        <div>
            <Field {...fieldProps} component={TextInput} field="name" />
            <Field {...fieldProps} component={TextInput} field="slugline" />
            <Field {...fieldProps} component={TextAreaInput} field="description" />
            <Field {...fieldProps} component={FileInput} field="file" />
            <Field {...fieldProps} component={LinkInput} field="link" />
            <Field {...fieldProps} component={SelectInput} field="opts" options={[]} defaultValue={{}} />
            <Field {...fieldProps} component={ColouredValueInput} field="colour"
                iconName="test" defaultValue={{}} options={[]}/>
            <Field {...fieldProps} component={DateInput} field="date" dateFormat=""/>
            <Field {...fieldProps} component={DateTimeInput} field="datetime" dateFormat="" timeFormat=""/>
            <Field {...fieldProps} component={TimeInput} field="time" timeFormat=""/>
            <Field {...fieldProps} component={SelectMetaTermsInput} field="meta"
                options={[]} defaultValue={{}}/>
            <Field {...fieldProps} component={SelectTagInput} field="tags"
                options={[]} defaultValue={[]}/>
        </div>
    );
};

TestForm.propTypes = {formData: PropTypes.object};

describe('validators', () => {
    let state;
    let onChange;
    let formData;
    let validate1;
    let validate2;

    let validateRequired;

    // Mock redux functions
    const getState = sinon.spy(() => state);
    const dispatch = sinon.spy((action) => typeof action === 'function' ? action(dispatch, getState) : action);

    beforeEach(() => {
        state = {};

        onChange = sinon.spy((field, value) => {
            formData.diff = cloneDeep(formData.diff);
            set(formData.diff, field, value);

            dispatch(validateItem('test', formData.diff, {}, formData.errors));
        });

        formData = {
            onChange: onChange,
            errors: {},
            showErrors: true,
            item: {
                slugline: 'slugline 1',
                name: 'name 2'
            }
        };

        validateRequired = sinon.spy((dispatch, getState, field, value, profile, e) => {
            if (get(value, length, 0) < 1) {
                if (field === 'datetime') {
                    e.datetime = {
                        date: 'This field is required',
                        time: 'This field is required'
                    };
                } else {
                    e[field] = 'This field is required';
                }
            }
        });

        validate1 = sinon.spy((dispatch, getState, field, value, profile, e) => {
            if (field === 'slugline') {
                e[field] = 'Validate 1 failed';
            }
        });

        validate2 = sinon.spy((dispatch, getState, field, value, profile, e) => {
            e[field] = 'Validate 2 failed';
        });

        validators.test = {
            slugline: [validate1],
            name: [validate1, validate2],
        };
    });

    describe('test form', () => {
        let wrapper;
        let inputs;

        beforeEach(() => {
            validators.test = {
                slugline: [validate1],
                name: [validate1, validate2],
                description: [validateRequired],
                file: [validateRequired],
                link: [validateRequired],
                opts: [validateRequired],
                colour: [validateRequired],
                date: [validateRequired],
                datetime: [validateRequired],
                time: [validateRequired],
                meta: [validateRequired],
                tags: [validateRequired],
            };
        });

        const setWrapper = () => {
            formData.diff = cloneDeep(formData.item);

            wrapper = mount(
                <TestForm formData={formData}/>
            );

            inputs = {
                name: new helpers.Input(wrapper, 'name'),
                slug: new helpers.Input(wrapper, 'slugline'),
                desc: new helpers.Input(wrapper, 'description'),
                file: new helpers.Input(wrapper, 'file'),
                link: new helpers.Input(wrapper, 'link'),
                opts: new helpers.Input(wrapper, 'opts'),
                colour: new helpers.Input(wrapper, 'colour'),
                date: new helpers.Input(wrapper, 'date'),
                datetime: new helpers.DateTime(wrapper, 'datetime'),
                time: new helpers.Input(wrapper, 'time'),
                meta: new helpers.Input(wrapper, 'meta'),
                tags: new helpers.Input(wrapper, 'tags'),
            };

            // Validate on first render
            dispatch(validateItem('test', formData.diff, {}, formData.errors));
            wrapper.update();
        };

        // TODO: To be revisited
        xit('shows all errors if showErrors == true', () => {
            setWrapper();

            expect(inputs.slug.isInvalid()).toBe(true);
            expect(inputs.slug.getErrorMessage()).toBe('Validate 1 failed'); // Test component prop
            expect(inputs.slug.getError().text()).toBe('Validate 1 failed'); // Test component html

            expect(inputs.name.isInvalid()).toBe(true);
            expect(inputs.name.getErrorMessage()).toBe('Validate 2 failed'); // Test component prop
            expect(inputs.name.getError().text()).toBe('Validate 2 failed'); // Test component html

            expect(inputs.desc.isInvalid()).toBe(true);
            expect(inputs.desc.getErrorMessage()).toBe('This field is required'); // Test component prop
            expect(inputs.desc.getError().text()).toBe('This field is required'); // Test component html
        });

        it('doesnt show all errors if showErrors == false', () => {
            formData.showErrors = false;
            setWrapper();

            expect(inputs.slug.isInvalid()).toBe(false);
            expect(inputs.slug.getErrorMessage()).toBe(null); // Test component prop
            expect(inputs.slug.getError().length).toBe(0); // Test component html

            expect(inputs.name.isInvalid()).toBe(false);
            expect(inputs.name.getErrorMessage()).toBe(null); // Test component prop
            expect(inputs.name.getError().length).toBe(0); // Test component html
        });

        // TODO: To be revisited
        xit('shows errors on dirty fields only', () => {
            formData.showErrors = false;
            setWrapper();

            inputs.slug.change('New Slugline');
            expect(inputs.slug.isInvalid()).toBe(true);
            expect(inputs.slug.getErrorMessage()).toBe('Validate 1 failed'); // Test component prop
            expect(inputs.slug.getError().text()).toBe('Validate 1 failed'); // Test component html

            expect(inputs.name.isInvalid()).toBe(false);
            expect(inputs.name.getErrorMessage()).toBe(null); // Test component prop
            expect(inputs.name.getError().length).toBe(0); // Test component html
        });

        // TODO: To be revisited
        xit('shows errors for different input field types', () => {
            setWrapper();

            expect(inputs.slug.getError().text()).toBe('Validate 1 failed');
            expect(inputs.name.getError().text()).toBe('Validate 2 failed');
            expect(inputs.desc.getError().text()).toBe('This field is required');
            expect(inputs.file.getError().text()).toBe('This field is required');
            expect(inputs.link.getError().text()).toBe('This field is required');
            expect(inputs.opts.getError().text()).toBe('This field is required');
            expect(inputs.colour.getError().text()).toBe('This field is required');
            expect(inputs.date.getError().text()).toBe('This field is required');
            expect(inputs.datetime.date.getError().text()).toBe('This field is required');
            expect(inputs.datetime.time.getError().text()).toBe('This field is required');
            expect(inputs.time.getError().text()).toBe('This field is required');
            expect(inputs.meta.getError().text()).toBe('This field is required');
            expect(inputs.tags.getError().text()).toBe('This field is required');
        });
    });

    it('validateItem: calls all validators in the list', () => {
        dispatch(validateItem('test', formData.item, {}, formData.errors));

        expect(validate1.callCount).toBe(2);
        expect(validate1.args[0]).toEqual(
            [dispatch, getState, 'slugline', 'slugline 1', undefined, formData.errors]
        );
        expect(validate1.args[1]).toEqual(
            [dispatch, getState, 'name', 'name 2', undefined, formData.errors]
        );

        expect(validate2.callCount).toBe(1);
        expect(validate2.args[0]).toEqual([dispatch, getState, 'name', 'name 2', undefined, formData.errors]);

        expect(formData.errors).toEqual({
            slugline: 'Validate 1 failed',
            name: 'Validate 2 failed',
        });
    });
});
