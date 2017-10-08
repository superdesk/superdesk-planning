import React from 'react'
import { Provider } from 'react-redux'
import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import PlanningItem from './index'
import sinon from 'sinon'
import moment from 'moment'
import { get } from 'lodash'
import { itemActionExists, clickItemAction } from '../../utils/testUtils'

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
            let locks

            const onClick = sinon.spy()
            const onDoubleClick = sinon.spy()
            const onSpike = sinon.spy()
            const onUnspike = sinon.spy()
            const onDuplicate = sinon.spy()
            const onCancel = sinon.spy()
            const onUpdateTime = sinon.spy()
            const onRescheduleEvent = sinon.spy()
            const onPostponeEvent = sinon.spy()
            const onConvertToRecurringEvent = sinon.spy()
            const onCancelPlanning = sinon.spy()
            const onCancelAllCoverage=sinon.spy()

            const getWrapper = (params=null) => {
                if (params !== null) {
                    privileges.planning_planning_spike = get(params, 'privilege', 1)
                    privileges.planning_planning_unspike = get(params, 'privilege', 1)
                    item.state = get(params, 'states.planning', 'draft')

                    if (get(params, 'states.event')) {
                        event = events[0]
                        event.state = get(params, 'states.event')
                    } else {
                        event = null
                    }
                }

                const store = createTestStore()

                return mount(
                    <Provider store={store}>
                        <PlanningItem
                            item={item}
                            event={event}
                            agendas={[agenda]}
                            active={active}
                            onClick={onClick}
                            onSpike={onSpike}
                            onUnspike={onUnspike}
                            onDuplicate={onDuplicate}
                            onCancelEvent={onCancel}
                            onUpdateEventTime={onUpdateTime}
                            onRescheduleEvent={onRescheduleEvent}
                            onPostponeEvent={onPostponeEvent}
                            onConvertToRecurringEvent={onConvertToRecurringEvent}
                            onCancelPlanning={onCancelPlanning}
                            onCancelAllCoverage={onCancelAllCoverage}
                            privileges={privileges}
                            lockedItems={locks}
                            currentWorkspace='PLANNING'
                        />
                    </Provider>
                )
            }

            // Creating this one separately as we cannot test click when doubleclick is used
            const getWrapperWithDoubleClickProp = () => {
                const store = createTestStore()
                return mount(<PlanningItem
                    item={item}
                    event={event}
                    agendas={[agenda]}
                    active={active}
                    onClick={onClick}
                    onDoubleClick={onDoubleClick}
                    onSpike={onSpike}
                    onUnspike={onUnspike}
                    onDuplicate={onDuplicate}
                    onCancelEvent={onCancel}
                    onUpdateEventTime={onUpdateTime}
                    onRescheduleEvent={onRescheduleEvent}
                    onPostponeEvent={onPostponeEvent}
                    onConvertToRecurringEvent={onConvertToRecurringEvent}
                    onCancelPlanning={onCancelPlanning}
                    onCancelAllCoverage={onCancelAllCoverage}
                    privileges={privileges}
                    store={store}
                    lockedItems={locks}
                    currentWorkspace='PLANNING'
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
                    state: 'draft',
                }, {
                    slugline: 'Plan3',
                    headline: 'Planner3',
                    state: 'spiked',
                }, {
                    slugline: 'Plan4',
                    headline: 'Planner4',
                    state: 'draft',
                    coverages: [
                        {
                            planning: {
                                headline: 'plan4',
                                scheduled: null,
                            },
                        },
                    ],
                    _coverages: [
                        {
                            scheduled: null,
                            coverage_id: '1',
                            g2_content_type: 'text',
                        },
                    ],
                }, {
                    slugline: 'Plan5',
                    headline: 'Planner5',
                    state: 'draft',
                    coverages: [
                        {
                            planning: {
                                headline: 'plan5-1',
                                scheduled: '2016-10-15T13:01:00+0000',
                            },
                        },
                        {
                            planning: {
                                headline: 'plan5-2',
                                scheduled: null,
                            },
                        },
                    ],
                    _coverages: [
                        {
                            scheduled: '2016-10-15T13:01:00+0000',
                            coverage_id: '1',
                            g2_content_type: 'text',
                        },
                        {
                            scheduled: null,
                            coverage_id: '2',
                            g2_content_type: 'text',
                        },
                    ],
                }]

                events = [{
                    dates: {
                        start: moment('2016-10-15T13:01:00+0000'),
                        end: moment('2016-10-15T14:01:00+0000'),
                    },
                }]

                agenda = {
                    name: 'Agenda1',
                    is_enabled: true,
                }

                locks = {
                    events: {},
                    planning: {},
                    recurring: {},
                }

                item = items[0]
                active = true
                event = null

                onClick.reset()
                onDoubleClick.reset()
                onSpike.reset()
                onUnspike.reset()
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
                const wrapper = getWrapper()

                // onClick
                wrapper.find('.ListItem').first().simulate('click')
                expect(onClick.callCount).toBe(1)
                expect(onClick.args[0][0]).toEqual(item)

                // onSpike
                clickItemAction(getWrapper(), '.icon-trash')
                expect(onSpike.callCount).toBe(1)
                expect(onSpike.args[0]).toEqual([item])

                // onUnspike
                item = items[2]
                clickItemAction(getWrapper(), '.icon-unspike')
                expect(onUnspike.callCount).toBe(1)
                expect(onUnspike.args[0]).toEqual([item])

                item = items[0]
                clickItemAction(getWrapper(), '.icon-copy')
                expect(onDuplicate.callCount).toBe(1)
                expect(onDuplicate.args[0]).toEqual([item])
            })

            /**
             * Ensure that the `spike` button is only shown if all conditions below are true
             * - Privilege planning_planning_spike === 1
             * - Planning item is not spiked
             * - Agenda is not spiked
             * - If associated event exists and not spiked
             */
            it('shows `spike` action', () => {
                let wrapper = getWrapper({
                    privilege: 1,
                    states: { planning: 'draft' },
                })
                expect(itemActionExists(wrapper, 'Spike')).toBe(true)

                wrapper = getWrapper({
                    privilege: 1,
                    states: {
                        planning: 'draft',
                        event: 'draft',
                    },
                })
                expect(itemActionExists(wrapper, 'Spike')).toBe(true)

                wrapper = getWrapper({
                    privilege: 0,
                    states: { planning: 'draft' },
                })
                expect(itemActionExists(wrapper, 'Spike')).toBe(false)
            })

            /**
             * Ensure that the `unspike` button is only shown if all conditions below are true
             * - Privilege planning_planning_unspike === 1
             * - Planning item is spiked
             * - Agenda is not spiked
             * - If associated event exists and not spiked
             */
            it('shows `unspike` button', () => {
                let wrapper = getWrapper({
                    privilege: 1,
                    states: { planning: 'draft' },
                })
                expect(itemActionExists(wrapper, 'Unspike')).toBe(false)

                wrapper = getWrapper({
                    privilege: 1,
                    states: {
                        planning: 'spiked',
                        event: 'draft',
                    },
                })
                expect(itemActionExists(wrapper, 'Unspike')).toBe(true)

                wrapper = getWrapper({
                    privilege: 0,
                    states: { planning: 'draft' },
                })
                expect(itemActionExists(wrapper, 'Unspike')).toBe(false)

                wrapper = getWrapper({
                    privilege: 1,
                    states: { planning: 'spiked' },
                })
                expect(itemActionExists(wrapper, 'Unspike')).toBe(true)

                wrapper = getWrapper({
                    privilege: 1,
                    states: {
                        planning: 'spiked',
                        event: 'spiked',
                    },
                })
                expect(itemActionExists(wrapper, 'Unspike')).toBe(false)
            })

            it('if no coverage then icon bell is hidden', () => {
                item = items[0]
                const wrapper = getWrapper()
                // no coverage then icon bell is hidden
                expect(wrapper.find('.icon-bell').length).toBe(0)
            })

            it('if coverage are not scheduled then icon bell is hidden', () => {
                item = items[3]
                const wrapper = getWrapper()
                // no coverage then icon bell is hidden
                expect(wrapper.find('.icon-bell').length).toBe(0)
            })

            it('if coverage are scheduled then icon bell is displayed', () => {
                item = items[4]
                const wrapper = getWrapper()
                // icon bell is displayed
                expect(wrapper.find('.icon-bell').length).toBe(1)
            })
        })
    })
})
