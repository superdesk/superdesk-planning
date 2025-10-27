import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';
import {IPlanningCoverageItem, ICoverageScheduledUpdate, ILockedItems} from '../../../interfaces';
import {IArticle, IDesk, IUser} from 'superdesk-api';
import {getCreator, getItemInArrayById, gettext, onEventCapture} from '../../../utils';
import {Item, Border, Column, Row as ListRow} from '../../UI/List';
import {UserAvatar} from '../../../components/UserAvatar';
import {StateLabel} from '../../StateLabel';
import * as actions from '../../../actions';
import {ASSIGNMENTS} from '../../../constants/assignments';
import * as selectors from '../../../selectors';
import {Button} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../../superdeskApi';

interface IOwnProps {
    field: string;
    value: IPlanningCoverageItem | ICoverageScheduledUpdate;
    users: Array<IUser>;
    desks: Array<IDesk>;
    readOnly?: boolean;
    addNewsItemToPlanning?: IArticle;
    onChange(field: string, value: any): void;
    onFocus?(): void;
    coverages: Array<IPlanningCoverageItem>;
}

interface IReduxDispatchProps {
    showEditCoverageAssignmentModal(props: {
        field: string;
        value: IPlanningCoverageItem | ICoverageScheduledUpdate;
        disableDeskSelection: boolean;
        disableUserSelection: boolean;
        priorityPrefix: string;
        onChange(field: string, value: any): void;
    }): void;
}

interface IReduxStateProps {
    lockedItems: ILockedItems;
}

type IProps = IReduxDispatchProps & IReduxStateProps & IOwnProps;

const mapDispatchToProps = (dispatch) => ({
    showEditCoverageAssignmentModal: (props) => dispatch(
        actions.assignments.ui.showEditCoverageAssignmentModal(props)
    ),
});

const mapStateToProps = (state) => ({
    lockedItems: selectors.locks.getLockedItems(state),
});

