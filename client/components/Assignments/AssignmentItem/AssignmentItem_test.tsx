import React from 'react';
import {mount} from 'enzyme';
import {AssignmentItem} from './index';
import sinon from 'sinon';
import {createTestStore} from '../../../utils';
import {List} from '../../UI';
import {Provider} from 'react-redux';
import {cloneDeep, noop} from 'lodash';
import {AbsoluteDate} from '../../AbsoluteDate';
import {UserAvatarWithMargin} from '../../UserAvatar';

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
            let user = {
                _id: 'user1',
                display_name: 'Foo Bar',
                first_name: 'Foo',
                last_name: 'Bar',
            };
            let contentTypes = [{qcode: 'text'}];

            let [
                reassign,
                revertAssignment,
                editAssignmentPriority,
                startWorking,
                onDoubleClick,
                completeAssignment,
            ] = Array(7).fill(() => true);

            const getMountedWrapper = () => {
                const store = createTestStore({});

                return mount(
                    <Provider store={store}>
                        <AssignmentItem
                            onClick={onClick}
                            onDoubleClick={onDoubleClick}
                            assignment={assignment}
                            currentAssignmentId={assignment._id}
                            lockedItems={lockedItems}
                            priorities={
                                store.getState().vocabularies
                                    .assignment_priority
                            }
                            reassign={reassign}
                            editAssignmentPriority={editAssignmentPriority}
                            completeAssignment={completeAssignment}
                            startWorking={startWorking}
                            revertAssignment={revertAssignment}
                            privileges={privileges}
                            session={session}
                            inAssignments={true}
                            assignedUser={user}
                            isCurrentUser={false}
                            contentTypes={contentTypes}
                            removeAssignment={noop}
                        />
                    </Provider>
                );
            };

            beforeEach(() => {
                lockedItems = {assignment: {as1: 'lock_information'}};
                assignment = {
                    _id: 'as1',
                    _created: '2017-07-13T13:55:41+0000',
                    _updated: '2017-07-28T11:16:36+0000',
                    planning: {scheduled: '2017-07-28T11:16:36+0000'},
                    assigned_to: {
                        assigned_date: '2017-07-28T11:16:36+0000',
                        desk: 'desk1',
                        state: 'assigned',
                        user: 'user1',
                    },
                    priority: 2,
                };

                onClick = sinon.spy();
                reassign = sinon.spy();
                editAssignmentPriority = sinon.spy();
                completeAssignment = sinon.spy();
                startWorking = sinon.spy();
                onDoubleClick = sinon.spy();
                revertAssignment = sinon.spy();
            });

            it('show item', () => {
                const wrapper = getMountedWrapper();

                expect(wrapper.find('.icon-time').length).toBe(1);
                expect(wrapper.find(UserAvatarWithMargin).length).toBe(1);
                expect(wrapper.find(AbsoluteDate).length).toBe(1);
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

                expect(wrapper.find(List.Border).props().state).toEqual(false);
            });

            it('shows red border if assignment is locked', () => {
                const wrapper = getMountedWrapper();

                expect(wrapper.find(List.Border).props().state).toEqual(
                    'locked'
                );
            });

            it('displays tooltip for priority', () => {
                const wrapper = getMountedWrapper();
                const priorityNode = wrapper.find('.priority-label').first();

                expect(priorityNode.prop('data-sd-tooltip')).toBe(
                    'Priority: {{ name }}'
                );
            });
        });
    });
});
