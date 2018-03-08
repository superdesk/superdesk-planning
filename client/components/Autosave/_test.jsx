import React from 'react';
import PropTypes from 'prop-types';
import {Provider} from 'react-redux';

import {mount} from 'enzyme';
import sinon from 'sinon';
import {set, cloneDeep} from 'lodash';

import {Autosave} from './index';
import {TextInput} from '../UI/Form';

import {createTestStore} from '../../utils';
import {getTestActionStore, restoreSinonStub, waitFor} from '../../utils/testUtils';
import {autosave} from '../../actions';
import * as helpers from '../tests/helpers/ui/form';

const TestForm = ({onChange, formData, formName}) => (
    <div>
        <Autosave
            formName={formName}
            initialValues={cloneDeep(formData.initial)}
            currentValues={cloneDeep(formData.current)}
            change={onChange}
            interval={250}
        />
        <TextInput
            label="Name"
            field="name"
            value={formData.current.name}
            onChange={onChange}
        />
        <TextInput
            label="Slugline"
            field="slugline"
            value={formData.current.slugline}
            onChange={onChange}
        />
        <TextInput
            label="Description"
            field="definition_short"
            value={formData.current.definition_short}
            onChange={onChange}
        />
    </div>
);

TestForm.propTypes = {
    onChange: PropTypes.func,
    formName: PropTypes.string,
    formData: PropTypes.object,
};

xdescribe('<Autosave />', () => {
    let formName;
    let formData;
    let onChange;
    let autosaveData;

    let astore;
    let store;
    let services;
    let data;

    let wrapper;
    let inputs;

    beforeEach(() => {
        formName = 'testForm';
        formData = {
            initial: {},
            current: {}
        };
        autosaveData = {};

        onChange = sinon.spy((field, value) => set(formData.current, field, value));

        astore = getTestActionStore();
        services = astore.services;
        data = astore.data;

        sinon.spy(autosave, 'load');
        sinon.spy(autosave, 'save');
    });

    afterEach(() => {
        restoreSinonStub(autosave.load);
        restoreSinonStub(autosave.save);
    });

    const initStore = () => {
        astore.init();
        astore.initialState.forms.autosaves[formName] = autosaveData;
        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {
                api: services.api,
                notify: services.notify,
            }
        });
    };

    const setWrapper = (values) => {
        formData = {
            initial: cloneDeep(values),
            current: cloneDeep(values)
        };

        wrapper = mount(
            <Provider store={store}>
                <TestForm
                    onChange={onChange}
                    formName={formName}
                    formData={formData}
                />
            </Provider>
        );

        inputs = {
            name: new helpers.Input(wrapper, 'name'),
            slugline: new helpers.Input(wrapper, 'slugline'),
            description: new helpers.Input(wrapper, 'definition_short'),
        };
    };

    const getAutosave = () => store.getState().forms.autosaves[formName];

    it('doesnt load from autosave if a new object is provided', () => {
        initStore();
        setWrapper({slugline: 'new slugline'});
        expect(autosave.load.callCount).toBe(0);
        expect(getAutosave()).toEqual({});
    });

    it('loads the autosave on mount', () => {
        autosaveData = {e1: {slugline: 'New Slugline'}};
        initStore();

        expect(getAutosave()).toEqual({e1: {slugline: 'New Slugline'}});

        setWrapper(data.events[0]);
        wrapper.update();

        expect(autosave.load.callCount).toBe(1);
        expect(autosave.load.args[0]).toEqual([formName, data.events[0]._id]);
        expect(inputs.slugline.value()).toBe('New Slugline');
    });

    it('changes to values get stored in redux', (done) => {
        initStore();
        setWrapper(data.events[0]);

        expect(autosave.save.callCount).toBe(0);

        inputs.slugline.change('New Slugline');

        // Wait for <Autosave>.save (lodash.throttle) to trigger
        waitFor(() => autosave.save.callCount > 0)
            .then(() => {
                expect(autosave.save.callCount).toBe(1);
                expect(getAutosave().e1).toEqual({
                    _id: 'e1',
                    slugline: 'New Slugline',
                });

                done();
            });
    });

    it('throttles autosaving the data', (done) => {
        initStore();
        setWrapper(data.events[0]);

        for (let i = 0; i < 100; i++) {
            inputs.slugline.change(`Slug ${i}`);
        }

        // Because of throttling, we haven't actually saved the data yet
        expect(autosave.save.callCount).toBe(0);

        // Wait for <Autosave>.save (lodash.throttle) to trigger
        waitFor(() => autosave.save.callCount > 0)
            .then(() => {
                expect(autosave.save.callCount).toBe(1);
                done();
            });
    });

    it('switching form objects', (done) => {
        initStore();
        setWrapper(data.events[0]);

        expect(autosave.load.callCount).toBe(1);
        expect(autosave.load.args[0]).toEqual([formName, data.events[0]._id]);

        inputs.slugline.change('New Slugline 1');
        inputs.description.change('define me');

        // Wait for <Autosave>.save (lodash.throttle) to trigger
        waitFor(() => autosave.save.callCount > 0)
            .then(() => {
                expect(autosave.save.callCount).toBe(1);
                expect(getAutosave()).toEqual({
                    e1: {
                        _id: 'e1',
                        slugline: 'New Slugline 1',
                        definition_short: 'define me',
                    },
                });

                // Change the form to another object
                formData.initial = cloneDeep(data.events[1]);
                formData.current = cloneDeep(data.events[1]);
                wrapper.update();

                expect(autosave.load.callCount).toBe(2);
                expect(autosave.load.args[1]).toEqual([formName, data.events[1]._id]);

                inputs.slugline.change('New Slugline 2');

                // Wait for <Autosave>.save (lodash.throttle) to trigger
                return waitFor(() => autosave.save.callCount > 1);
            })
            .then(() => {
                expect(autosave.save.callCount).toBe(2);
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
                formData.initial = {slugline: 'New Form Object'};
                formData.current = {slugline: 'New Form Object'};
                wrapper.update();

                inputs.slugline.change('Wont Save Autosave');
                return waitFor(() => autosave.save.callCount > 2, 250, 2);
            })
            .then(null, (msg) => {
                expect(msg).toBe('waitFor: Maximum retries exceeded');
                expect(autosave.save.callCount).toBe(2);

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

                // Change the form back to the first event
                formData.initial = cloneDeep(data.events[0]);
                formData.current = cloneDeep(data.events[0]);
                wrapper.update();

                expect(autosave.load.callCount).toBe(3);
                wrapper.update();

                expect(inputs.slugline.value()).toBe('New Slugline 1');
                expect(inputs.description.value()).toBe('define me');
                done();
            });
    });
});
