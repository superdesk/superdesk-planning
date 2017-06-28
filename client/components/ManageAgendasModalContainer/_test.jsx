import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import { ManageAgendasModalContainer } from './index'
import React from 'react'
import { Provider } from 'react-redux'

describe('agenda', () => {
    describe('containers', () => {
        describe('<ManageAgendasModalContainer />', () => {
            it('list agendas', () => {
                const initialState = {
                    planning: {},
                    agenda: {
                        agendas: [
                            {
                                name: 'agenda1',
                                _id: 'agenda1',
                            },
                            {
                                name: 'agenda2',
                                _id: 'agenda2',
                                state: 'active',
                            },
                            {
                                name: 'agenda3',
                                _id: 'agenda3',
                                state: 'spiked',
                            },
                        ],
                    },
                }

                const privileges = {
                    loaded: Promise.resolve(),
                    privileges: {
                        planning: 1,
                        planning_agenda_management: 1,
                    },
                }

                const store = createTestStore({
                    initialState,
                    extraArguments: { privileges },
                })
                const wrapper = mount(
                    <Provider store={store}>
                        <ManageAgendasModalContainer />
                    </Provider>
                )
                expect(wrapper.find('ManageAgendasModalComponent').props().activeAgendas.length).toBe(2)
                expect(wrapper.find('ManageAgendasModalComponent').props().spikedAgendas.length).toBe(1)
                wrapper.find('ManageAgendasModalComponent').props().selectAgenda('agenda2')
                expect(store.getState().agenda.currentAgendaId).toBe('agenda2')
                wrapper.find('ManageAgendasModalComponent').props().openCreateAgenda()
                wrapper.find('ManageAgendasModalComponent').props().openEditAgenda()
                wrapper.find('ManageAgendasModalComponent').props().onAgendaSpiked()
            })
        })
    })
})
