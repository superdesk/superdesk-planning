import React from 'react'
import { mount } from 'enzyme'
import { AdvancedSearchPanelContainer } from '../index'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'

describe('<AdvancedSearchPanelContainer />', () => {

    it('clicks on the close link', () => {
        const store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <AdvancedSearchPanelContainer />
            </Provider>
        )
        wrapper.find('a').simulate('click')
    })
})
