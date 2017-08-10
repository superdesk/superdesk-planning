import React from 'react'
import { mount } from 'enzyme'
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
            let onDuplicateEvent
            let highlightedEvent
            let privileges

            const getMountedWrapper = () => {
                const store = createTestStore({})
                return mount(
                    <Provider store={store}>
                        <EventItem
                            onClick={onClick}
                            event={event}
                            onSpikeEvent={onSpikeEvent}
                            onUnspikeEvent={onUnspikeEvent}
                            onDuplicateEvent={onDuplicateEvent}
                            highlightedEvent={highlightedEvent}
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
                            onDuplicateEvent={onDuplicateEvent}
                            highlightedEvent={highlightedEvent}
                            privileges={privileges} />
                    </Provider>
                )
            }

            beforeEach(() => {
                onClick = sinon.spy(() => (Promise.resolve()))
                onDoubleClick = sinon.spy(() => (Promise.resolve()))
                onSpikeEvent = sinon.spy(() => (Promise.resolve()))
                onUnspikeEvent = sinon.spy(() => (Promise.resolve()))
                onDuplicateEvent = sinon.spy(() => (Promise.resolve()))

                event = {
                    state: 'in_progress',
                    name: 'Event 1',
                    dates: {
                        start: moment('2016-10-15T13:01:00+0000'),
                        end: moment('2016-10-15T14:01:00+0000'),
                    },
                }
                highlightedEvent = null
                privileges = {
                    planning_event_management: 1,
                    planning_event_spike: 1,
                    planning_event_unspike: 1,
                }
            })

            it('spike is populated in item-actions according to privilege and event state', () => {
                let wrapper

                privileges.planning_event_spike = 1
                wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-dots-vertical').length).toBe(1)

                const itemActions = wrapper.find('ItemActionsMenu')
                expect(itemActions.props().actions.length).toBe(2)
                expect(itemActions.props().actions[0].label).toBe('Spike')

                privileges.planning_event_spike = 0
                wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-dots-vertical').length).toBe(1)
                const itemActions2 = wrapper.find('ItemActionsMenu')
                expect(itemActions2.props().actions[0].label).not.toBe('Spike')

                privileges.planning_event_spike = 1
                event.state = 'spiked'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-dots-vertical').length).toBe(1)

                const itemActions3 = wrapper.find('ItemActionsMenu')
                expect(itemActions3.props().actions.length).toBe(1)
                expect(itemActions3.props().actions[0].label).not.toBe('Spike')
            })

            it('unspike is populated in item-actions according to privilege and event state', () => {
                let wrapper

                privileges.planning_event_unspike = 1
                event.state = 'spiked'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-dots-vertical').length).toBe(1)

                const itemActions = wrapper.find('ItemActionsMenu')
                expect(itemActions.props().actions.length).toBe(1)
                expect(itemActions.props().actions[0].label).toBe('Unspike')

                privileges.planning_event_unspike = 0
                wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-dots-vertical').length).toBe(0)

                privileges.planning_event_uspike = 1
                event.state = 'in_progress'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-dots-vertical').length).toBe(1)

                const itemActions3 = wrapper.find('ItemActionsMenu')
                expect(itemActions3.props().actions.length).toBe(2)
                expect(itemActions3.props().actions[0].label).not.toBe('Unspike')
            })

            it('duplicate is populated item-actions according to privilege and event state', () => {
                let wrapper

                wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-dots-vertical').length).toBe(1)

                const itemActions = wrapper.find('ItemActionsMenu')
                expect(itemActions.props().actions.length).toBe(2)
                expect(itemActions.props().actions[1].label).toBe('Duplicate')

                event.state = 'spiked'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-dots-vertical').length).toBe(1)
                const itemActions2 = wrapper.find('ItemActionsMenu')
                expect(itemActions2.props().actions[0].label).not.toBe('Duplicate')

                privileges.planning_event_management = 0
                event.state = 'in_progress'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.icon-dots-vertical').length).toBe(0)
            })

            it('shows the `spiked` badge', () => {
                let wrapper

                event.state = 'in_progress'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.label--alert').length).toBe(0)

                event.state = 'spiked'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.label--alert').length).toBe(1)
                expect(wrapper.find('.label--alert').first().text()).toBe('spiked')
            })

            it('shows the `in progress` badge', () => {
                let wrapper

                event.state = 'in_progress'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.label--yellow2').length).toBe(1)
                expect(wrapper.find('.label--yellow2').first().text()).toBe('in progress')
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
                wrapper.find('.dropdown__toggle').first().simulate('click')
                wrapper.find('.dropdown__menu li button').first().simulate('click')
                expect(onSpikeEvent.callCount).toBe(1)
                expect(onSpikeEvent.args[0][0]).toEqual(event)
            })

            it('executes `onUnspikedEvent` callback', () => {
                event.state = 'spiked'
                let wrapper = getMountedWrapper()
                wrapper.find('.dropdown__toggle').first().simulate('click')
                wrapper.find('.dropdown__menu li button').first().simulate('click')
                expect(onUnspikeEvent.callCount).toBe(1)
                expect(onUnspikeEvent.args[0][0]).toEqual(event)
            })
        })
    })
})
