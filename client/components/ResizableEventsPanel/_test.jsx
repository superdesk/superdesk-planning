import React from 'react'
import { ResizableEventsPanel } from '../index'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import { createTestStore } from '../../utils'

describe('<ResizableEventsPanel />', () => {

    it('sets resizable classes on init', () => {
        const initialState = {
            events: {
                events: {},
                search: {},
            },
            planning: { plannings: {} },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <ResizableEventsPanel className='this-element' minWidth={600}>
                    <div id='child-element'/>
                </ResizableEventsPanel>
            </Provider>
        )

        expect(wrapper.find('.this-element').first().hasClass('ui-resizable')).toBe(true)
    })
})
