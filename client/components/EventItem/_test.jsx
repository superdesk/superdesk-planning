import React from 'react'
import { mount } from 'enzyme'
import { EventItem } from './index'
import sinon from 'sinon'
import moment from 'moment'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import { itemActionExists } from '../../utils/testUtils'

describe('events', () => {
    describe('components', () => {
        describe('<EventItem />', () => {
            let onClick
            let onDoubleClick
            let event
            let onSpikeEvent
            let onUnspikeEvent
            let onDuplicateEvent
            let onCancelEvent
            let onSelectChange
            let addEventToCurrentAgenda
            let onUpdateEventTime
            let onRescheduleEvent
            let onPostponeEvent
            let onConvertToRecurringEvent
            let highlightedEvent
            let privileges
            let locks

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
                            onCancelEvent={onCancelEvent}
                            onSelectChange={onSelectChange}
                            onUpdateEventTime={onUpdateEventTime}
                            onRescheduleEvent={onRescheduleEvent}
                            onPostponeEvent={onPostponeEvent}
                            onConvertToRecurringEvent={onConvertToRecurringEvent}
                            highlightedEvent={highlightedEvent}
                            addEventToCurrentAgenda={addEventToCurrentAgenda}
                            privileges={privileges}
                            lockedItems={locks}
                        />
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
                            onCancelEvent={onCancelEvent}
                            onSelectChange={onSelectChange}
                            onUpdateEventTime={onUpdateEventTime}
                            onRescheduleEvent={onRescheduleEvent}
                            onPostponeEvent={onPostponeEvent}
                            onConvertToRecurringEvent={onConvertToRecurringEvent}
                            highlightedEvent={highlightedEvent}
                            addEventToCurrentAgenda={addEventToCurrentAgenda}
                            privileges={privileges}
                            lockedItems={locks}
                        />
                    </Provider>
                )
            }

            beforeEach(() => {
                onClick = sinon.spy(() => (Promise.resolve()))
                onDoubleClick = sinon.spy(() => (Promise.resolve()))
                onSpikeEvent = sinon.spy(() => (Promise.resolve()))
                onUnspikeEvent = sinon.spy(() => (Promise.resolve()))
                onDuplicateEvent = sinon.spy(() => (Promise.resolve()))
                onCancelEvent = sinon.spy(() => (Promise.resolve()))
                onSelectChange = sinon.spy(() => (Promise.resolve()))
                addEventToCurrentAgenda = sinon.spy(()=>(Promise.resolve()))
                onUpdateEventTime = sinon.spy(() => (Promise.resolve()))
                onRescheduleEvent = sinon.spy(() => (Promise.resolve()))
                onPostponeEvent = sinon.spy(() => (Promise.resolve()))
                onConvertToRecurringEvent = sinon.spy(() => (Promise.resolve()))

                event = {
                    state: 'draft',
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

                locks = {
                    events: {},
                    planning: {},
                    recurring: {},
                }
            })

            it('spike is populated in item-actions according to privilege and event state', () => {
                let wrapper

                privileges.planning_event_spike = 1
                wrapper = getMountedWrapper()
                expect(itemActionExists(wrapper, 'Spike')).toBe(true)

                privileges.planning_event_spike = 0
                wrapper = getMountedWrapper()
                expect(itemActionExists(wrapper, 'Spike')).toBe(false)

                privileges.planning_event_spike = 1
                event.state = 'spiked'
                wrapper = getMountedWrapper()
                expect(itemActionExists(wrapper, 'Spike')).toBe(false)
            })

            it('unspike is populated in item-actions according to privilege and event state', () => {
                let wrapper

                privileges.planning_event_unspike = 1
                event.state = 'spiked'
                wrapper = getMountedWrapper()
                expect(itemActionExists(wrapper, 'Unspike')).toBe(true)

                privileges.planning_event_unspike = 0
                wrapper = getMountedWrapper()
                expect(itemActionExists(wrapper, 'Unspike')).toBe(false)

                privileges.planning_event_uspike = 1
                event.state = 'draft'
                wrapper = getMountedWrapper()
                expect(itemActionExists(wrapper, 'Unspike')).toBe(false)
            })

            it('duplicate is populated item-actions according to privilege and event state', () => {
                let wrapper

                wrapper = getMountedWrapper()
                expect(itemActionExists(wrapper, 'Duplicate')).toBe(true)

                event.state = 'spiked'
                wrapper = getMountedWrapper()
                expect(itemActionExists(wrapper, 'Duplicate')).toBe(false)

                privileges.planning_event_management = 0
                event.state = 'draft'
                wrapper = getMountedWrapper()
                expect(itemActionExists(wrapper, 'Duplicate')).toBe(false)
            })

            it('shows the `spiked` badge', () => {
                let wrapper

                event.state = 'draft'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.label--alert').length).toBe(0)

                event.state = 'spiked'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.label--alert').length).toBe(1)
                expect(wrapper.find('.label--alert').first().text()).toBe('spiked')
            })

            it('shows the `draft` badge', () => {
                let wrapper

                event.state = 'draft'
                wrapper = getMountedWrapper()
                expect(wrapper.find('.label').length).toBe(1)
                expect(wrapper.find('.label').first().text()).toBe('draft')
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
                wrapper.find('.dropdown__menu li button').at(1).simulate('click')
                expect(onSpikeEvent.callCount).toBe(1)
                expect(onSpikeEvent.args[0][0]).toEqual(event)
            })

            it('executes `onUnspikedEvent` callback', () => {
                event.state = 'spiked'
                let wrapper = getMountedWrapper()
                wrapper.find('.dropdown__toggle').first().simulate('click')
                wrapper.find('.dropdown__menu li button').at(1).simulate('click')
                expect(onUnspikeEvent.callCount).toBe(1)
                expect(onUnspikeEvent.args[0][0]).toEqual(event)
            })
        })
    })
})
