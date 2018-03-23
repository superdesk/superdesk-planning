import React from 'react';
import {shallow, mount} from 'enzyme';
import {AssignmentItem} from './index';
import sinon from 'sinon';
import {createTestStore} from '../../utils';
import {List} from '../UI';
import {Provider} from 'react-redux';
import * as helpers from '../tests/helpers';
import {cloneDeep} from 'lodash';

describe('assignments', () => {
    describe('components', () => {
        describe('<AssignmentItem />', () => {
            let onClick;
            let assignment;
            let lockedItems;
            let privileges = {
                planning_planning_management: 1,
                archive: 1,
            };
            let session = {identity: {_id: 'ident1'}};

            let [reassign, revertAssignment, editAssignmentPriority,
                startWorking, removeAssignment, onDoubleClick, completeAssignment] = Array(7).fill(() => true);

            const getShallowWrapper = () => (
                shallow(<AssignmentItem
                    onClick={onClick}
                    onDoubleClick={onDoubleClick}
                    assignment={assignment}
                    lockedItems={lockedItems}
                    reassign={reassign}
                    editAssignmentPriority={editAssignmentPriority}
                    completeAssignment={completeAssignment}
                    startWorking={startWorking}
                    removeAssignment={removeAssignment}
                    revertAssignment={revertAssignment}
                    inAssignments={true}
                    privileges={privileges}
                    session={session}
                />)
            );

            const getMountedWrapper = () => {
                const store = createTestStore({});

                return mount(
                    <Provider store={store}>
                        <AssignmentItem
                            onClick={onClick}
                            onDoubleClick={onDoubleClick}
                            assignment={assignment}
                            lockedItems={lockedItems}
                            priorities={store.getState().vocabularies.assignment_priority}
                            reassign={reassign}
                            editAssignmentPriority={editAssignmentPriority}
                            completeAssignment={completeAssignment}
                            startWorking={startWorking}
                            removeAssignment={removeAssignment}
                            revertAssignment={revertAssignment}
                            privileges={privileges}
                            session={session}
                            inAssignments={true}
                        />
                    </Provider>
                );
            };

            beforeEach(() => {
                lockedItems = {assignments: {as1: 'lock_information'}};
                assignment = {
                    _id: 'as1',
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: {scheduled: '2017-07-28T11:16:36+0000'},
                    assigned_to: {
                        assigned_date: '2017-07-28T11:16:36+0000',
                        desk: 'desk1',
                        state: 'assigned',
                    },
                    priority: 2,
                };

                onClick = sinon.spy();
                reassign = sinon.spy();
                editAssignmentPriority = sinon.spy();
                completeAssignment = sinon.spy();
                startWorking = sinon.spy();
                removeAssignment = sinon.spy();
                onDoubleClick = sinon.spy();
                revertAssignment = sinon.spy();
            });

            it('show item', () => {
                const wrapper = getShallowWrapper();

                expect(wrapper.find('.icon-time').length).toBe(1);
                expect(wrapper.find('UserAvatar').length).toBe(1);
                expect(wrapper.find('AbsoluteDate').length).toBe(1);
            });

            it('executes `onClick` callback', () => {
                const assignmentItem = cloneDeep(assignment);

                onClick = sinon.spy((arg) => {
                    expect(arg).toEqual(assignmentItem);
                    return Promise.resolve();
                });

                const wrapper = getMountedWrapper();
                const item = wrapper.find('.sd-list-item').first();

                item.simulate('click');
            });

            it('does not show red border if assignment is not locked', () => {
                lockedItems = null;
                const wrapper = getMountedWrapper();

                expect(wrapper.find(List.Border).props().state).toEqual(null);
            });

            it('shows red border if assignment is locked', () => {
                const wrapper = getMountedWrapper();

                expect(wrapper.find(List.Border).props().state).toEqual('locked');
            });

            it('displays tooltip for priority', () => {
                const wrapper = getMountedWrapper();
                const priorityNode = wrapper.find('.priority-label').first();

                expect(priorityNode.prop('data-sd-tooltip')).toBe('Priority: Medium');
            });

            it('ActionMenu executes prop functions', () => {
                const executeItemAction = (actionLabel) => {
                    const wrapper = getMountedWrapper();
                    const menu = new helpers.actionMenu(wrapper);

                    menu.invokeAction(actionLabel);
                };

                lockedItems = null;

                expect(reassign.callCount).toBe(0);
                executeItemAction('Reassign');
                expect(reassign.callCount).toBe(1);
                expect(reassign.args[0][0]).toEqual(assignment);

                expect(editAssignmentPriority.callCount).toBe(0);
                executeItemAction('Edit Priority');
                expect(editAssignmentPriority.callCount).toBe(1);
                expect(editAssignmentPriority.args[0][0]).toEqual(assignment);

                expect(removeAssignment.callCount).toBe(0);
                executeItemAction('Remove Assignment');
                expect(removeAssignment.callCount).toBe(1);
                expect(removeAssignment.args[0][0]).toEqual(assignment);

                assignment.assigned_to.state = 'in_progress';
                expect(completeAssignment.callCount).toBe(0);
                executeItemAction('Complete Assignment');
                expect(completeAssignment.callCount).toBe(1);
                expect(completeAssignment.args[0][0]).toEqual(assignment);

                assignment.assigned_to = {
                    user: 'ident1',
                    state: 'assigned',
                };
                assignment.planning.g2_content_type = 'text';
                expect(startWorking.callCount).toBe(0);
                executeItemAction('Start Working');
                expect(startWorking.callCount).toBe(1);
                expect(startWorking.args[0][0]).toEqual(assignment);

                assignment.item_ids = ['item1'];
                expect(onDoubleClick.callCount).toBe(0);
                executeItemAction('Open Coverage');
                expect(onDoubleClick.callCount).toBe(1);
                expect(onDoubleClick.args[0]).toEqual([]);

                assignment.assigned_to = {
                    user: 'ident1',
                    state: 'completed',
                };
                assignment.planning.g2_content_type = 'live_video';
                expect(revertAssignment.callCount).toBe(0);
                executeItemAction('Revert Availability');
                expect(revertAssignment.callCount).toBe(1);
                expect(revertAssignment.args[0][0]).toEqual(assignment);
            });
        });
    });
});
