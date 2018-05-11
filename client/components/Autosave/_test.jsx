import React from 'react';
import PropTypes from 'prop-types';

import {mount} from 'enzyme';
import sinon from 'sinon';
import {cloneDeep, get, set} from 'lodash';

import {Autosave} from './index';
import {TextInput} from '../UI/Form';

import {updateFormValues} from '../../utils';
import {waitFor} from '../../utils/testUtils';
import {events} from '../../utils/testData';
import * as helpers from '../tests/helpers/ui/form';

class TestForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {diff: cloneDeep(get(props, 'initialValues'))};
        this.onChange = this.onChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'initialValues._id') !== get(this.props, 'initialValues._id')) {
            this.setState({diff: cloneDeep(nextProps.initialValues)});
        }
    }

    onChange(field, value) {
        const diff = cloneDeep(this.state.diff);

        this.props.onChange(diff, field, value);
        this.setState({diff});
    }

    render() {
        const {formName, initialValues, onSave, onLoad} = this.props;
        const {diff} = this.state;

        return (
            <div>
                <Autosave
                    formName={formName}
                    initialValues={initialValues}
                    currentValues={diff}
                    change={this.onChange}
                    interval={250}
                    save={onSave}
                    load={onLoad}
                />
                <TextInput
                    label="Name"
                    field="name"
                    value={diff.name}
                    onChange={this.onChange}
                />
                <TextInput
                    label="Slugline"
                    field="slugline"
                    value={diff.slugline}
                    onChange={this.onChange}
                />
                <TextInput
                    label="Description"
                    field="definition_short"
                    value={diff.definition_short}
                    onChange={this.onChange}
                />
            </div>
        );
    }
}

TestForm.propTypes = {
    onChange: PropTypes.func,
    formName: PropTypes.string,
    initialValues: PropTypes.object,
    onSave: PropTypes.func,
    onLoad: PropTypes.func,
};

describe('<Autosave />', () => {
    let formName;
    let onChange;
    let initialValues;

    let testEvents;

    let wrapper;
    let inputs;

    let onSave;
    let onLoad;

    let autosaves;

    beforeEach(() => {
        formName = 'event';

        initialValues = {};
        autosaves = {event: {}};
        testEvents = cloneDeep(events);

        onChange = sinon.spy((diff, field, value) => updateFormValues(diff, field, value));
        onSave = sinon.spy((objectType, diff) => set(autosaves, `${objectType}["${diff._id}"]`, diff));
        onLoad = sinon.spy((objectType, itemId) => get(autosaves, `${objectType}["${itemId}"]`));
    });

    const setWrapper = (values) => {
        initialValues = cloneDeep(values);

        wrapper = mount(
            <TestForm
                onChange={onChange}
                formName={formName}
                initialValues={initialValues}
                onSave={onSave}
                onLoad={onLoad}
            />
        );

        reloadInputs();
    };

    const reloadInputs = () => {
        inputs = {
            name: new helpers.Input(wrapper, 'name'),
            slugline: new helpers.Input(wrapper, 'slugline'),
            description: new helpers.Input(wrapper, 'definition_short'),
        };
    };

    const getAutosave = () => autosaves[formName];

    it('load from autosave if a new object is provided', () => {
        setWrapper({slugline: 'new slugline'});
        expect(onLoad.callCount).toBe(0);
        expect(getAutosave()).toEqual({});
    });

    it('loads the autosave on mount', () => {
        autosaves = {event: {e1: {slugline: 'New Slugline'}}};

        expect(getAutosave()).toEqual({e1: {slugline: 'New Slugline'}});

        setWrapper(testEvents[0]);

        expect(onLoad.callCount).toBe(1);
        expect(onLoad.args[0]).toEqual([formName, testEvents[0]._id]);
        expect(inputs.slugline.value()).toBe('New Slugline');
    });

    it('changes to values get stored in redux', (done) => {
        setWrapper(testEvents[0]);

        expect(onSave.callCount).toBe(0);

        inputs.slugline.change('New Slugline');

        // Wait for <Autosave>.save (lodash.throttle) to trigger
        waitFor(() => onSave.callCount > 0)
            .then(() => {
                expect(onSave.callCount).toBe(1);
                expect(getAutosave().e1).toEqual({
                    _id: 'e1',
                    slugline: 'New Slugline',
                });

                done();
            });
    });

    it('throttles autosaving the data', (done) => {
        setWrapper(testEvents[0]);

        for (let i = 0; i < 25; i++) {
            inputs.slugline.change(`Slug ${i}`);
        }

        // Because of throttling, we haven't actually saved the data yet
        expect(onSave.callCount).toBe(0);

        // Wait for <Autosave>.save (lodash.throttle) to trigger
        waitFor(() => onSave.callCount > 0)
            .then(() => {
                expect(onSave.callCount).toBe(1);
                done();
            });
    });

    it('switching form objects', (done) => {
        setWrapper(testEvents[0]);

        expect(onLoad.callCount).toBe(1);
        expect(onLoad.args[0]).toEqual([formName, testEvents[0]._id]);

        inputs.slugline.change('New Slugline 1');
        inputs.description.change('define me');

        // Wait for <Autosave>.save (lodash.throttle) to trigger
        waitFor(() => onSave.callCount > 0)
            .then(() => {
                expect(onSave.callCount).toBe(1);
                expect(getAutosave()).toEqual({
                    e1: {
                        _id: 'e1',
                        slugline: 'New Slugline 1',
                        definition_short: 'define me',
                    },
                });

                // Change the form to another object
                wrapper.setProps({initialValues: cloneDeep(testEvents[1])});
                wrapper.update();

                expect(onLoad.callCount).toBe(2);
                expect(onLoad.args[0]).toEqual([formName, testEvents[0]._id]);

                inputs.slugline.change('New Slugline 2');

                // Wait for <Autosave>.save (lodash.throttle) to trigger
                return waitFor(() => onSave.callCount > 1);
            })
            .then(() => {
                expect(onSave.callCount).toBe(2);
                wrapper.update();

                expect(getAutosave()).toEqual({
                    e1: {
                        _id: 'e1',
                        slugline: 'New Slugline 1',
                        definition_short: 'define me',
                    },
                    e2: {
                        _id: 'e2',
                        slugline: 'New Slugline 2',
                    },
                });

                // Change the form to create a new object
                wrapper.setProps({initialValues: {_tempId: 'temp123', slugline: 'New Form Object'}});
                wrapper.update();

                inputs.slugline.change('Autosave new object');

                return waitFor(() => onSave.callCount > 2);
            })
            .then(() => {
                expect(onSave.callCount).toBe(3);
                expect(getAutosave()).toEqual({
                    e1: {
                        _id: 'e1',
                        slugline: 'New Slugline 1',
                        definition_short: 'define me',
                    },
                    e2: {
                        _id: 'e2',
                        slugline: 'New Slugline 2',
                    },
                    temp123: {
                        _id: 'temp123',
                        slugline: 'Autosave new object',
                    },
                });

                // Change form back to the first event
                wrapper.setProps({initialValues: cloneDeep(testEvents[0])});
                wrapper.update();

                expect(onLoad.callCount).toBe(4);
                wrapper.update();
                reloadInputs();

                expect(inputs.slugline.value()).toBe('New Slugline 1');
                expect(inputs.description.value()).toBe('define me');

                done();
            });
    });
});
