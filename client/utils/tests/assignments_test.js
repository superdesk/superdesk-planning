import * as utils from '../index';
import {PRIVILEGES} from '../../constants';

describe('can edit assignment', () => {
    let privileges;
    let assignment;
    let session;

    beforeEach(() => {
        privileges = {
            [PRIVILEGES.PLANNING_MANAGEMENT]: 1,
            [PRIVILEGES.ARCHIVE]: 1,
        };

        assignment = {
            _id: 'as1',
            assigned_to: {
                state: 'assigned',
                user: 'ident1',
            },
            lock_user: undefined,
            lock_session: undefined,
            planning: {g2_content_type: 'text'},
        };

        session = {
            identity: {_id: 'ident1'},
            sessionId: 'session1',
        };
    });

    const canEditAssignment = () => utils.assignmentUtils.canEditAssignment(
        assignment, session, privileges
    );
    const canStartWorking = () => utils.assignmentUtils.canStartWorking(
        assignment, session, privileges
    );
    const canCompleteAssignment = () => utils.assignmentUtils.canCompleteAssignment(
        assignment, session, privileges
    );
    const isAssignmentInEditableState = () => utils.assignmentUtils.isAssignmentInEditableState(
        assignment
    );
    const isAssignmentInUse = () => utils.assignmentUtils.isAssignmentInUse(
        assignment
    );

    const canRemoveAssignment = () => utils.assignmentUtils.canRemoveAssignment(
        assignment, session, privileges
    );

    const assignmentHasContent = () => utils.assignmentUtils.assignmentHasContent(
        assignment
    );

    it('no privileges', () => {
        privileges.planning_planning_management = 0;
        privileges.archive = 0;
        expect(canEditAssignment()).toBe(false);
        expect(canStartWorking()).toBe(false);
        expect(canCompleteAssignment()).toBe(false);
        expect(isAssignmentInUse()).toBe(false);
    });

    describe('workflow state', () => {
        it('assignment workflow state is `assigned`', () => {
            assignment.assigned_to.state = 'assigned';
            expect(canEditAssignment()).toBe(true);
            expect(canStartWorking()).toBe(true);
            expect(isAssignmentInEditableState()).toBe(true);
            expect(canCompleteAssignment()).toBe(false);
            expect(isAssignmentInUse()).toBe(false);
            expect(canRemoveAssignment()).toBe(true);
        });

        it('assignment workflow state is `in_progress`', () => {
            assignment.assigned_to.state = 'in_progress';
            expect(canEditAssignment()).toBe(true);
            expect(canStartWorking()).toBe(false);
            expect(isAssignmentInEditableState()).toBe(true);
            expect(canCompleteAssignment()).toBe(true);
            expect(isAssignmentInUse()).toBe(true);
            expect(canRemoveAssignment()).toBe(true);
        });

        it('assignment workflow state is `completed`', () => {
            assignment.assigned_to.state = 'completed';
            expect(canEditAssignment()).toBe(false);
            expect(canStartWorking()).toBe(false);
            expect(isAssignmentInEditableState()).toBe(false);
            expect(canCompleteAssignment()).toBe(false);
            expect(isAssignmentInUse()).toBe(true);
            expect(canRemoveAssignment()).toBe(false);
        });

        it('assignment workflow state is `submitted`', () => {
            assignment.assigned_to.state = 'submitted';
            expect(canEditAssignment()).toBe(true);
            expect(canStartWorking()).toBe(false);
            expect(isAssignmentInEditableState()).toBe(true);
            expect(canCompleteAssignment()).toBe(false);
            expect(isAssignmentInUse()).toBe(true);
            expect(canRemoveAssignment()).toBe(true);
        });

        it('assignment workflow state is `cancelled`', () => {
            assignment.assigned_to.state = 'cancelled';
            expect(canEditAssignment()).toBe(false);
            expect(canStartWorking()).toBe(false);
            expect(isAssignmentInEditableState()).toBe(false);
            expect(canCompleteAssignment()).toBe(false);
            expect(isAssignmentInUse()).toBe(false);
            expect(canRemoveAssignment()).toBe(false);
        });
    });

    describe('startWorking', () => {
        it('Only the assigned user can start working on an assignment', () => {
            assignment.assigned_to.user = 'ident1';
            expect(canStartWorking()).toBe(true);

            assignment.assigned_to.user = 'ident2';
            expect(canStartWorking()).toBe(false);
        });

        it('start working is only available for text assignments', () => {
            assignment.planning.g2_content_type = 'text';
            expect(canStartWorking()).toBe(true);

            assignment.planning.g2_content_type = 'photo';
            expect(canStartWorking()).toBe(false);
        });
    });

    describe('locks', () => {
        it('locked by another use', () => {
            assignment.lock_user = 'ident2';
            expect(canEditAssignment()).toBe(false);
            expect(canStartWorking()).toBe(false);
            expect(canCompleteAssignment()).toBe(false);
        });

        it('locked by the same user in another session', () => {
            assignment.lock_user = 'ident1';
            assignment.lock_session = 'session2';
            expect(canEditAssignment()).toBe(false);
            expect(canStartWorking()).toBe(false);
            expect(canCompleteAssignment()).toBe(false);
        });

        it('locked by the same user in the same session', () => {
            assignment.lock_user = 'ident1';
            assignment.lock_session = 'session1';
            expect(canEditAssignment()).toBe(true);
            expect(canStartWorking()).toBe(false);
            expect(canCompleteAssignment()).toBe(false);
        });
    });

    it('assignmentHasContent', () => {
        expect(assignmentHasContent()).toBe(false);

        assignment.item_ids = [];
        expect(assignmentHasContent()).toBe(false);

        assignment.item_ids = ['item1'];
        expect(assignmentHasContent()).toBe(true);

        assignment.item_ids = ['item1', 'item2'];
        expect(assignmentHasContent()).toBe(true);
    });
});
