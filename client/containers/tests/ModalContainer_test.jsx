import React from 'react'
import { mount } from 'enzyme'
import { ModalsContainer } from '../ModalsContainer'
import { Provider } from 'react-redux'
import * as actions from '../../actions'
import { createTestStore } from '../../utils'

describe('<ModalsContainer />', () => {
    it('open a confirmation modal', () => {
        const store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <ModalsContainer />
            </Provider>
        )
        expect(wrapper.find('ConfirmationModal').length).toBe(0)
        store.dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                action: () => {},
                title: 'title',
                body: 'body',
            },
        }))
        expect(wrapper.find('ConfirmationModal').length).toBe(1)
    })
})
