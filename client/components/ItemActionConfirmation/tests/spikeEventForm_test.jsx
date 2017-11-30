import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import {Provider} from 'react-redux';
import {SpikeEventForm, SpikeEvent} from '../forms/spikeEventForm';
import {EventUpdateMethodField} from '../../fields';
import {RelatedEvents} from '../../RelatedEvents';
import {getTestActionStore, restoreSinonStub} from '../../../utils/testUtils';
import {createTestStore} from '../../../utils';
import eventsApi from '../../../actions/events/api';
import eventsUi from '../../../actions/events/ui';
import moment from 'moment';

describe('<SpikeEventForm />', () => {
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
                const wrapper = mount(
                    <Provider store={store}>
                        <SpikeEventForm
                            initialValues={eventDetail}
                        />
                    </Provider>
                );

                const form = wrapper.find(SpikeEvent);
                const metaData = wrapper.find('.metadata-view');
                const updateMethod = form.find(EventUpdateMethodField);
                // const relatedEvents = wrapper.find(RelatedEvents)

                // Check name on the form
                expect(wrapper.find('strong').first()
                    .text()).toBe('Event 3');

                // Ensure the metadata section renders correctly
                expect(metaData.find('dd').length).toBe(3);
                expect(metaData.find('dt').length).toBe(3);

                expect(metaData.find('dt').at(0)
                    .text()).toBe('Starts:');
                expect(metaData.find('dd').at(0)
                    .text()).toBe('October 17th 2099, 1:01:11 pm');

                expect(metaData.find('dt').at(1)
                    .text()).toBe('Ends:');
                expect(metaData.find('dd').at(1)
                    .text()).toBe('October 17th 2099, 2:01:11 pm');

                expect(metaData.find('dt').at(2)
                    .text()).toBe('Events:');
                expect(metaData.find('dd').at(2)
                    .text()).toBe('1');

                // Spike method defaults to single event
                expect(updateMethod.props().label)
                    .toBe('Would you like to spike all recurring events or just this one?');
                expect(updateMethod.props().input.value).toEqual({
                    name: 'This event only',
                    value: 'single',
                });
                expect(form.props().relatedEvents).toEqual([]);

                // Update the spike method to 'future'
                updateMethod.find('SelectField select').simulate(
                    'change',
                    {target: {value: 'This and all future events'}}
                );
                expect(metaData.find('dd').at(2)
                    .text()).toBe('2');
                expect(form.props().relatedEvents).toEqual([
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
                expect(metaData.find('dd').at(2)
                    .text()).toBe('3');
                expect(form.props().relatedEvents).toEqual([
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

                form.find('form').simulate('submit');
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
