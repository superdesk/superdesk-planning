import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IPlanningCoverageItem} from '../../../interfaces';
import {IArticle, IDesk, IUser} from 'superdesk-api';

import {getCreator, getItemInArrayById, gettext, planningUtils, onEventCapture} from '../../../utils';
import {Item, Border, Column, Row as ListRow} from '../../UI/List';
import {Button} from '../../UI';
import {UserAvatar} from '../../';
import {StateLabel} from '../../StateLabel';
import * as actions from '../../../actions';

interface IProps {
    field: string;
    value: IPlanningCoverageItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    readOnly?: boolean;
    addNewsItemToPlanning?: IArticle;
    onChange(field: string, value: any): void;
    onFocus?(): void;
    onRemoveAssignment?(): void;
    setCoverageDefaultDesk(coverage: IPlanningCoverageItem): void;
    showEditCoverageAssignmentModal(props: {
        field: string;
        value: IPlanningCoverageItem;
        disableDeskSelection: boolean;
        disableUserSelection: boolean;
        priorityPrefix: string;
        onChange(field: string, value: any): void;
        setCoverageDefaultDesk(coverage: IPlanningCoverageItem): void;
    }): void;
}

const mapDispatchToProps = (dispatch) => ({
    showEditCoverageAssignmentModal: (props) => dispatch(
        actions.assignments.ui.showEditCoverageAssignmentModal(props)
    ),
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
        } = this.props;

        const userAssigned = getCreator(value, 'assigned_to.user', users);
        const deskAssigned = getItemInArrayById(desks, get(value, 'assigned_to.desk'));
        const coverageProvider = get(value, 'assigned_to.coverage_provider');
        const assignmentState = get(value, 'assigned_to.state');
        const cancelled = get(value, 'workflow_status') === 'cancelled';
        const canEditAssignment = planningUtils.isCoverageDraft(value) ||
            (!!addNewsItemToPlanning && !get(value, 'coverage_id') && !get(value, 'scheduled_update_id'));

        if (!deskAssigned && (!userAssigned || !coverageProvider)) {
            return (
                <Item noBg={true} noHover={true}>
                    <Border />
                    <Column border={false}>
                        <UserAvatar
                            empty={true}
                            noMargin={true}
                            large={true}
                            initials={false}
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
                                    tabIndex={0}
                                    enterKeyIsClick
                                    className="btn btn--primary btn--small"
                                    onClick={this.showAssignmentModal}
                                    autoFocus
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
                        user={userAssigned}
                        noMargin={true}
                        large={true}
                        showInactive
                    />
                </Column>
                <Column grow={true} border={false}>
                    <ListRow>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                {gettext('Desk:')}
                            </span>
                            <span name={`${field}.assigned_to.desk`}>
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
                                <span name={`${field}.assigned_to.user`}>
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
                                className="btn btn--hollow btn--small"
                                onClick={this.showAssignmentModal}
                                tabIndex={0}
                                enterKeyIsClick
                                disabled={!!addNewsItemToPlanning}
                                autoFocus
                            />
                        </ListRow>
                        {!onRemoveAssignment ? null : (
                            <ListRow>
                                <Button
                                    text={gettext('Remove')}
                                    className="btn btn--hollow btn--small"
                                    onClick={onRemoveAssignment}
                                    tabIndex={0}
                                    enterKeyIsClick
                                    disabled={!!addNewsItemToPlanning}
                                    autoFocus
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
    null,
    mapDispatchToProps
)(CoverageFormHeaderComponent);
