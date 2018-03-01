import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import {UpdateRecurringEventsForm, UpdateRecurringEvents} from '../forms/updateRecurringEventsForm';
import {EventUpdateMethodField} from '../../fields';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {createTestStore} from '../../../utils';
import * as actions from '../../../actions';
import sinon from 'sinon';

xdescribe('<UpdateRecurringEventsForm />', () => {
    let store;
    let astore;
    let services;
    let data;

    beforeEach(() => {
        astore = getTestActionStore();
        services = astore.services;
        data = astore.data;

        data.events = [
            {
                _id: 'e1',
                slugline: 'Recurring Event',
                name: 'Event 1',
                dates: {
                    start: '2099-10-15T13:01:11',
                    end: '2099-10-15T14:01:11',
                },
                recurrence_id: 'rec1',
            },
            {
                _id: 'e2',
                slugline: 'Recurring Event',
                name: 'Event 2',
                dates: {
                    start: '2099-10-16T13:01:11',
                    end: '2099-10-16T14:01:11',
                },
                recurrence_id: 'rec1',
            },
            {
                _id: 'e3',
                slugline: 'Recurring Event',
                name: 'Event 3',
                dates: {
                    start: '2099-10-17T13:01:11',
                    end: '2099-10-17T14:01:11',
                },
                recurrence_id: 'rec1',
            },
        ];

        astore.init();

        // Clear the initial state to only have our first event
        // astore.initialState.events.events = { e1: data.events[0] }

        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {api: services.api},
        });

        sinon.stub(actions.events.ui, 'saveAndPublish').returns({type: 'Test'});
    });

    afterEach(() => {
        restoreSinonStub(actions.events.ui.saveAndPublish);
    });

    // Excluding this as this will change during refactoring
    xit('renders event metadata', () => {
        const wrapper = mount(
            <Provider store={store}>
                <UpdateRecurringEventsForm
                    initialValues={{
                        ...data.events[1],
                        _recurring: data.events,
                        _events: [],
                        _originalEvent: data.events[1],
                    }}
                />
            </Provider>
        );

        const form = wrapper.find(UpdateRecurringEvents);
        const metaData = wrapper.find('.metadata-view');
        const updateMethod = form.find(EventUpdateMethodField);

        expect(metaData.find('dt').length).toBe(5);
        expect(metaData.find('dd').length).toBe(5);

        expect(metaData.find('dt').at(0)
            .text()).toBe('Slugline:');
        expect(metaData.find('dd').at(0)
            .text()).toBe('Recurring Event');

        expect(metaData.find('dt').at(1)
            .text()).toBe('Name:');
        expect(metaData.find('dd').at(1)
            .text()).toBe('Event 2');

        expect(metaData.find('dt').at(2)
            .text()).toBe('Starts:');
        expect(metaData.find('dd').at(2)
            .text()).toBe('October 16th 2099, 1:01:11 pm');

        expect(metaData.find('dt').at(3)
            .text()).toBe('Ends:');
        expect(metaData.find('dd').at(3)
            .text()).toBe('October 16th 2099, 2:01:11 pm');

        expect(metaData.find('dt').at(4)
            .text()).toBe('Events:');
        expect(metaData.find('dd').at(4)
            .text()).toBe('1');

        // Spike method defaults to single event
        expect(updateMethod.props().label)
            .toBe('Update all recurring events or just this one?');
        expect(updateMethod.props().input.value).toEqual({
            name: 'This event only',
            value: 'single',
        });

        // Update the spike method to 'future', and ensure number of plannings is updated
        updateMethod.find('SelectField select').simulate(
            'change',
            {target: {value: 'This and all future events'}}
        );

        expect(metaData.find('dd').at(4)
            .text()).toBe('2');

        // Update the spike method to 'all', and ensure number of plannings is updated
        updateMethod.find('SelectField select').simulate(
            'change',
            {target: {value: 'All events'}}
        );
        expect(metaData.find('dd').at(4)
            .text()).toBe('3');
    });

    // Excluding this as this will change during refactoring
    xit('calls `events.ui.saveAndPublish` on submit', () => {
        const wrapper = mount(
            <Provider store={store}>
                <UpdateRecurringEventsForm
                    initialValues={{
                        ...data.events[1],
                        _recurring: data.events,
                        _events: [],
                        _originalEvent: data.events[1],
                        _save: true,
                        _publish: false,
                    }}
                />
            </Provider>
        );
        const form = wrapper.find(UpdateRecurringEvents);

        form.find('form').simulate('submit');

        expect(actions.events.ui.saveAndPublish.callCount).toBe(1);
        expect(actions.events.ui.saveAndPublish.args[0]).toEqual([
            {
                ...data.events[1],
                _recurring: data.events,
                _events: [],
                _originalEvent: data.events[1],
                _save: true,
                _publish: false,
                update_method: Object({
                    name: 'This event only',
                    value: 'single',
                }),
            },
            true,
            false,
        ]);
    });
});
