import React from 'react'
import { mount, shallow } from 'enzyme'
import PlanningItem from './index'
import sinon from 'sinon'
import moment from 'moment'
import { get } from 'lodash'

describe('planning', () => {
    describe('components', () => {
        describe('<PlanningItem />', () => {
            let privileges
            let item
            let agenda
            let items
            let event
            let events
            let active

            const onClick = sinon.spy()
            const onDoubleClick = sinon.spy()
            const onSpike = sinon.spy()
            const onUnspike = sinon.spy()

            const getWrapper = () => (
                mount(<PlanningItem
                    item={item}
                    event={event}
                    agenda={agenda}
                    active={active}
                    onClick={onClick}
                    onSpike={onSpike}
                    onUnspike={onUnspike}
                    privileges={privileges}
                />)
            )

            // Creating this one separately as we cannot test click when doubleclick is used
            const getWrapperWithDoubleClickProp = () => (
                mount(<PlanningItem
                    item={item}
                    event={event}
                    agenda={agenda}
                    active={active}
                    onClick={onClick}
                    onDoubleClick={onDoubleClick}
                    onSpike={onSpike}
                    onUnspike={onUnspike}
                    privileges={privileges}
                />)
            )

            const getShallowWrapperWithStates = (params) => {
                privileges.planning_planning_spike = get(params, 'privilege', 1)
                privileges.planning_planning_unspike = get(params, 'privilege', 1)
                item.state = get(params, 'states.planning', 'active')
                agenda.state = get(params, 'states.agenda', 'active')

                if (get(params, 'states.event')) {
                    event = events[0]
                    event.state = get(params, 'states.event')
                } else {
                    event = null
                }
                return shallow(<PlanningItem
                    item={item}
                    event={event}
                    agenda={agenda}
                    active={active}
                    onClick={onClick}
                    onSpike={onSpike}
                    onUnspike={onUnspike}
                    privileges={privileges}
                />)
            }

            beforeEach(() => {
                privileges = {
                    planning: 1,
                    planning_planning_management: 1,
                    planning_planning_spike: 1,
                    planning_planning_unspike: 1,
                }

                items = [{
                    slugline: 'Plan1',
                    headline: 'Planner1',
                }, {
                    slugline: 'Plan2',
                    headline: 'Planner2',
                    state: 'active',
                }, {
                    slugline: 'Plan3',
                    headline: 'Planner3',
                    state: 'spiked',
                }]

                events = [{
                    dates: {
                        start: moment('2016-10-15T13:01:00+0000'),
                        end: moment('2016-10-15T14:01:00+0000'),
                    },
                }]

                agenda = { name: 'Agenda1' }

                item = items[0]
                active = true
                event = null

                onClick.reset()
                onDoubleClick.reset()
                onSpike.reset()
                onUnspike.reset()
            })

            it('renders an active planning item', () => {
                const wrapper = getWrapper()

                // Doesnt show the `spiked` alert label
                expect(wrapper.find('.label--alert').length).toBe(0)

                // Shows Spike button and not Unspike button
                expect(wrapper.find('.icon-trash').length).toBe(1)
                expect(wrapper.find('.icon-unspike').length).toBe(0)
            })

            it('renders a spiked planning item', () => {
                item = items[2]
                const wrapper = getWrapper()

                // Shows the `spiked` alert label
                expect(wrapper.find('.label--alert').length).toBe(1)

                // Shows Unspike button and not Spike button
                expect(wrapper.find('.icon-trash').length).toBe(0)
                expect(wrapper.find('.icon-unspike').length).toBe(1)

            })

            // Creating this one separately as we cannot test click when doubleclick is used
            it('executes onDoubleClick callbacks', () => {
                let wrapper = getWrapperWithDoubleClickProp()

                // onClick
                wrapper.find('.ListItem').first().simulate('click')
                wrapper.find('.ListItem').first().simulate('click')
                expect(onDoubleClick.callCount).toBe(1)
                expect(onDoubleClick.args[0][0]).toEqual(item)
            })

            it('executes callbacks onClick, onSpike and onUnspike', () => {
                let wrapper = getWrapper()

                // onClick
                wrapper.find('.ListItem').first().simulate('click')
                expect(onClick.callCount).toBe(1)
                expect(onClick.args[0][0]).toEqual(item)

                // onSpike
                wrapper.find('.icon-trash').first().parent().simulate('click')
                expect(onSpike.callCount).toBe(1)
                expect(onSpike.args[0]).toEqual([item])

                // onUnspike
                item = items[2]
                wrapper = getWrapper()
                wrapper.find('.icon-unspike').first().parent().simulate('click')
                expect(onUnspike.callCount).toBe(1)
                expect(onUnspike.args[0]).toEqual([item])
            })

            /**
             * Ensure that the `spike` button is only shown if all conditions below are true
             * - Privilege planning_planning_spike === 1
             * - Planning item is not spiked
             * - Agenda is not spiked
             * - If associated event exists and not spiked
             */
            it('shows `spike` button', () => {
                let wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'active',
                        agenda: 'active',
                    },
                })
                expect(wrapper.find('.icon-trash').length).toBe(1)

                wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'active',
                        agenda: 'active',
                        event: 'active',
                    },
                })
                expect(wrapper.find('.icon-trash').length).toBe(1)

                wrapper = getShallowWrapperWithStates({
                    privilege: 0,
                    states: {
                        planning: 'active',
                        agenda: 'active',
                    },
                })
                expect(wrapper.find('.icon-trash').length).toBe(0)

                wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'spiked',
                        agenda: 'active',
                    },
                })
                expect(wrapper.find('.icon-trash').length).toBe(0)

                wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'active',
                        agenda: 'spiked',
                    },
                })
                expect(wrapper.find('.icon-trash').length).toBe(0)

                wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'active',
                        agenda: 'active',
                        event: 'spiked',
                    },
                })
                expect(wrapper.find('.icon-trash').length).toBe(0)
            })

            /**
             * Ensure that the `unspike` button is only shown if all conditions below are true
             * - Privilege planning_planning_unspike === 1
             * - Planning item is spiked
             * - Agenda is not spiked
             * - If associated event exists and not spiked
             */
            it('shows `unspike` button', () => {
                let wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'spiked',
                        agenda: 'active',
                    },
                })
                expect(wrapper.find('.icon-unspike').length).toBe(1)

                wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'spiked',
                        agenda: 'active',
                        event: 'active',
                    },
                })
                expect(wrapper.find('.icon-unspike').length).toBe(1)

                wrapper = getShallowWrapperWithStates({
                    privilege: 0,
                    states: {
                        planning: 'spiked',
                        agenda: 'active',
                    },
                })
                expect(wrapper.find('.icon-unspike').length).toBe(0)

                wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'active',
                        agenda: 'active',
                    },
                })
                expect(wrapper.find('.icon-unspike').length).toBe(0)

                wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'spiked',
                        agenda: 'spiked',
                    },
                })
                expect(wrapper.find('.icon-unspike').length).toBe(0)

                wrapper = getShallowWrapperWithStates({
                    privilege: 1,
                    states: {
                        planning: 'spiked',
                        agenda: 'active',
                        event: 'spiked',
                    },
                })
                expect(wrapper.find('.icon-unspike').length).toBe(0)
            })
        })
    })
})
