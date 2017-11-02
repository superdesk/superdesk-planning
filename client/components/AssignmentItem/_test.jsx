import React from 'react'
import { shallow, mount } from 'enzyme'
import { AssignmentItem } from './index'
import sinon from 'sinon'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'

describe('assignments', () => {
    describe('components', () => {
        describe('<AssignmentItem />', () => {
            let onClick
            let onSelectChange
            let assignment
            let lockedItems

            const getShallowWrapper = () => (
                shallow(<AssignmentItem
                    onClick={onClick}
                    onSelectChange={onSelectChange}
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
                            onSelectChange={onSelectChange}
                            assignment={assignment}
                            isSelected={true} />
                    </Provider>
                )
            }

            beforeEach(() => {
                lockedItems = { assignments: { '1': 'lock_information' } }
                onSelectChange = sinon.spy(() => (Promise.resolve()))
                assignment = {
                    _id: 1,
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: { scheduled: '2017-07-28T11:16:36+0000' },
                    assigned_to: {
                        assigned_date: '2017-07-28T11:16:36+0000',
                        desk: 'desk1',
                    },
                    priority: 2,
                }
            })

            it('show item', () => {
                const wrapper = getShallowWrapper()
                expect(wrapper.find('.icon-time').length).toBe(1)
                expect(wrapper.find('UserAvatar').length).toBe(1)
                expect(wrapper.find('Checkbox').length).toBe(1)
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
                const wrapper = getShallowWrapper()
                expect(wrapper.find('.ListItem--locked').length).toBe(0)
            })

            it('shows red border if assignment is locked', () => {
                const wrapper = getShallowWrapper()
                expect(wrapper.find('.ListItem--locked').length).toBe(1)
            })

            it('displays tooltip for priority', () => {
                const wrapper = getMountedWrapper()
                const priorityNode = wrapper.find('.priority-label').first()
                expect(priorityNode.prop('data-sd-tooltip')).toBe('Medium')
            })
        })
    })
})
