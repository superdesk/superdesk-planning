import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import { EditAssignmentContainer } from './index'
import React from 'react'
import { Provider } from 'react-redux'

describe('<EditAssignmentContainer />', () => {
    it('check container components', () => {
        const initialState = {
            assignment: {
                assignments: [
                    {
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
                ],
                previewOpened: true,
                currentAssignment: {
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
                readOnly: true,
            },
        }
        const store = createTestStore({ initialState })
        const wrapper = mount(
            <Provider store={store}>
                <EditAssignmentContainer />
            </Provider>
        )

        expect(wrapper.find('AuditInformationComponent').length).toBe(1)
        expect(wrapper.find('OverlayTrigger').length).toBe(1)
        expect(wrapper.find('CoverageComponent').length).toBe(1)
    })
})