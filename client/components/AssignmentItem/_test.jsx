import React from 'react'
import { shallow, mount } from 'enzyme'
import { AssignmentItem } from './index'
import sinon from 'sinon'
import { createTestStore } from '../../utils'
import { List } from '../UI'
import { Provider } from 'react-redux'

describe('assignments', () => {
    describe('components', () => {
        describe('<AssignmentItem />', () => {
            let onClick
            let assignment
            let lockedItems

            const getShallowWrapper = () => (
                shallow(<AssignmentItem
                    onClick={onClick}
                    assignment={assignment}
                    lockedItems={lockedItems}
                />)
            )

            const getMountedWrapper = () => {
                const store = createTestStore({})
                return mount(
                    <Provider store={store}>
                        <AssignmentItem
                            onClick={onClick}
                            assignment={assignment}
                            lockedItems={lockedItems}
                            priorities={store.getState().vocabularies.assignment_priority}
                        />
                    </Provider>
                )
            }

            beforeEach(() => {
                lockedItems = { assignments: { as1: 'lock_information' } }
                assignment = {
                    _id: 'as1',
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: { scheduled: '2017-07-28T11:16:36+0000' },
                    assigned_to: {
                        assigned_date: '2017-07-28T11:16:36+0000',
                        desk: 'desk1',
                    },
                    priority: 2,
                }

                onClick = sinon.spy()
            })

            it('show item', () => {
                const wrapper = getShallowWrapper()
                expect(wrapper.find('.icon-time').length).toBe(1)
                expect(wrapper.find('UserAvatar').length).toBe(1)
                expect(wrapper.find('AbsoluteDate').length).toBe(1)
            })

            it('executes `onClick` callback', () => {
                onClick = sinon.spy((arg) => {
                    expect(arg).toEqual(assignment)
                    return Promise.resolve()
                })

                const wrapper = getMountedWrapper()
                const item = wrapper.find('.ListItem').first()
                item.simulate('click')
            })

            it('does not show red border if assignment is not locked', () => {
                lockedItems = null
                const wrapper = getMountedWrapper()
                expect(wrapper.find(List.Border).props().state).toEqual(null)
            })

            it('shows red border if assignment is locked', () => {
                const wrapper = getMountedWrapper()
                expect(wrapper.find(List.Border).props().state).toEqual('locked')
            })

            it('displays tooltip for priority', () => {
                const wrapper = getMountedWrapper()
                const priorityNode = wrapper.find('.priority-label').first()
                expect(priorityNode.prop('data-sd-tooltip')).toBe('Priority: Medium')
            })
        })
    })
})
