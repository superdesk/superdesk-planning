import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import {Provider} from 'react-redux';
import {SpikeEventForm, SpikeEventComponent} from '../forms/spikeEventForm';
import {EventUpdateMethodField} from '../../fields';
import {RelatedEvents} from '../../RelatedEvents';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {createTestStore, eventUtils} from '../../../utils';
import eventsApi from '../../../actions/events/api';
import eventsUi from '../../../actions/events/ui';
import moment from 'moment';

xdescribe('<SpikeEventForm />', () => {
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
                name: 'Event 1',
                dates: {
                    start: moment('2099-10-15T13:01:11'),
                    end: moment('2099-10-15T14:01:11'),
                },
                recurrence_id: 'rec1',
            },
            {
                _id: 'e2',
                name: 'Event 2',
                dates: {
                    start: moment('2099-10-16T13:01:11'),
                    end: moment('2099-10-16T14:01:11'),
                },
                recurrence_id: 'rec1',
                pubstatus: 'usable',
            },
            {
                _id: 'e3',
                name: 'Event 3',
                slugline: 'Slug for Event 3',
                dates: {
                    start: moment('2099-10-17T13:01:11'),
                    end: moment('2099-10-17T14:01:11'),
                },
                recurrence_id: 'rec1',
            },
            {
                _id: 'e4',
                name: 'Event 4',
                dates: {
                    start: moment('2099-10-18T13:01:11'),
                    end: moment('2099-10-18T14:01:11'),
                },
                recurrence_id: 'rec1',
            },
            {
                _id: 'e5',
                name: 'Event 5',
                dates: {
                    start: moment('2099-10-19T13:01:11'),
                    end: moment('2099-10-19T14:01:11'),
                },
                recurrence_id: 'rec1',
                planning_ids: ['p1'],
            },
        ];

        data.plannings = [{
            _id: 'p1',
            slugline: 'Planning1',
            headline: 'Some Plan 1',
            agendas: [data.agendas[1]._id],
            coverages: [],
            event_item: 'e5',
            original_creator: {display_name: 'Hue Man'},
            _agendas: [data.agendas[1]],
        }];

        data.coverages = [];

        astore.init();

        // Clear the initial state to only have our first event
        astore.initialState.events.events = {e3: data.events[0]};
        astore.initialState.planning.plannings = {};

        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {api: services.api},
        });

        sinon.stub(eventsUi, 'spike').callsFake(() => (
            () => (Promise.resolve())
        ));
    });

    afterEach(() => {
        restoreSinonStub(eventsUi.spike);
    });

    it('renders and updates on update_method change', (done) => (
        store.dispatch(eventsApi.loadEventDataForAction(data.events[2], true))
            .then((eventDetail) => {
                const dateFormat = 'DD/MM/YYYY';
                const timeFormat = 'HH:mm';
                const wrapper = mount(
                    <SpikeEventComponent initialValues={eventDetail}
                        dateFormat={dateFormat}
                        timeFormat={timeFormat}
                    />
                );

                const updateMethod = wrapper.find(EventUpdateMethodField);

                const metaData = wrapper.find('p');
                // Slugline

                expect(metaData.at(0).text()).toBe('Slug for Event 3');

                // Name
                expect(metaData.at(1).text()).toBe('Event 3');

                // Date
                const dateString = eventUtils.getDateStringForEvent(data.events[2], dateFormat, timeFormat);

                expect(metaData.at(2).text()).toBe(dateString);

                // No. of related events
                expect(metaData.at(3).text()).toBe('1');

                // Spike method defaults to single event
                expect(updateMethod.props().label)
                    .toBe('Would you like to spike all recurring events or just this one?');
                expect(updateMethod.props().input.value).toEqual({
                    name: 'This event only',
                    value: 'single',
                });
                expect(wrapper.state('relatedEvents')).toEqual([]);

                // Update the spike method to 'future'
                updateMethod.find('SelectField select').simulate(
                    'change',
                    {target: {value: 'This and all future events'}}
                );
                const noOfEvents = wrapper.find('p').at(3);

                expect(noOfEvents.text()).toBe('2');
                expect(wrapper.state().relatedEvents).toEqual([
                    data.events[3],
                    data.events[4],
                ]);
                // Related Event warning for Events in use
                expect(wrapper.find(RelatedEvents).props().events).toEqual([
                    data.events[4],
                ]);

                // Update the spike method to 'all', and ensure number of plannings is updated
                updateMethod.find('SelectField select').simulate(
                    'change',
                    {target: {value: 'All events'}}
                );
                const noOfEvents2 = wrapper.find('p').at(3);

                expect(noOfEvents2.text()).toBe('3');
                expect(wrapper.state().relatedEvents).toEqual([
                    data.events[0],
                    data.events[1],
                    data.events[3],
                    data.events[4],
                ]);
                // Related Event warning for Events in use
                expect(wrapper.find(RelatedEvents).props().events).toEqual([
                    data.events[1],
                    data.events[4],
                ]);

                done();
            })
            .catch((error) => {
                expect(error).toBe(null);
                expect(error.stack).toBe(null);
                done();
            })
    ));

    it('calls spike action on submit', (done) => (
        store.dispatch(eventsApi.loadEventDataForAction(data.events[2], true))
            .then((eventDetail) => {
                const wrapper = mount(
                    <Provider store={store}>
                        <SpikeEventForm initialValues={eventDetail} />
                    </Provider>
                );

                wrapper.find('SpikeEventComponent').props()
                    .onSubmit(data.events[2]);
                expect(eventsUi.spike.callCount).toBe(1);

                done();
            })
            .catch((error) => {
                expect(error).toBe(null);
                expect(error.stack).toBe(null);
                done();
            })
    ));
});
