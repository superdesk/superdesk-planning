import React from 'react'
import { mount } from 'enzyme'
import { ConfirmationModalContainer } from '../index'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import * as actions from '../../actions'
import sinon from 'sinon'

describe('<ConfirmationModalContainer />', () => {
    it('open modal', () => {
        let store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <ConfirmationModalContainer />
            </Provider>
        )
        const actionSpy = sinon.spy()
        expect(wrapper.find('ConfirmationModalComponent').props().show).toBe(false)
        store.dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: 'random string',
                action: actionSpy,
            },
        }))
        expect(wrapper.find('ConfirmationModalComponent').props().show).toBe(true)
        wrapper.find('ConfirmationModalComponent').props().handleAction()
        expect(actionSpy.calledOnce).toBe(true)
    })
})
