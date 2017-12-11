import React from 'react';
import {mount} from 'enzyme';
import {RelatedPlannings} from '../RelatedPlannings';
import * as selectors from '../../selectors';
import {createTestStore} from '../../utils';
import {Provider} from 'react-redux';

describe('<RelatedPlannings />', () => {
    it('fetches agenda for the planning item from store', () => {
        const initialState = {
            planning: {
                plannings: {
                    3: {
                        _id: '3',
                        slugline: 'planning 3',
                        original_creator: {display_name: 'ABC'},
                        agendas: ['1', '2'],
                        event_item: 'event1',
                    },
                },
            },
            agenda: {
                agendas: [
                    {
                        _id: '1',
                        name: 'agenda1',
                        is_enabled: true,
                    },
                    {
                        _id: '2',
                        name: 'agenda2',
                        is_enabled: true,
                    },
                ],
                currentAgendaId: '1',
            },
            events: {
                events: {
                    event1: {
                        _id: 'event1',
                        dates: {
                            start: '2016-10-15T14:30+0000',
                            end: '2016-10-20T15:00+0000',
                        },
                        definition_short: 'definition_short 1',
                        location: [{name: 'location1'}],
                        name: 'name1',
                    },
                },
                showEventDetails: 'event1',
            },
        };


        const store = createTestStore({initialState: initialState});
        const eventDetail = selectors.getEventToBeDetailed(store.getState());

        const wrapper = mount(
            <Provider store={store}>
                <RelatedPlannings plannings={eventDetail._plannings}
                    openPlanning={true} />
            </Provider>
        );

        const relPlanningNode = wrapper.find('.simple-list').childAt(0);

        expect(relPlanningNode.text()).toBe(' planning 3 created by ABC in agenda agenda1, agenda2');
    });
});
