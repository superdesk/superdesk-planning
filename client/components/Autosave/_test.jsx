import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import {Provider} from 'react-redux';
import {Autosave} from './index';
import {createTestStore} from '../../utils';
import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';
import {autosave} from '../../actions';
import {reduxForm, Field, initialize} from 'redux-form';
import * as helpers from '../tests/helpers';

describe('<Autosave />', () => {
    let formName;
    let autosaveData;
    let astore;
    let services;
    let data;
    let store;

    const TestFormComponent = () => (
        <form>
            <Autosave formName={formName} interval={1000}/>
            <Field
                name="name"
                component="input"
                type="text"
                readOnly={false}
            />
            <Field
                name="slugline"
                component="input"
                type="text"
                readOnly={false}
            />
        </form>
    );

    const getWrapper = (values = {}) => {
        const TestForm = reduxForm({form: formName})(TestFormComponent);

        return mount(
            <Provider store={store}>
                <TestForm
                    initialValues={values}
                />
            </Provider>
        );
    };

    beforeEach(() => {
        astore = getTestActionStore();
        services = astore.services;
        data = astore.data;

        formName = 'testForm';
        autosaveData = {};

        sinon.spy(autosave, 'load');
        sinon.spy(autosave, 'save');
    });

    afterEach(() => {
        restoreSinonStub(autosave.load);
        restoreSinonStub(autosave.save);
    });

    const initStore = () => {
        astore.init();
        astore.initialState.autosave[formName] = autosaveData;
        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {
                api: services.api,
                notify: services.notify,
            },
        });
    };

    const getAutosave = () => store.getState().autosave[formName];

    it('doesnt load from autosave if a new object is provided', () => {
        initStore();
        getWrapper({slugline: 'new slugline'});
        expect(autosave.load.callCount).toBe(0);
        expect(getAutosave()).toEqual({});
    });

    it('loads the autosave on mount', () => {
        autosaveData = {e1: {slugline: 'New Slugline'}};
        initStore();

        expect(getAutosave()).toEqual({e1: {slugline: 'New Slugline'}});

        const wrapper = getWrapper(data.events[0]);
        const form = new helpers.form(wrapper);

        expect(autosave.load.callCount).toBe(1);
        expect(autosave.load.args[0]).toEqual([formName, data.events[0]._id]);

        expect(form.getValue('slugline')).toBe('New Slugline');
    });

    it('changes to values get stored in redux', () => {
        initStore();

        const wrapper = getWrapper(data.events[0]);
        const form = new helpers.form(wrapper);

        expect(autosave.save.callCount).toBe(0);

        form.setValue('slugline', 'New Slugline');
        expect(autosave.save.callCount).toBe(1);

        expect(store.getState().autosave[formName].e1).toEqual({
            _id: 'e1',
            slugline: 'New Slugline',
        });
    });

    it('throttles autosaving the data', (done) => {
        initStore();

        const wrapper = getWrapper(data.events[0]);
        const form = new helpers.form(wrapper);
        const slugline = form.field('slugline');

        expect(autosave.save.callCount).toBe(0);

        for (let i = 0; i < 100; i++) {
            slugline.setValue(`Slug ${i}`);
        }

        expect(autosave.save.callCount).toBe(1);
        setTimeout(() => {
            expect(autosave.save.callCount).toBe(2);
            done();
        }, 1500);
    });

    it('switching form objects', () => {
        initStore();

        const wrapper = getWrapper(data.events[0]);
        const form = new helpers.form(wrapper);
        const slugline = form.field('slugline');

        expect(autosave.load.callCount).toBe(1);
        expect(autosave.load.args[0]).toEqual([formName, data.events[0]._id]);

        slugline.setValue('New Slugline 1');
        expect(autosave.save.callCount).toBe(1);
        expect(getAutosave()).toEqual({
            e1: {
                _id: 'e1',
                slugline: 'New Slugline 1',
            },
        });

        store.dispatch(initialize(formName, data.events[1]));

        expect(autosave.load.callCount).toBe(2);
        expect(autosave.load.args[1]).toEqual([formName, data.events[1]._id]);

        slugline.setValue('New Slugline 2');
        expect(autosave.save.callCount).toBe(2);

        expect(getAutosave()).toEqual({
            e1: {
                _id: 'e1',
                slugline: 'New Slugline 1',
            },
            e2: {
                _id: 'e2',
                slugline: 'New Slugline 2',
            },
        });

        store.dispatch(initialize(formName, {slugline: 'New Form Object'}));

        slugline.setValue('Wont Save Autosave');
        expect(autosave.save.callCount).toBe(2);

        expect(getAutosave()).toEqual({
            e1: {
                _id: 'e1',
                slugline: 'New Slugline 1',
            },
            e2: {
                _id: 'e2',
                slugline: 'New Slugline 2',
            },
        });
    });
});
