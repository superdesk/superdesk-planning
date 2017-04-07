import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import { EventsListContainer } from './index'
import React from 'react'
import { Provider } from 'react-redux'

describe('<EventsListContainer />', () => {
    it('clicks on the buttons', () => {
        const store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <EventsListContainer />
            </Provider>
        )
        wrapper.find('.advanced-search-open').simulate('click')
        wrapper.find('.advanced-search-open').simulate('click')
        wrapper.find('[title="Hide the list"] button').simulate('click')
    })
})
