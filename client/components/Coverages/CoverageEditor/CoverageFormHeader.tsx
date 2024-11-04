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
import {planningUtils} from '../../../utils';
import {Button} from 'superdesk-ui-framework/react';

interface IProps {
    field: string;
    value: IPlanningCoverageItem | ICoverageScheduledUpdate;
    users: Array<IUser>;
    desks: Array<IDesk>;
    readOnly?: boolean;
    addNewsItemToPlanning?: IArticle;
    onChange(field: string, value: any): void;
    onFocus?(): void;
    onRemoveAssignment?(): Promise<void>;
    setCoverageDefaultDesk(coverage: IPlanningCoverageItem | ICoverageScheduledUpdate): void;
    showEditCoverageAssignmentModal(props: {
        field: string;
        value: IPlanningCoverageItem | ICoverageScheduledUpdate;
        disableDeskSelection: boolean;
        disableUserSelection: boolean;
        priorityPrefix: string;
        onChange(field: string, value: any): void;
        setCoverageDefaultDesk(coverage: IPlanningCoverageItem | ICoverageScheduledUpdate): void;
    }): void;
    lockedItems: ILockedItems;
}

const mapDispatchToProps = (dispatch) => ({
    showEditCoverageAssignmentModal: (props) => dispatch(
        actions.assignments.ui.showEditCoverageAssignmentModal(props)
    ),
});

const mapStateToProps = (state) => ({
    lockedItems: selectors.locks.getLockedItems(state),
});

export class CoverageFormHeaderComponent extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);
        this.showAssignmentModal = this.showAssignmentModal.bind(this);
    }

    showAssignmentModal(event) {
        onEventCapture(event);

        this.props.showEditCoverageAssignmentModal({
            field: this.props.field,
            value: this.props.value,
            onChange: this.props.onChange,
            disableDeskSelection: !!this.props.addNewsItemToPlanning,
            disableUserSelection: !!this.props.addNewsItemToPlanning,
            setCoverageDefaultDesk: this.props.setCoverageDefaultDesk,
            priorityPrefix: 'assigned_to.',
        });
    }

    render() {
        const {
            field,
            value,
            users,
            desks,
            addNewsItemToPlanning,
            onRemoveAssignment,
            readOnly,
            lockedItems,
        } = this.props;

        const userAssigned = getCreator(value, 'assigned_to.user', users);
        const deskAssigned = getItemInArrayById(desks, value.assigned_to?.desk);
        const coverageProvider = value.assigned_to?.coverage_provider;
        const assignmentState = value.assigned_to?.state;
        const cancelled = value.workflow_status === ASSIGNMENTS.WORKFLOW_STATE.CANCELLED;

        /*
            Check if:
            1. This view is rendered from AddToPlanning action
            2. There's an already scheduled update for the coverage
        */
        const isAssignmentLocked = lockedItems?.assignment
            && value.assigned_to?.assignment_id in lockedItems.assignment;
        const canEditAssignment = addNewsItemToPlanning == null && !isAssignmentLocked
            && !((value as ICoverageScheduledUpdate).scheduled_update_id);

        if (!deskAssigned && (!userAssigned || !coverageProvider)) {
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
                {canEditAssignment && !readOnly && (
                    <Column>
                        <ListRow>
                            <Button
                                text={gettext('Reassign')}
                                onClick={this.showAssignmentModal}
                                style="hollow"
                                size="small"
                                expand
                            />
                        </ListRow>
                        {onRemoveAssignment != null && (
                            <ListRow>
                                <Button
                                    text={gettext('Remove')}
                                    onClick={() => {
                                        onRemoveAssignment();
                                    }}
                                    style="hollow"
                                    size="small"
                                    expand
                                />
                            </ListRow>
                        )}
                    </Column>
                )}
            </Item>
        );
    }
}

export const CoverageFormHeader = connect(
    mapStateToProps,
    mapDispatchToProps
)(CoverageFormHeaderComponent);
