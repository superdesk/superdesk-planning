import {createTestStore} from '../../utils';
import {mount} from 'enzyme';
import {WorkqueueContainer} from '../../components';
import React from 'react';
import {Provider} from 'react-redux';
import * as selectors from '../../selectors';

describe('<WorkqueueContainer />', () => {
    const initialState = {
        events: {
            events: {
                e1: {
                    _id: 'e1',
                    dates: {start: '2016-10-15T13:01:11+0000'},
                    definition_short: 'definition_short 1',
                    location: [{name: 'location1'}],
                    name: 'name1',
                    lock_action: 'edit',
                    lock_user: 'user123',
                    lock_session: 'session123',
                    lock_time: '2022-04-28T12:01:11+0000',
                },
                e2: {
                    _id: 'e2',
                    dates: {start: '2016-10-15T13:01:11+0000'},
                    definition_short: 'definition_short 2',
                    location: [{name: 'location2'}],
                    name: 'name2',
                },
            },
            eventsInList: ['e1', 'e2'],
            search: {currentSearch: {}},
            readOnly: true,
        },
        planning: {
            plannings: {
                p1: {
                    _id: 'p1',
                    slugline: 'Planning1',
                    headline: 'Some Plan 1',
                    coverages: [],
                    agendas: [],
                    lock_action: 'edit',
                    lock_user: 'user123',
                    lock_session: 'session123',
                    lock_time: '2022-04-28T10:01:11+0000',
                },
                p2: {
                    _id: 'p2',
                    slugline: 'Planning2',
                    headline: 'Some Plan 2',
                    related_events: [{
                        _id: 'e1',
                        link_type: 'primary',
                    }],
                    coverages: [],
                    agendas: ['agenda1'],
                    lock_action: 'edit',
                    lock_user: 'user123',
                    lock_session: 'session123',
                },
                p3: {
                    _id: 'p3',
                    slugline: 'Planning3',
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
        users: [{_id: 'user123'}],
        session: {
            identity: {_id: 'user123'},
            sessionId: 'session123',
        },
        locks: {
            event: {
                e1: {
                    item_id: 'e1',
                    item_type: 'event',
                    action: 'edit',
                    user: 'user123',
                    session: 'session123',
                    time: '2022-04-28T12:01:11+0000',
                },
            },
            planning: {
                p1: {
                    item_id: 'p1',
                    item_type: 'planning',
                    action: 'edit',
                    user: 'user123',
                    session: 'session123',
                    time: '2022-04-28T10:01:11+0000',
                },
            },
            recurring: {},
            assignment: {},
        },
    };
    const store = createTestStore({initialState});

    it('displays WorkqueueList', () => {
        const wrapper = mount(
            <Provider store={store}>
                <WorkqueueContainer />
            </Provider>
        );

        expect(wrapper).toBeDefined();
        expect(wrapper.find(WorkqueueContainer).length).toBe(1);
    });

    it('contains locked events and planning items for workqueue items', () => {
        const state = store.getState();
        const workqueueItems = selectors.locks.workqueueItems(state);

        expect(workqueueItems.length).toBe(2);
        expect(workqueueItems[0]).toEqual(state.planning.plannings.p1);
        expect(workqueueItems[1]).toEqual(state.events.events.e1);
    });
});