class CoverageFormHeaderComponent extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.showAssignmentModal = this.showAssignmentModal.bind(this);
        this.removeAssignment = this.removeAssignment.bind(this);
    }

    showAssignmentModal(event) {
        onEventCapture(event);

        this.props.showEditCoverageAssignmentModal({
            field: this.props.field,
            value: this.props.value,
            onChange: this.props.onChange,
            disableDeskSelection: this.props.addNewsItemToPlanning != null || (
                this.props.value.assigned_to?.state != null
                && ![
                    ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED,
                    ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED,
                ].includes(this.props.value.assigned_to.state)
            ),
            disableUserSelection: this.props.addNewsItemToPlanning != null,
            priorityPrefix: 'assigned_to.',
        });
    }

    removeAssignment() {
        const {value} = this.props;

        const remove = () => {
            const coveragesWithoutUpdated =
                this.props.coverages.filter((x) => x.coverage_id !== value.coverage_id);

            this.props.onChange(
                'coverages',
                [
                    ...coveragesWithoutUpdated,
                    {
                        ...this.props.value,
                        workflow_status: 'draft',
                        assigned_to: {},
                        add_coverage_to_workflow: false,
                    },
                ],
            );
        };

        /**
         * If a coverage is in a workflow, we can't remove `assigned_to` right away,
         * first the respective assignment entity has to be removed.
         */
        if (value.workflow_status === 'draft' || value.workflow_status === 'cancelled') {
            remove();
        } else {
            superdeskApi.ui.confirm(
                superdeskApi.localization.gettext('This will also remove linked assignments if any')
            ).then((confirmed) => {
                if (confirmed === true) {
                    remove();
                }
            });
        }
    }

    renderAssignmentFunctionButtons() {
        const {
            value,
            addNewsItemToPlanning,
            readOnly,
            lockedItems,
        } = this.props;

        if (addNewsItemToPlanning != null
            || (value as ICoverageScheduledUpdate).scheduled_update_id != null
            || readOnly === true
        ) {
            return null;
        }

        const assignmentState = value.assigned_to?.state;
        const isAssignmentLocked = lockedItems?.assignment
            && value.assigned_to?.assignment_id in lockedItems.assignment;
        const buttonsDisabled = [
            ASSIGNMENTS.WORKFLOW_STATE.COMPLETED,
            ASSIGNMENTS.WORKFLOW_STATE.CANCELLED,
        ].includes(assignmentState) || isAssignmentLocked;

        let reassignTooltip: string | null = null;
        let removeTooltip: string | null = null;

        if (assignmentState === ASSIGNMENTS.WORKFLOW_STATE.COMPLETED) {
            reassignTooltip = gettext('Assignment has been completed, unable to reassign');
            removeTooltip = gettext('Assignment has been completed, unable to remove');
        } else if (assignmentState === ASSIGNMENTS.WORKFLOW_STATE.CANCELLED) {
            reassignTooltip = gettext('Assignment has been cancelled, unable to reassign');
            removeTooltip = gettext('Assignment has been cancelled, unable to remove');
        } else if (isAssignmentLocked) {
            reassignTooltip = gettext('Assignment is locked, unable to reassign');
            removeTooltip = gettext('Assignment is locked, unable to remove');
        }

        return (
            <Column>
                <ListRow>
                    <Button
                        text={gettext('Reassign')}
                        onClick={this.showAssignmentModal}
                        style="hollow"
                        size="small"
                        expand
                        disabled={buttonsDisabled}
                        tooltip={reassignTooltip}
                    />
                </ListRow>
                <ListRow>
                    <Button
                        text={gettext('Remove')}
                        onClick={this.removeAssignment}
                        style="hollow"
                        size="small"
                        expand
                        disabled={buttonsDisabled}
                        tooltip={removeTooltip}
                    />
                </ListRow>
            </Column>
        );
    }

    render() {
        const {
            field,
            value,
            users,
            desks,
            readOnly,
        } = this.props;

        const userAssigned = getCreator(value, 'assigned_to.user', users);
        const deskAssigned = getItemInArrayById(desks, value.assigned_to?.desk);
        const coverageProvider = value.assigned_to?.coverage_provider;
        const assignmentState = value.assigned_to?.state;
        const cancelled = value.workflow_status === ASSIGNMENTS.WORKFLOW_STATE.CANCELLED;

        if (!deskAssigned && !userAssigned && !coverageProvider) {
            return (
                <Item noBg={true} noHover={true}>
                    <Border />
                    <Column border={false}>
                        <UserAvatar
                            user={null}
                            size="large"
                        />
                    </Column>
                    <Column grow={true} border={false}>
                        <ListRow>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                    {gettext('Unassigned')}
                                </span>
                            </span>
                        </ListRow>
                        {!cancelled && !readOnly && (
                            <ListRow>
                                <Button
                                    id="editAssignment"
                                    text={gettext('Assign')}
                                    onClick={this.showAssignmentModal}
                                    size="small"
                                    type="primary"
                                />
                            </ListRow>
                        )}
                    </Column>
                </Item>
            );
        }

        return (
            <Item noBg={true} noHover={true}>
                <Border />
                <Column border={false}>
                    <UserAvatar
                        user={userAssigned == null || typeof userAssigned === 'string' ? null : userAssigned}
                        size="large"
                    />
                </Column>
                <Column grow={true} border={false}>
                    {deskAssigned && (
                        <ListRow>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                    {gettext('Desk:')}
                                </span>
                                <span key={`${field}.assigned_to.desk`}>
                                    {get(deskAssigned, 'name', '')}
                                </span>
                            </span>
                        </ListRow>
                    )}
                    {userAssigned && (
                        <ListRow>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                    {gettext('Assignee:')}
                                </span>
                                <span key={`${field}.assigned_to.user`}>
                                    {get(userAssigned, 'display_name', '')}
                                </span>
                            </span>
                        </ListRow>
                    )}
                    {coverageProvider && (
                        <ListRow>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                    {gettext('Coverage Provider: ')}
                                </span>
                                {get(coverageProvider, 'name', '')}
                            </span>
                        </ListRow>
                    )}
                    {assignmentState && (
                        <ListRow>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <StateLabel
                                    id={`${field}.assigned_to.state`}
                                    item={get(value, 'assigned_to', {})}
                                />
                            </span>
                        </ListRow>
                    )}
                </Column>
                {this.renderAssignmentFunctionButtons()}
            </Item>
        );
    }
}

export const CoverageFormHeader = connect<IReduxStateProps, IReduxDispatchProps, IOwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(CoverageFormHeaderComponent);
