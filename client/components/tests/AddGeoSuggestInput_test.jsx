import React from 'react'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import planningApp from '../../reducers'
import { render, mount } from 'enzyme'
import { AddGeoSuggestInput } from '../index'
//import sinon from 'sinon'

describe('<AddGeoSuggestInput />', () => {
    it('parses the initialValue', () => {
        let store = createStore(planningApp, {})
        let initialLocation = { qcode: 'test_qcode', name: 'test_name' }
        const wrapper = mount(
            <Provider store={store}>
                <AddGeoSuggestInput
                    initialValue={initialLocation} />
            </Provider>
        )
        expect(wrapper.find(AddGeoSuggestInput).props().initialValue).toBe(initialLocation)
    })
    it('sets GeoSuggest initialValue to initialValue.name', () => {
        let store = createStore(planningApp, {})
        let initialLocation = { qcode: 'test_qcode', name: 'test_name' }
        const wrapper = render(
            <Provider store={store}>
                <AddGeoSuggestInput
                    initialValue={initialLocation} />
            </Provider>
        )
        console.log('COMPONENT: ', wrapper.find(AddGeoSuggestInput).debug())
        // Not sure how to target the html input that should be rendered when
        // Geosuggest is rendered here:
        expect(wrapper.find(AddGeoSuggestInput).props().value).toBe(initialLocation.name)
    })
})
