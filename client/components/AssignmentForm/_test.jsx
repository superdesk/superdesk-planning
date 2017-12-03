import {createTestStore} from '../../utils';
import {mount} from 'enzyme';
import {AssignmentForm} from './index';
import React from 'react';
import {Provider} from 'react-redux';
import moment from 'moment';

describe('<AssignmentForm />', () => {
    it('check container components', () => {
        const initialState = {
            assignment: {
                assignments: {
                    1: {
                        _id: 1,
                        _created: '2017-07-13T13:55:41+0000',
                        _updated: '2017-07-28T11:16:36+0000',
                        planning: {
                            scheduled: moment('2017-07-28T11:16:36+0000'),
                            slugline: 'slugline',
                            headline: 'headline',
                        },
                        assigned_to: {
                            assigned_date: '2017-07-28T11:16:36+0000',
                            desk: 'desk1',
                        },
                    },
                },
                previewOpened: true,
                currentAssignmentId: 1,
                readOnly: true,
                assignmentsInList: [1],
            },
        };
        const store = createTestStore({initialState});
        const wrapper = mount(
            <Provider store={store}>
                <AssignmentForm />
            </Provider>
        );

        expect(wrapper.find('CoverageDetailsComponent').length).toBe(1);
        expect(wrapper.find('EditAssignment').length).toBe(1);
    });
});