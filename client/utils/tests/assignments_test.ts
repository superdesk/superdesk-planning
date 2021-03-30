import * as utils from '../index';
import {PRIVILEGES, ASSIGNMENTS} from '../../constants';

describe('can edit assignment', () => {
    let privileges;
    let assignment;
    let session;
    let contetTypes;

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

        contetTypes = [{
            name: 'Text',
            qcode: 'text',
        }];
    });

    const canStartWorking = () => utils.assignmentUtils.canStartWorking(
        assignment, session, privileges, contetTypes
    );
    const canCompleteAssignment = () => utils.assignmentUtils.canCompleteAssignment(
        assignment, session, privileges
    );

    const canRemoveAssignment = () => utils.assignmentUtils.canEditAssignment(
        assignment, session, privileges, PRIVILEGES.PLANNING_MANAGEMENT
    );

    const assignmentHasContent = () => utils.assignmentUtils.assignmentHasContent(
        assignment
    );

    const canReassign = () => utils.assignmentUtils.canEditAssignment(
        assignment, session, privileges, PRIVILEGES.ARCHIVE
    );
    const canEditPriority = () => utils.assignmentUtils.canEditAssignment(
        assignment, session, privileges, PRIVILEGES.ARCHIVE
    );
    const canConfirmAvailability = () => utils.assignmentUtils.canConfirmAvailability(
        assignment, session, privileges, contetTypes
    );
    const canRevertAvailability = () => utils.assignmentUtils.canRevertAssignment(
        assignment, session, privileges
    );

    it('no privileges', () => {
        privileges.planning_planning_management = 0;
        privileges.archive = 0;
        expect(canStartWorking()).toBe(false);
        expect(canCompleteAssignment()).toBe(false);
        expect(canRemoveAssignment()).toBe(false);
        expect(canReassign()).toBe(false);
        expect(canEditPriority()).toBe(false);
        expect(canConfirmAvailability()).toBe(false);
        expect(canRevertAvailability()).toBe(false);
    });

    describe('workflow state', () => {
        it('assignment workflow state is `assigned`', () => {
            assignment.assigned_to.state = 'assigned';
            expect(canStartWorking()).toBe(true);
            expect(!!canCompleteAssignment()).toBe(false);
            expect(canRemoveAssignment()).toBe(true);
            expect(canReassign()).toBe(true);
            expect(canEditPriority()).toBe(true);
            expect(canConfirmAvailability()).toBe(false);
            expect(canRevertAvailability()).toBe(false);
        });

        it('assignment workflow state is `in_progress`', () => {
            assignment.assigned_to.state = 'in_progress';
            expect(canStartWorking()).toBe(false);
            expect(canCompleteAssignment()).toBe(true);
            expect(canRemoveAssignment()).toBe(true);
            expect(canReassign()).toBe(true);
            expect(canEditPriority()).toBe(true);
            expect(canConfirmAvailability()).toBe(false);
            expect(canRevertAvailability()).toBe(false);
        });

        it('assignment workflow state is `completed`', () => {
            assignment.assigned_to.state = 'completed';
            expect(canStartWorking()).toBe(false);
            expect(canCompleteAssignment()).toBe(false);
            expect(canRemoveAssignment()).toBe(false);
            expect(canReassign()).toBe(false);
            expect(canEditPriority()).toBe(false);
            expect(canConfirmAvailability()).toBe(false);
            expect(canRevertAvailability()).toBe(true);
        });

        it('assignment workflow state is `submitted`', () => {
            assignment.assigned_to.state = 'submitted';
            expect(canStartWorking()).toBe(false);
            expect(!!canCompleteAssignment()).toBe(false);
            expect(canRemoveAssignment()).toBe(true);
            expect(canReassign()).toBe(true);
            expect(canEditPriority()).toBe(true);
            expect(canConfirmAvailability()).toBe(false);
            expect(canRevertAvailability()).toBe(false);
        });

        it('assignment workflow state is `cancelled`', () => {
            assignment.assigned_to.state = 'cancelled';
            expect(canStartWorking()).toBe(false);
            expect(canCompleteAssignment()).toBe(false);
            expect(canRemoveAssignment()).toBe(false);
            expect(canReassign()).toBe(false);
            expect(canEditPriority()).toBe(false);
            expect(canConfirmAvailability()).toBe(false);
            expect(canRevertAvailability()).toBe(false);
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
        it('locked by another user', () => {
            assignment.lock_user = 'ident2';
            assignment.lock_session = 'session2';
            expect(canStartWorking()).toBe(false);
            expect(canCompleteAssignment()).toBe(false);
        });

        it('locked by the same user in another session', () => {
            assignment.lock_user = 'ident1';
            assignment.lock_session = 'session2';
            expect(canStartWorking()).toBe(false);
            expect(canCompleteAssignment()).toBe(false);
        });

        it('locked by the same user in the same session', () => {
            assignment.lock_user = 'ident1';
            assignment.lock_session = 'session1';
            expect(canStartWorking()).toBe(false);
            expect(!!canCompleteAssignment()).toBe(false);
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

    describe('getAssignmentGroupsByStates', () => {
        it('returns an empty array if no states provided', () => {
            let groups;

            groups = utils.assignmentUtils.getAssignmentGroupsByStates([], []);
            expect(groups).toEqual([]);

            groups = utils.assignmentUtils.getAssignmentGroupsByStates();
            expect(groups).toEqual([]);
        });

        it('returns groups that are associated with the assignment state', () => {
            let groups;

            groups = utils.assignmentUtils.getAssignmentGroupsByStates(
                Object.keys(ASSIGNMENTS.LIST_GROUPS),
                ['assigned']
            );
            expect(groups).toEqual(['TODO', 'CURRENT', 'TODAY', 'FUTURE']);

            groups = utils.assignmentUtils.getAssignmentGroupsByStates(
                Object.keys(ASSIGNMENTS.LIST_GROUPS),
                ['submitted']
            );
            expect(groups).toEqual(['TODO', 'CURRENT', 'TODAY', 'FUTURE']);

            groups = utils.assignmentUtils.getAssignmentGroupsByStates(
                Object.keys(ASSIGNMENTS.LIST_GROUPS),
                ['in_progress']
            );
            expect(groups).toEqual(['IN_PROGRESS']);

            groups = utils.assignmentUtils.getAssignmentGroupsByStates(
                Object.keys(ASSIGNMENTS.LIST_GROUPS),
                ['completed']
            );
            expect(groups).toEqual(['COMPLETED']);

            groups = utils.assignmentUtils.getAssignmentGroupsByStates(
                Object.keys(ASSIGNMENTS.LIST_GROUPS),
                ['cancelled']
            );
            expect(groups).toEqual(['COMPLETED']);
        });

        it('returns groups that are associated with any state in the array', () => {
            let groups;

            groups = utils.assignmentUtils.getAssignmentGroupsByStates(
                Object.keys(ASSIGNMENTS.LIST_GROUPS),
                ['assigned', 'in_progress']
            );
            expect(groups).toEqual(['TODO', 'CURRENT', 'TODAY', 'FUTURE', 'IN_PROGRESS']);
        });
    });
});
