import React from 'react'
import { mount, ReactWrapper } from 'enzyme'
import { ModalsContainer } from '../ModalsContainer'
import { SpikeAgendaConfirmationContainer } from '../index'
import { Provider } from 'react-redux'
import * as actions from '../../actions'
import { createTestStore } from '../../utils'

describe('<ModalsContainer />', () => {
    it('open a confirmation modal', () => {
        const agenda = {
            _id: 'agenda1',
            planning_items: ['planning1'],
        }
        const initialState = {
            planning: {
                plannings: {
                    planning1: {
                        _id: 'planning1',
                        original_creator: { display_name: 'display_name' },
                    },
                },
            },
            agenda: { agendas: [agenda] },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <ModalsContainer />
            </Provider>
        )
        expect(wrapper.find('ConfirmationModal').length).toBe(0)

        store.dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: <SpikeAgendaConfirmationContainer agenda={agenda}/>,
                action: () => store.dispatch(actions.spikeAgenda(agenda)),
            },
        }))
        expect(wrapper.find('ConfirmationModal').length).toBe(1)
        const dialog = wrapper.find('Portal')
        const modal = new ReactWrapper(<Provider store={store}>{dialog.node.props.children}</Provider>)
        expect(modal.text()).toContain('display_name')
        modal.find('.related-plannings a').simulate('click')
        modal.find('[type="submit"]').simulate('click')
    })
})
