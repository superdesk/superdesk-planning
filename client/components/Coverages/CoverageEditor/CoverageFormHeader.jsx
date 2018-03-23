import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {getCreator, getItemInArrayById, gettext, planningUtils} from '../../../utils';
import {WORKSPACE} from '../../../constants';
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

    togglePopup() {
        this.setState({popupOpen: !this.state.popupOpen});
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
            currentWorkspace
        } = this.props;

        const userAssigned = getCreator(value, 'assigned_to.user', users);
        const deskAssigned = getItemInArrayById(desks, get(value, 'assigned_to.desk'));
        const coverageProvider = get(value, 'assigned_to.coverage_provider');
        const assignmentState = get(value, 'assigned_to.state');
        const cancelled = get(value, 'workflow_status') === 'cancelled';

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
                        {!cancelled && (<ListRow>
                            <Button
                                text={gettext('Assign')}
                                tabIndex={0}
                                enterKeyIsClick
                                className="btn btn--primary btn--small" onClick={this.togglePopup}
                                autoFocus />
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
                    />
                </Column>
                <Column grow={true} border={false}>
                    <ListRow>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                {gettext('Desk:')}
                            </span>
                            {get(deskAssigned, 'name', '')}
                        </span>
                    </ListRow>
                    <ListRow>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                {gettext('Assignee:')}
                            </span>
                            {get(userAssigned, 'display_name', '')}
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
                                <StateLabel item={get(value, 'assigned_to', {})}/>
                            </span>
                        </ListRow>
                    }
                </Column>
                {planningUtils.isCoverageDraft(value) && (
                    <Column>
                        <Button
                            text={gettext('Reassign')}
                            className="btn btn--hollow btn--small"
                            onClick={this.togglePopup}
                            tabIndex={0}
                            enterKeyIsClick
                            autoFocus />
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
                        disableDeskSelection={currentWorkspace === WORKSPACE.AUTHORING}
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
    currentWorkspace: PropTypes.string
};
