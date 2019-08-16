import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {getCreator, getItemInArrayById, gettext, planningUtils, onEventCapture} from '../../../utils';
import {Item, Border, Column, Row as ListRow} from '../../UI/List';
import {Button} from '../../UI';
import {UserAvatar} from '../../';
import {AssignmentPopup} from '../../Assignments';
import {StateLabel} from '../../../components';

export class CoverageFormHeader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {popupOpen: false};

        this.togglePopup = this.togglePopup.bind(this);
    }

    togglePopup(event) {
        onEventCapture(event);
        this.setState({popupOpen: !this.state.popupOpen});

        if (this.props.onFocus) {
            this.props.onFocus(this.props.field);
        }
    }

    render() {
        const {
            field,
            value,
            onChange,
            users,
            desks,
            coverageProviders,
            priorities,
            addNewsItemToPlanning,
            onRemoveAssignment,
            readOnly,
            popupContainer,
            onPopupOpen,
            onPopupClose,
            setCoverageDefaultDesk,
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
                    <Border/>
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
                        {!cancelled && !readOnly && (<ListRow>
                            <Button
                                id="editAssignment"
                                text={gettext('Assign')}
                                tabIndex={0}
                                enterKeyIsClick
                                className="btn btn--primary btn--small"
                                onClick={this.togglePopup}
                                autoFocus
                            />
                        </ListRow>)}
                    </Column>
                    {this.state.popupOpen && (
                        <AssignmentPopup
                            field={field}
                            value={value}
                            onChange={onChange}
                            users={users}
                            desks={desks}
                            coverageProviders={coverageProviders}
                            priorities={priorities}
                            onClose={this.togglePopup}
                            target="btn--primary"
                            priorityPrefix="assigned_to."
                            popupContainer={popupContainer}
                            onPopupOpen={onPopupOpen}
                            onPopupClose={onPopupClose}
                            setCoverageDefaultDesk={setCoverageDefaultDesk}
                        />
                    )}
                </Item>
            );
        }

        return (
            <Item noBg={true} noHover={true}>
                <Border/>
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
                    {assignmentState &&
                        <ListRow>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <StateLabel
                                    id={`${field}.assigned_to.state`}
                                    item={get(value, 'assigned_to', {})}/>
                            </span>
                        </ListRow>
                    }
                </Column>
                {canEditAssignment && !readOnly && (
                    <Column>
                        <ListRow>
                            <Button
                                text={gettext('Reassign')}
                                className="btn btn--hollow btn--small"
                                onClick={this.togglePopup}
                                tabIndex={0}
                                enterKeyIsClick
                                disabled={!!addNewsItemToPlanning}
                                autoFocus />
                        </ListRow>
                        <ListRow>
                            <Button
                                text={gettext('Remove')}
                                className="btn btn--hollow btn--small"
                                onClick={onRemoveAssignment}
                                tabIndex={0}
                                enterKeyIsClick
                                disabled={!!addNewsItemToPlanning}
                                autoFocus />
                        </ListRow>
                    </Column>
                )}
                {this.state.popupOpen && (
                    <AssignmentPopup
                        field={field}
                        value={value}
                        onChange={onChange}
                        users={users}
                        desks={desks}
                        coverageProviders={coverageProviders}
                        priorities={priorities}
                        onClose={this.togglePopup}
                        target="btn--hollow"
                        priorityPrefix="assigned_to."
                        disableDeskSelection={!!addNewsItemToPlanning}
                        disableUserSelection={!!addNewsItemToPlanning}
                        popupContainer={popupContainer}
                        setCoverageDefaultDesk={setCoverageDefaultDesk}
                    />
                )}
            </Item>
        );
    }
}

CoverageFormHeader.propTypes = {
    field: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    users: PropTypes.array,
    desks: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    readOnly: PropTypes.bool,
    addNewsItemToPlanning: PropTypes.object,
    onFocus: PropTypes.func,
    onRemoveAssignment: PropTypes.func,
    popupContainer: PropTypes.func,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    setCoverageDefaultDesk: PropTypes.func,
};
