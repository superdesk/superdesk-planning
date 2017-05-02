import React from 'react'
import { mount } from 'enzyme'
import { EventMetadata } from '../index'
import moment from 'moment'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'

describe('<EventMetadata />', () => {
    it('renders an event', () => {
        const event = {
            dates: { start: '2016-10-15T13:01:11+0000' },
            definition_short: 'definition_short 1',
            definition_long: 'definition_long 1',
            location: [{ name: 'location1' }],
            name: 'name1',
        }
        let store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <EventMetadata event={event}/>
            </Provider>
        )
        expect(wrapper.text()).toContain('definition_short 1')
        expect(wrapper.text()).toContain('definition_long 1')
        expect(wrapper.text()).toContain('name1')
        expect(wrapper.text()).toContain(moment('2016-10-15T13:01:11+0000').format('DD/MM/YYYY\u00a0HH:mm'))
        expect(wrapper.text()).toContain('location1')
        expect(wrapper.text()).not.toContain('Status')
    })
})
