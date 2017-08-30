import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { Provider } from 'react-redux'
import { SpikeEventForm, SpikeEvent } from '../forms/spikeEventForm'
import { EventUpdateMethodField } from '../../fields'
import { RelatedPlanningsComponent } from '../../RelatedPlannings'
import { getTestActionStore, restoreSinonStub } from '../../../utils/testUtils'
import { createTestStore } from '../../../utils'
import eventsApi from '../../../actions/events/api'
import eventsUi from '../../../actions/events/ui'

describe('<SpikeEventForm />', () => {
    let store
    let astore
    let services
    let data

    beforeEach(() => {
        astore = getTestActionStore()
        services = astore.services
        data = astore.data

        data.events = [
            {
                _id: 'e1',
                name: 'Event 1',
                dates: {
                    start: '2099-10-15T13:01:11',
                    end: '2099-10-15T14:01:11',
                },
                recurrence_id: 'rec1',
            },
            {
                _id: 'e2',
                name: 'Event 2',
                dates: {
                    start: '2099-10-16T13:01:11',
                    end: '2099-10-16T14:01:11',
                },
                recurrence_id: 'rec1',
            },
            {
                _id: 'e3',
                name: 'Event 3',
                dates: {
                    start: '2099-10-17T13:01:11',
                    end: '2099-10-17T14:01:11',
                },
                recurrence_id: 'rec1',
            },
        ]

        data.plannings = [
            {
                _id: 'p1',
                slugline: 'Planning1',
                headline: 'Some Plan 1',
                agendas: [data.agendas[1]._id],
                coverages: [],
                event_item: 'e1',
                original_creator: { display_name: 'Hue Man' },
                _agendas: [data.agendas[1]],
            },
            {
                _id: 'p2',
                slugline: 'Planning2',
                headline: 'Some Plan 2',
                agendas: [],
                coverages: [],
                event_item: 'e2',
                original_creator: { display_name: 'Hue Man' },
                _agendas: [],
            },
            {
                _id: 'p3',
                slugline: 'Planning3',
                headline: 'Some Plan 3',
                agendas: [],
                coverages: [],
                event_item: 'e3',
                original_creator: { display_name: 'Hue Man' },
                _agendas: [],
            },
            {
                _id: 'p4',
                slugline: 'Planning4',
                headline: 'Some Plan 4',
                agendas: [],
                coverages: [],
                event_item: 'e3',
                original_creator: { display_name: 'Hue Man' },
                _agendas: [],
            },
        ]

        data.coverages = []

        astore.init()

        // Clear the initial state to only have our first event
        astore.initialState.events.events = { e1: data.events[0] }
        astore.initialState.planning.plannings = {}

        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: { api: services.api },
        })

        sinon.stub(eventsUi, 'spike').callsFake(() => (
            () => (Promise.resolve())
        ))
    })

    afterEach(() => {
        restoreSinonStub(eventsUi.spike)
    })

    it('renders and updates on update_method change', (done) => {
        return store.dispatch(eventsApi.loadRecurringEventsAndPlanningItems(data.events[1]))
        .then((eventDetail) => {
            const wrapper = mount(
                <Provider store={store}>
                    <SpikeEventForm
                        initialValues={eventDetail}
                    />
                </Provider>
            )

            const form = wrapper.find(SpikeEvent)
            const metaData = wrapper.find('.metadata-view')
            const updateMethod = form.find(EventUpdateMethodField)
            const relatedPlannings = form.find(RelatedPlanningsComponent)

            // Check name on the form
            expect(wrapper.find('strong').first().text()).toBe('Event 2')

            // Ensure the metadata section renders correctly
            expect(metaData.find('dd').length).toBe(4)
            expect(metaData.find('dt').length).toBe(4)

            expect(metaData.find('dt').at(0).text()).toBe('Starts:')
            expect(metaData.find('dd').at(0).text()).toBe('October 16th 2099, 1:01:11 pm')

            expect(metaData.find('dt').at(1).text()).toBe('Ends:')
            expect(metaData.find('dd').at(1).text()).toBe('October 16th 2099, 2:01:11 pm')

            expect(metaData.find('dt').at(2).text()).toBe('Events:')
            expect(metaData.find('dd').at(2).text()).toBe('3')

            expect(metaData.find('dt').at(3).text()).toBe('Plannings:')
            expect(metaData.find('dd').at(3).text()).toBe('1')

            // Spike method defaults to single event
            expect(updateMethod.props().label)
                .toBe('Would you like to spike all recurring events or just this one?')
            expect(updateMethod.props().input.value).toEqual({
                name: 'This event only',
                value: 'single',
            })

            // RelatedPlannings has only 1 planning item
            expect(relatedPlannings.props().plannings).toEqual([ data.plannings[1] ])
            updateMethod.find('SelectField select').simulate(
                'change',
                { target: { value: 'This and all future events' } }
            )

            expect(metaData.find('dd').at(3).text()).toBe('3')
            expect(relatedPlannings.props().plannings).toEqual([
                data.plannings[1],
                data.plannings[2],
                data.plannings[3],
            ])

            // Update the spike method to 'all', and ensure number of plannings is updated
            updateMethod.find('SelectField select').simulate(
                'change',
                { target: { value: 'All events' } }
            )
            expect(metaData.find('dd').at(3).text()).toBe('4')
            expect(relatedPlannings.props().plannings).toEqual([
                data.plannings[0],
                data.plannings[1],
                data.plannings[2],
                data.plannings[3],
            ])

            form.find('form').simulate('submit')
            expect(eventsUi.spike.callCount).toBe(1)

            done()
        })
        .catch((error) => {
            expect(error).toBe(null)
            expect(error.stack).toBe(null)
            done()
        })
    })
})
