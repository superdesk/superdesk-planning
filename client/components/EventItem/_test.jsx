import React from 'react'
import { shallow, mount } from 'enzyme'
import { EventItem } from './index'
import sinon from 'sinon'
import moment from 'moment'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'

describe('events', () => {
    describe('components', () => {
        describe('<EventItem />', () => {
            let onClick
            let onDoubleClick
            let event
            let onSpikeEvent
            let onUnspikeEvent
            let selectedEvent
            let privileges

            const getShallowWrapper = () => (
                shallow(<EventItem
                    onClick={onClick}
                    event={event}
                    onSpikeEvent={onSpikeEvent}
                    onUnspikeEvent={onUnspikeEvent}
                    selectedEvent={selectedEvent}
                    privileges={privileges}
                />)
            )

            const getMountedWrapper = () => {
                const store = createTestStore({})
                return mount(
                    <Provider store={store}>
                        <EventItem
                            onClick={onClick}
                            event={event}
                            onSpikeEvent={onSpikeEvent}
                            onUnspikeEvent={onUnspikeEvent}
                            selectedEvent={selectedEvent}
                            privileges={privileges} />
                    </Provider>
                )
            }

            const getWrapperWithDoubleClickProp = () => {
                const store = createTestStore({})
                return mount(
                    <Provider store={store}>
                        <EventItem
                            onClick={onClick}
                            onDoubleClick={onDoubleClick}
                            event={event}
                            onSpikeEvent={onSpikeEvent}
                            onUnspikeEvent={onUnspikeEvent}
                            selectedEvent={selectedEvent}
                            privileges={privileges} />
                    </Provider>
                )
            }

            beforeEach(() => {
                onClick = sinon.spy(() => (Promise.resolve()))
                onDoubleClick = sinon.spy(() => (Promise.resolve()))
                onSpikeEvent = sinon.spy(() => (Promise.resolve()))
                onUnspikeEvent = sinon.spy(() => (Promise.resolve()))
                event = {
                    name: 'Event 1',
                    dates: {
                        start: moment('2016-10-15T13:01:00+0000'),
                        end: moment('2016-10-15T14:01:00+0000'),
                    },
                }
                selectedEvent = null
                privileges = {
                    planning_event_management: 1,
                    planning_event_spike: 1,
                    planning_event_unspike: 1,
                }
            })

            it('shows `spike` button', () => {
                let wrapper

                privileges.planning_event_spike = 1
                event.state = 'active'
                wrapper = getShallowWrapper()
                expect(wrapper.find('.icon-trash').length).toBe(1)

                privileges.planning_event_spike = 0
                event.state = 'active'
                wrapper = getShallowWrapper()
                expect(wrapper.find('.icon-trash').length).toBe(0)

                privileges.planning_event_spike = 1
                event.state = 'spiked'
                wrapper = getShallowWrapper()
                expect(wrapper.find('.icon-trash').length).toBe(0)
            })

            it('shows `unspike` button', () => {
                let wrapper

                privileges.planning_event_unspike = 1
                event.state = 'spiked'
                wrapper = getShallowWrapper()
                expect(wrapper.find('.icon-unspike').length).toBe(1)

                privileges.planning_event_unspike = 0
                event.state = 'spiked'
                wrapper = getShallowWrapper()
                expect(wrapper.find('.icon-unspike').length).toBe(0)

                privileges.planning_event_unspike = 1
                event.state = 'active'
                wrapper = getShallowWrapper()
                expect(wrapper.find('.icon-unspike').length).toBe(0)
            })

            it('shows the `spiked` badge', () => {
                let wrapper

                event.state = 'active'
                wrapper = getShallowWrapper()
                expect(wrapper.find('.label--alert').length).toBe(0)

                event.state = 'spiked'
                wrapper = getShallowWrapper()
                expect(wrapper.find('.label--alert').length).toBe(1)
                expect(wrapper.find('.label--alert').first().text()).toBe('spiked')
            })

            it('executes `onClick` callback', () => {
                let wrapper = getMountedWrapper()
                const button = wrapper.find('.ListItem').first()
                button.simulate('click')
                expect(onClick.callCount).toBe(1)
                expect(onClick.args[0][0]).toEqual(event)
            })

            it('executes `onDoubleClick` callback', () => {
                let wrapper = getWrapperWithDoubleClickProp()
                const button = wrapper.find('.ListItem').first()
                button.simulate('click')
                button.simulate('click')
                expect(onDoubleClick.callCount).toBe(1)
                expect(onDoubleClick.args[0][0]).toEqual(event)
            })

            it('executes `onSpikedEvent` callback', () => {
                let wrapper = getMountedWrapper()
                const button = wrapper.find('.icon-trash').first().parent()
                button.simulate('click')
                expect(onSpikeEvent.callCount).toBe(1)
                expect(onSpikeEvent.args[0][0]).toEqual(event)
            })

            it('executes `onUnspikedEvent` callback', () => {
                event.state = 'spiked'
                let wrapper = getMountedWrapper()
                const button = wrapper.find('.icon-unspike').first().parent()
                button.simulate('click')
                expect(onUnspikeEvent.callCount).toBe(1)
                expect(onUnspikeEvent.args[0][0]).toEqual(event)
            })
        })
    })
})
