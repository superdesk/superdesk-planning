import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import moment from 'moment';

import {assignmentUtils, planningUtils, gettext, stringUtils} from '../../../utils';

import {Column} from '../../UI/List';
import {ContentBlock, ContentBlockInner, Tools} from '../../UI/SidePanel';
import {
    AbsoluteDate,
    PriorityLabel,
    StateLabel,
    Datetime,
    AuditInformation,
    ItemActionsMenu,
} from '../../';
import {UserAvatar} from '../../../components/UserAvatar';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';
import {IconButton, Label, Spacer, Tooltip} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../../superdeskApi';
import {assignmentFieldsConfig} from '../../Coverages/assignmentFieldsConfig';

export const AssignmentPreviewHeader = ({
    assignment,
    planning,
    priorities,
    itemActions,
    users,
    desks,
    hideAvatar,
    hideItemActions,
    contentTypes,
}) => {
    const {
        assignedTo,
        createdBy,
        creationDate,
        updatedDate,
        versionCreator,
        assignedUser,
        deskAssignor,
        userAssignor,
        deskAssignorName,
        userAssignorName,
        assignedDateDesk,
        assignedDateUser,
        assignedUserName,
        assignedDeskName,
        coverageProvider,
    } = assignmentUtils.getAssignmentInfo(assignment, users, desks);

    const planningSchedule = get(assignment, 'planning.scheduled');
    const coverageIcon = planningUtils.getCoverageIcon(planningUtils.getCoverageContentType(
        assignment, contentTypes) || get(assignment, 'planning.g2_content_type'), assignment);
    const isAccepted = get(assignment, 'accepted');

    return (
        <div>
            <ContentBlock className="AssignmentPreview__audit" padSmall={true} flex={true}>
                <ContentBlockInner grow={true}>
                    <AuditInformation
                        createdBy={createdBy}
                        updatedBy={versionCreator}
                        createdAt={creationDate}
                        updatedAt={updatedDate}
                    />
                </ContentBlockInner>
                {get(itemActions, 'length') > 0 && !hideItemActions &&
                    <div><ItemActionsMenu actions={itemActions} /></div>
                }
            </ContentBlock>
            <Tools className="AssignmentPreview__toolbar" topTools={true}>
                <Spacer h gap="4" justifyContent="start" noWrap>
                    {hideAvatar !== true && (
                        <Column border={false}>
                            <UserAvatar
                                user={assignedUser}
                                size="large"
                            />
                        </Column>
                    )}
                    <Spacer v gap="4" noWrap>
                        <Spacer gap="4" h justifyContent="start" noWrap>
                            {gettext('Id: {{id}}', {id: assignment._id})}
                            <IconButton
                                size="small"
                                icon="copy"
                                ariaValue={gettext('Copy assignment Id')}
                                onClick={() => {
                                    navigator.clipboard.writeText(assignment._id);
                                    superdeskApi.ui.notify.success(gettext('Copied to clipboard'));
                                }}
                            />
                        </Spacer>
                        <Spacer h gap="4" justifyContent="start" noWrap>
                            <span className="sd-list-item__normal">
                                {gettext('Desk:')}
                            </span>
                            <span className="sd-list-item__strong">
                                {assignedDeskName}
                            </span>
                        </Spacer>
                        <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                            {deskAssignor && (
                                <span>
                                    {gettext('Assigned by {{name}}', {name: deskAssignorName})},
                                            &nbsp;<Datetime date={assignedDateDesk} />
                                </span>
                            )}
                        </span>
                        <Spacer h gap="4" justifyContent="start" noWrap>
                            <span className="sd-list-item__normal">
                                {gettext('Assigned:')}
                            </span>
                            <span className="sd-list-item__strong">
                                {assignedUserName}
                            </span>
                        </Spacer>

                        <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                            {userAssignor && (
                                <span>
                                    {gettext('Assigned by {{name}}', {name: userAssignorName})} &nbsp;
                                    <Datetime date={assignedDateUser} />
                                </span>
                            )}
                        </span>

                        {(assignmentFieldsConfig.coverageProvider && coverageProvider) && (
                            <Spacer h gap="4" justifyContent="start" noWrap>
                                <span className="sd-list-item__normal">
                                    {gettext('Coverage Provider:')}
                                </span>
                                <span className="sd-list-item__strong">
                                    {coverageProvider}
                                </span>
                            </Spacer>
                        )}
                        <Spacer h gap="4" justifyContent="start" noWrap>
                            <span className="sd-list-item__normal">
                                {gettext('Due:')}
                            </span>
                            <AbsoluteDate
                                date={moment(planningSchedule).format()}
                                noDateString={gettext('\'not scheduled yet\'')}
                                toBeConfirmed={get(assignment, `planning.${TO_BE_CONFIRMED_FIELD}`)}
                            />
                        </Spacer>
                        <Spacer h gap="4" alignItems="start" justifyContent="start" noWrap>
                            <Tooltip
                                text={gettext('Type: {{type}}', {
                                    type: stringUtils.firstCharUpperCase(
                                        get(planning, 'g2_content_type', '').replace('_', ' ')),
                                })}
                                flow="right"
                            >
                                <i
                                    className={classNames('sd-list-item__inline-icon',
                                        coverageIcon)}
                                />
                            </Tooltip>

                            {assignmentFieldsConfig.assignmentPriority && (
                                <PriorityLabel
                                    item={assignment}
                                    priorities={priorities}
                                    tooltipFlow="right"
                                    inline={true}
                                />
                            )}

                            <StateLabel
                                item={assignedTo}
                                inline={true}
                            />
                            {isAccepted && <Label type="highlight" text={gettext('Accepted')} /> }
                        </Spacer>
                    </Spacer>
                </Spacer>
            </Tools>
        </div>
    );
};

AssignmentPreviewHeader.propTypes = {
    assignment: PropTypes.object,
    planning: PropTypes.object,
    priorities: PropTypes.array,
    itemActions: PropTypes.array,
    users: PropTypes.array,
    desks: PropTypes.array,
    hideAvatar: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    contentTypes: PropTypes.array,
};
