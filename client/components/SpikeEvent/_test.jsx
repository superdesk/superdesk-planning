import React from 'react'
import { SpikeEvent } from './index'
import { mount } from 'enzyme'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'

describe('events', () => {
    describe('components', () => {

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

        describe('<SpikeEvent />', () => {
            it('shows related plannings of an event while spiking', () => {
                let store = createTestStore()
                const wrapper = mount(
                    <Provider store={store}>
                        <SpikeEvent eventDetail={event} />
                    </Provider>
                )

                const relPlanningNode = wrapper.find('.related-plannings').childAt(0).childAt(1)
                expect(relPlanningNode.text()).toBe('slug created by ABC in  agenda')
            })
        })
    })
})
