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
                event1: {
                    _id: 'e1',
                    dates: {start: '2016-10-15T13:01:11+0000'},
                    definition_short: 'definition_short 1',
                    location: [{name: 'location1'}],
                    name: 'name1',
                    lock_action: 'edit',
                    lock_user: 'user123',
                    lock_session: 'session123',
                },
                event2: {
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
                planning1: {
                    _id: 'p1',
                    slugline: 'Planning1',
                    headline: 'Some Plan 1',
                    coverages: [],
                    agendas: [],
                    lock_action: 'edit',
                    lock_user: 'user123',
                    lock_session: 'session123',
                },
                planning2: {
                    _id: 'p2',
                    slugline: 'Planning2',
                    headline: 'Some Plan 2',
                    event_item: 'e1',
                    coverages: [],
                    agendas: ['agenda1'],
                    lock_action: 'edit',
                    lock_user: 'user123',
                    lock_session: 'session123',
                },
                planning3: {
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
    };
    const store = createTestStore({initialState});

    const wrapper = mount(
        <Provider store={store}>
            <WorkqueueContainer />
        </Provider>
    );

    it('displays WorkqueueList', () => {
        expect(wrapper).toBeDefined();
        expect(wrapper.find(WorkqueueContainer).length).toBe(1);
    });

    it('contains locked events and planning items for workqueue items', () => {
        expect(selectors.locks.getLockedEvents(store.getState()))
            .toEqual([store.getState().events.events['event1']]);
        expect(selectors.locks.getLockedPlannings(store.getState()).length).toBe(2);
    });
});
