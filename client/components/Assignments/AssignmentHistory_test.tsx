import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';

import '../../utils/testUtils';
import {users, desks} from '../../utils/testData';
import {AssignmentHistoryComponent} from './AssignmentHistory';

describe('<AssignmentHistory />', () => {
    let fetchAssignmentHistory;
    const assignment = {_id: 'as1'};

    beforeEach(() => {
        fetchAssignmentHistory = sinon.spy();
    });

    const getWrapper = (props) => mount(
        <AssignmentHistoryComponent
            assignment={assignment}
            fetchAssignmentHistory={fetchAssignmentHistory}
            users={users}
            {...props}
        />
    );

    it('renders create history when desk is not found (with user)', () => {
        const wrapper = getWrapper({
            desks: [],
            assignmentHistoryItems: [{
                _id: 'ah1',
                operation: 'create',
                _created: '2026-07-16T09:39:57+0000',
                user_id: 'ident1',
                update: {assigned_to: {desk: 'nonexistent_desk', user: 'ident1'}},
            }],
        });

        expect(wrapper.find('.history-list .item').length).toBe(1);
        expect(wrapper.find('.history-list .item').text()).toContain('-');
    });

    it('renders create history when desk is not found (without user)', () => {
        const wrapper = getWrapper({
            desks: [],
            assignmentHistoryItems: [{
                _id: 'ah2',
                operation: 'create',
                _created: '2026-07-16T09:39:57+0000',
                user_id: 'ident1',
                update: {assigned_to: {desk: 'nonexistent_desk'}},
            }],
        });

        expect(wrapper.find('.history-list .item').length).toBe(1);
        expect(wrapper.find('.history-list .item').text()).toContain('-');
    });

    it('renders submitted history when desk is not found', () => {
        const wrapper = getWrapper({
            desks: [],
            assignmentHistoryItems: [{
                _id: 'ah3',
                operation: 'submitted',
                _created: '2026-07-16T09:39:57+0000',
                user_id: 'ident1',
                update: {assigned_to: {desk: 'nonexistent_desk'}},
            }],
        });

        expect(wrapper.find('.history-list .item').length).toBe(1);
        expect(wrapper.find('.history-list .item').text()).toContain('-');
    });

    it('renders create history when desk is found', () => {
        const wrapper = getWrapper({
            desks: desks,
            assignmentHistoryItems: [{
                _id: 'ah4',
                operation: 'create',
                _created: '2026-07-16T09:39:57+0000',
                user_id: 'ident1',
                update: {assigned_to: {desk: 123, user: 'ident1'}},
            }],
        });

        expect(wrapper.find('.history-list .item').length).toBe(1);
        expect(wrapper.find('.history-list .item').text()).toContain('Politic Desk');
    });
});
