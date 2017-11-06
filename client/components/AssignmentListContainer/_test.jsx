import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import { AssignmentListContainer } from './index'
import React from 'react'
import { Provider } from 'react-redux'

describe('<AssignmentListContainer />', () => {
    it('check container components', () => {
        const initialState = {
            assignment: {
                assignments: {
                    1: {
                        _id: 1,
                        _created: '2017-07-13T13:55:41+0000',
                        _updated: '2017-07-28T11:16:36+0000',
                        planning: {
                            assigned_to: {
                                assigned_date: '2017-07-28T11:16:36+0000',
                                desk: 'desk1',
                            },
                            scheduled: '2017-07-28T11:16:36+0000',
                            slugline: 'slugline',
                            headline: 'headline',
                        },
                    },
                },
                filterBy: 'All',
                searchQuery: 'test',
                orderByField: 'Updated',
                orderDirection: 'Desc',
                lastAssignmentLoadedPage: 1,
                previewOpened: true,
                currentAssignmentId: 1,
                assignmentsInList: [1],
                readOnly: true,
            },
            session: { identity: { _id: 'user1' } },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <AssignmentListContainer />
            </Provider>
        )
        expect(wrapper.find('SearchBar').length).toBe(1)
        expect(wrapper.find('OrderBar').length).toBe(1)
        expect(wrapper.find('.search-handler').length).toBe(1)
        expect(wrapper.find('EditAssignment').length).toBe(1)
    })
})