import React from 'react'
import { mount } from 'enzyme'
import PlanningItem from './index'
import sinon from 'sinon'

describe('planning', () => {
    describe('components', () => {
        describe('<PlanningItem />', () => {
            let privileges
            let item
            let items
            let event
            let active
            const onClick = sinon.spy()
            const onSpike = sinon.spy()
            const onUnspike = sinon.spy()

            const getWrapper = () => (
                mount(<PlanningItem
                    item={item}
                    event={event}
                    active={active}
                    onClick={onClick}
                    onSpike={onSpike}
                    onUnspike={onUnspike}
                    privileges={privileges}
                />)
            )

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

                item = items[0]
                active = true
                event = null

                onClick.reset()
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

            // Ensure that the `spike` button is only shown when the user has the privilege
            it('shows `spike` button with privilege', () => {
                let wrapper = getWrapper()
                expect(wrapper.find('.icon-trash').length).toBe(1)

                privileges.planning_planning_spike = 0
                wrapper = getWrapper()
                expect(wrapper.find('.icon-trash').length).toBe(0)
            })

            // Ensure that the `unspike` button is only shown when the user has the privilege
            it('shows `unspike` button with privilege', () => {
                item = items[2]
                let wrapper = getWrapper()
                expect(wrapper.find('.icon-unspike').length).toBe(1)

                privileges.planning_planning_unspike = 0
                wrapper = getWrapper()
                expect(wrapper.find('.icon-unspike').length).toBe(0)
            })
        })
    })
})
