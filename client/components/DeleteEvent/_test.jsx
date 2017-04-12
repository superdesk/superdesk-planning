import React from 'react'
import { DeleteEvent } from './index'
import * as actions from '../../actions'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'

const event = {
    _id: '5800d71930627218866f1e80',
    dates: {
        start: '2016-10-15T14:30+0000',
        end: '2016-10-20T15:00+0000',
    },
    definition_short: 'definition_short 1',
    location: [{ name: 'location1' }],
    name: 'name1',
    files: [{
        media: {
            name: 'file.pdf',
            length: 1000,
        },
        filemeta: { media_id: 'media1' },
    }],
    links: ['http://www.google.com'],
    _plannings: [{
        _id: '0',
        slugline: 'slug',
        original_creator: { 'display_name': 'ABC' },
    }],
}

describe('<DeleteEvent />', () => {
    it('delete the event', () => {
        const getState = () => ({ events: { events: {} } })
        const dispatch = sinon.spy(() => (Promise.resolve()))
        const api = () => ({
            remove: sinon.spy((item) => {
                expect(item._id).toBe('5800d71930627218866f1e80')
                return Promise.resolve()
            }),
        })
        const action = actions.deleteEvent(event)
        action(dispatch, getState, { api })
    })
    it('shows related plannings of an event while delete', () => {
        let store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <DeleteEvent eventDetail={event}
                    handlePlanningClick={()=>{}} />
            </Provider>
        )

        const relPlanningNode = wrapper.find('.related-plannings').childAt(0).childAt(1)
        expect(relPlanningNode.text()).toBe('slug created by ABC in  agenda')
    })
})
