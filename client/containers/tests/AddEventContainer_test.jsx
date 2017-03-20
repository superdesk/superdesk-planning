import React from 'react'
import { mount } from 'enzyme'
import { AddEventContainer, AddEvent } from '../AddEventContainer'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import * as actions from '../../actions'

describe('Modal', () => {
    it('open the modal', () => {
        let store = createTestStore()
        const wrapper = mount(<Provider store={store}><AddEventContainer /></Provider>)
        expect(wrapper.find(AddEvent).props().show).toBe(false)
        store.dispatch(actions.showModal({ modalType: 'EDIT_EVENT', modalProps: { event: {} } }))
        expect(wrapper.find(AddEvent).props().show).toBe(true)
    })
})
