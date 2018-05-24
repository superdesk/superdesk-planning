import React from 'react';
import PropTypes from 'prop-types';
import {mount} from 'enzyme';
import sinon from 'sinon';
import {cloneDeep, get, set} from 'lodash';
import moment from 'moment';

import {Autosave} from './index';
import {TextInput} from '../UI/Form';

import {updateFormValues, getAutosaveItem} from '../../utils';
import {waitFor} from '../../utils/testUtils';
import {events} from '../../utils/testData';
import * as helpers from '../tests/helpers/ui/form';

class TestForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {diff: cloneDeep(get(props, 'initialValues')) || {}};
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
    let onLoadCallback;

    let autosaves;

    beforeEach(() => {
        formName = 'event';

        initialValues = {};
        autosaves = {event: {}};
        testEvents = cloneDeep(events);

        onChange = sinon.spy((diff, field, value) => updateFormValues(diff, field, value));
        onSave = sinon.spy((diff) => set(autosaves, `${formName}["${diff._id}"]`, diff));

        onLoadCallback = sinon.spy((itemType, itemId) => Promise.resolve(getAutosaveItem(autosaves, itemType, itemId)));
        onLoad = sinon.spy((itemType, itemId) => onLoadCallback(itemType, itemId));
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

        reloadInputs(false);

        // Wait for <Autosave> to load the autosave item
        return waitFor(() => onLoadCallback.callCount > 0);
    };

    const reloadInputs = (updateWrapper = true) => {
        if (updateWrapper) {
            wrapper.update();
        }

        inputs = {
            name: new helpers.Input(wrapper, 'name'),
            slugline: new helpers.Input(wrapper, 'slugline'),
            description: new helpers.Input(wrapper, 'definition_short'),
        };
    };

    const getAutosave = () => autosaves[formName];

    const changeFormItem = (newItem) => {
        const callCount = onLoadCallback.callCount;

        wrapper.setProps({initialValues: cloneDeep(newItem)});
        wrapper.update();

        return waitFor(() => onLoadCallback.callCount > callCount);
    };

    it('load from autosave if a new object is provided', (done) => {
        setWrapper({slugline: 'new slugline', _id: 'tempId-44990088'})
            .then(() => {
                expect(onLoad.callCount).toBe(1);
                expect(onLoad.args[0]).toEqual([formName, 'tempId-44990088']);

                expect(getAutosave()).toEqual({
                    'tempId-44990088': {
                        _id: 'tempId-44990088',
                        slugline: 'new slugline',
                    },
                });

                done();
            }, done.fail);
    });

    it('loads the autosave on mount', (done) => {
        autosaves = {
            event: {
                e1: {
                    _id: 'e1',
                    slugline: 'New Slugline',
                },
            },
        };

        setWrapper(testEvents[0])
            .then(() => {
                expect(onLoad.callCount).toBe(1);
                expect(onLoad.args[0]).toEqual([formName, testEvents[0]._id]);

                reloadInputs();
                expect(inputs.slugline.value()).toBe('New Slugline');

                done();
            }, done.fail);
    });

    it('changes to values get stored in redux', (done) => {
        setWrapper(testEvents[0])
            .then(() => {
                expect(onSave.callCount).toBe(1);

                reloadInputs();
                inputs.slugline.change('New Slugline');

                // Wait for <Autosave>.save (lodash.throttle) to trigger
                return waitFor(() => onSave.callCount > 1);
            }, done.fail)
            .then(() => {
                expect(onSave.callCount).toBe(2);
                expect(getAutosave().e1).toEqual({
                    ...testEvents[0],
                    slugline: 'New Slugline',
                    dates: {
                        ...testEvents[0].dates,
                        start: moment(testEvents[0].dates.start),
                        end: moment(testEvents[0].dates.end),
                    },
                });

                done();
            }, done.fail);
    });

    it('throttles autosaving the data', (done) => {
        setWrapper(testEvents[0])
            .then(() => {
                // Initial save of the item
                expect(onSave.callCount).toBe(1);

                reloadInputs();
                for (let i = 0; i < 25; i++) {
                    inputs.slugline.change(`Slug ${i}`);
                }

                // Wait for <Autosave>.save (lodash.throttle) to trigger
                return waitFor(() => onSave.callCount > 1);
            }, done.fail)
            .then(() => {
                expect(onSave.callCount).toBe(2);
                done();
            }, done.fail);
    });

    it('switching form objects', (done) => {
        setWrapper(testEvents[0])
            .then(() => {
                expect(onSave.callCount).toBe(1);
                expect(onLoad.callCount).toBe(1);
                expect(onLoad.args[0]).toEqual([formName, testEvents[0]._id]);

                reloadInputs();
                inputs.slugline.change('New Slugline 1');
                inputs.description.change('define me');

                // Wait for <Autosave>.save (lodash.throttle) to trigger
                return waitFor(() => onSave.callCount > 1);
            }, done.fail)
            .then(() => {
                expect(onSave.callCount).toBe(2);
                expect(getAutosave()).toEqual({
                    e1: {
                        ...testEvents[0],
                        dates: {
                            ...testEvents[0].dates,
                            start: moment(testEvents[0].dates.start),
                            end: moment(testEvents[0].dates.end),
                        },
                        slugline: 'New Slugline 1',
                        definition_short: 'define me',
                    },
                });

                // Change the form to another object
                return changeFormItem(testEvents[1]);
            }, done.fail)
            .then(() => {
                expect(onSave.callCount).toBe(3);
                expect(onLoad.callCount).toBe(2);
                expect(onLoad.args[0]).toEqual([formName, testEvents[0]._id]);

                reloadInputs();
                inputs.slugline.change('New Slugline 2');

                // Wait for <Autosave>.save (lodash.throttle) to trigger
                return waitFor(() => onSave.callCount > 3);
            }, done.fail)
            .then(() => {
                expect(onSave.callCount).toBe(4);
                wrapper.update();

                expect(getAutosave()).toEqual({
                    e1: {
                        ...testEvents[0],
                        dates: {
                            ...testEvents[0].dates,
                            start: moment(testEvents[0].dates.start),
                            end: moment(testEvents[0].dates.end),
                        },
                        slugline: 'New Slugline 1',
                        definition_short: 'define me',
                    },
                    e2: {
                        ...testEvents[1],
                        dates: {
                            ...testEvents[1].dates,
                            start: moment(testEvents[1].dates.start),
                            end: moment(testEvents[1].dates.end),
                        },
                        slugline: 'New Slugline 2',
                    },
                });

                // Change the form to create a new object
                return changeFormItem({_id: 'tempId-123456', slugline: 'New Form Object'});
            }, done.fail)
            .then(() => {
                expect(onSave.callCount).toBe(5);

                inputs.slugline.change('Autosave new object');

                return waitFor(() => onSave.callCount > 5);
            }, done.fail)
            .then(() => {
                expect(onSave.callCount).toBe(6);
                expect(getAutosave()).toEqual({
                    e1: {
                        ...testEvents[0],
                        dates: {
                            ...testEvents[0].dates,
                            start: moment(testEvents[0].dates.start),
                            end: moment(testEvents[0].dates.end),
                        },
                        slugline: 'New Slugline 1',
                        definition_short: 'define me',
                    },
                    e2: {
                        ...testEvents[1],
                        dates: {
                            ...testEvents[1].dates,
                            start: moment(testEvents[1].dates.start),
                            end: moment(testEvents[1].dates.end),
                        },
                        slugline: 'New Slugline 2',
                    },
                    'tempId-123456': {
                        _id: 'tempId-123456',
                        slugline: 'Autosave new object',
                    },
                });

                // Change form back to the first event
                return changeFormItem(testEvents[0]);
            }, done.fail)
            .then(() => {
                expect(onSave.callCount).toBe(6);
                expect(onLoad.callCount).toBe(4);

                reloadInputs();
                expect(inputs.slugline.value()).toBe('New Slugline 1');
                expect(inputs.description.value()).toBe('define me');

                done();
            }, done.fail);
    });
});
