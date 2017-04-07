import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import { ManageAgendasModalContainer } from './index'
import React from 'react'
import { Provider } from 'react-redux'

describe('<ManageAgendasModalContainer />', () => {
    it('list agendas', () => {
        const initialState = {
            planning: {
                agendas: [
                    {
                        name: 'agenda1',
                        _id: 'agenda1',
                    },
                    {
                        name: 'agenda2',
                        _id: 'agenda2',
                    },
                ],
            },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <ManageAgendasModalContainer />
            </Provider>
        )
        expect(wrapper.find('ManageAgendasModalComponent').props().agendas.length).toBe(2)
        wrapper.find('ManageAgendasModalComponent').props().selectAgenda('agenda2')
        expect(store.getState().planning.currentAgendaId).toBe('agenda2')
        wrapper.find('ManageAgendasModalComponent').props().openCreateAgenda()
        wrapper.find('ManageAgendasModalComponent').props().onAgendaDeletion()
    })
})
