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
            let onDoubleClick
            let onSelectChange
            let assignment

            const getShallowWrapper = () => (
                shallow(<AssignmentItem
                    onClick={onClick}
                    onDoubleClick={onDoubleClick}
                    onSelectChange={onSelectChange}
                    assignment={assignment}
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
                onClick = sinon.spy(() => (Promise.resolve()))
                onDoubleClick = sinon.spy(() => (Promise.resolve()))
                onSelectChange = sinon.spy(() => (Promise.resolve()))
                assignment = {
                    _id: 1,
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: {
                        assigned_to: {
                            assigned_date: '2017-07-28T11:16:36+0000',
                            desk: 'desk1',
                        },
                        scheduled: '2017-07-28T11:16:36+0000',
                    },
                }
            })

            it('show item', () => {
                let wrapper

                wrapper = getShallowWrapper()
                expect(wrapper.find('.icon-time').length).toBe(1)
                expect(wrapper.find('UserAvatar').length).toBe(1)
                expect(wrapper.find('Checkbox').length).toBe(1)
                expect(wrapper.find('AbsoluteDate').length).toBe(1)
            })

            it('executes `onClick` callback', () => {
                let wrapper = getMountedWrapper()
                const item = wrapper.find('.ListItem').first()
                item.simulate('click')
                expect(onClick.callCount).toBe(1)
                expect(onClick.args[0][0]).toEqual(assignment)
            })
        })
    })
})
