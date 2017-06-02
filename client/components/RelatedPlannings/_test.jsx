import React from 'react'
import { mount } from 'enzyme'
import { RelatedPlannings } from '../RelatedPlannings'
import * as selectors from '../../selectors'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'

describe('<RelatedPlannings />', () => {
    it('fetches agenda for the planning item from store', () => {
        const initialState = {
            planning: {
                plannings: {
                    '3': {
                        _id: '3',
                        slugline: 'planning 3',
                        original_creator: { 'display_name': 'ABC' },
                    },
                },
            },
            agenda: {
                agendas: [
                    {
                        _id: '1',
                        name: 'agenda1',
                    },
                    {
                        _id: '2',
                        name: 'agenda2',
                        planning_items: ['3'],
                    },
                ],
                currentAgendaId: '1',
            },
        }
        const store = createTestStore({ initialState: initialState })
        const plannings = [selectors.getStoredPlannings(store.getState())['3']]
        const wrapper = mount(
            <Provider store={store}>
                <RelatedPlannings plannings={plannings}
                    openPlanning={true} />
            </Provider>
        )

        const relPlanningNode = wrapper.find('.related-plannings').childAt(0).childAt(1)
        expect(relPlanningNode.text()).toBe('planning 3 created by ABC in agenda2 agenda')
    })
})
