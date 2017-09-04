import React from 'react'
import { mount } from 'enzyme'
import { WorkqueueList } from '../../components'
import * as selectors from '../../selectors'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import sinon from 'sinon'

describe('<WorkqueueList />', () => {
    let props

    const initialState = {
        events: {
            events: {
                event1: {
                    _id: 'e1',
                    dates: { start: '2016-10-15T13:01:11+0000' },
                    slugline: 'e1 slugline',
                    location: [{ name: 'location1' }],
                    name: 'name1',
                    lock_action: 'edit',
                    lock_user: 'user123',
                    lock_session: 'session123',
                },
                event2: {
                    _id: 'e2',
                    dates: { start: '2016-10-15T13:01:11+0000' },
                    slugline: 'e2 slugline',
                    location: [{ name: 'location2' }],
                    name: 'name2',
                },
            },
            eventsInList: ['e1', 'e2'],
            search: { currentSearch: {} },
            readOnly: true,
        },
        planning: {
            plannings: {
                planning1:  {
                    _id: 'p1',
                    slugline: 'p1 slugline',
                    headline: 'Some Plan 1',
                    coverages: [],
                    agendas: [],
                    lock_action: 'edit',
                    lock_user: 'user123',
                },
                planning2: {
                    _id: 'p2',
                    slugline: 'p2 slugline',
                    headline: 'Some Plan 2',
                    event_item: 'e1',
                    coverages: [],
                    agendas: ['agenda1'],
                    lock_action: 'edit',
                    lock_user: 'user123',
                },
                planning3: {
                    _id: 'p3',
                    slugline: 'p3 slugline',
                    headline: 'Some Plan 3',
                    coverages: [],
                    agendas: [],
                },
            },
        },
        agenda: {
            agendas: [{
                _id: 'agenda1',
                name: 'agenda',
                is_enabled: true,
            }],
            currentAgendaId: 'agenda1',
        },
        privileges: {
            planning: 1,
            planning_event_management: 1,
            planning_planning_management: 1,
        },
        users: [{ _id: 'user123' }],
        session: {
            identity: { _id: 'user123' },
            sessionId: 'session123',
        },
    }

    const store = createTestStore({ initialState })

    const getMountedWrapper = (props) => (
        mount(
            <Provider store={store}>
                <WorkqueueList {...props} />
            </Provider>
        )
    )

    beforeEach(() => {
        const spyAndResolve = sinon.spy(() => (Promise.resolve()))

        props = {
            workqueueItems:
            {
                'Plannings': selectors.getLockedPlannings(store.getState()),
                'Events': selectors.getLockedEvents(store.getState()),
            },
            closePlanningItem: spyAndResolve,
            openPlanningClick: spyAndResolve,
            openEventDetails: spyAndResolve,
            closeEventDetails: spyAndResolve,
            toggleEventsList: spyAndResolve,
        }
    })

    it('renders workqueue list', () => {
        expect(props).toBeDefined()
        let wrapper = getMountedWrapper(props)

        expect(props.workqueueItems['Events'].length).toBe(1)
        expect(props.workqueueItems['Plannings'].length).toBe(2)
        expect(wrapper.find('.list').length).toBe(1)

        // Can display locked events and planning items
        expect(wrapper.find('.title').length).toBe(3)
        expect(wrapper.find('.title').first().text()).toBe('e1 slugline')
        expect(wrapper.find('.title').at(1).text()).toBe('Some Plan 1')
        expect(wrapper.find('.title').at(2).text()).toBe('Some Plan 2')
    })

    it('show event / planning item as active when currently opened', () => {
        // Test Event.
        expect(props).toBeDefined()
        let wrapper = getMountedWrapper(props)

        expect(props.workqueueItems['Events'].length).toBe(1)
        expect(wrapper.find('li').first().hasClass('active')).toBe(false)

        // consider event is currently opened
        props.currentEvent = 'e1'
        wrapper = getMountedWrapper(props)
        expect(wrapper.find('li').first().hasClass('active')).toBe(true)

        // Test Planning.
        expect(props.workqueueItems['Plannings'].length).toBe(2)
        expect(wrapper.find('li').at(1).hasClass('active')).toBe(false)

        // consider planning is currently opened
        props.currentPlanningId = 'p1'
        wrapper = getMountedWrapper(props)
        expect(wrapper.find('li').at(1).hasClass('active')).toBe(true)
    })

})
