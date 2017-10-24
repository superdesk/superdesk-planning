import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { getTestActionStore } from '../../utils/testUtils'
import { AuthoringMenu } from './index'

describe('<AuthoringMenu />', () => {
    let store
    let services

    const getWrapper = (store) => {
        return mount(<Provider store={store}>
            <AuthoringMenu store={store}/>
        </Provider>)
    }

    beforeEach(() => {
        store = getTestActionStore()
        services = store.services
    })

    it('Click on the ful fill menu', (done) => {
        store.initialState.item = { _id: 'item1' }
        const wrapper = getWrapper(store)
        const fulFilBtn = wrapper.find('#fulfil-assignment')
        expect(fulFilBtn.length).toBe(1)
        fulFilBtn.first().simulate('click')
        expect(services.superdesk.intent.callCount).toBe(1)
        expect(services.superdesk.intent.args[0][0]).toBe('planning')
        expect(services.superdesk.intent.args[0][1]).toBe('fulfil')
        expect(services.superdesk.intent.args[0][2]).toEqual({ item: { _id: 'item1' } })
        done()
    })

    it('Click on the add to planning menu', (done) => {
        store.initialState.item = { _id: 'item1' }
        const wrapper = getWrapper(store)
        const addToBtn = wrapper.find('#addto-planning')
        expect(addToBtn.length).toBe(1)
        addToBtn.first().simulate('click')
        expect(services.superdesk.intent.callCount).toBe(1)
        expect(services.superdesk.intent.args[0][0]).toBe('planning')
        expect(services.superdesk.intent.args[0][1]).toBe('addto')
        expect(services.superdesk.intent.args[0][2]).toEqual({ item: { _id: 'item1' } })
        done()
    })
})