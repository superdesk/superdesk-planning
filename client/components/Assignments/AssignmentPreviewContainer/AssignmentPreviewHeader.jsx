import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';
import moment from 'moment';

import {assignmentUtils, planningUtils, gettext, stringUtils} from '../../../utils';

import {Item, Column, Row} from '../../UI/List';
import {ContentBlock, ContentBlockInner, Tools} from '../../UI/SidePanel';
import {
    UserAvatar,
    AbsoluteDate,
    PriorityLabel,
    StateLabel,
    Datetime,
    AuditInformation,
    ItemActionsMenu,
    Label,
} from '../../';
import {TO_BE_CONFIRMED_FIELD} from '../../../constants';

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
                <div>
                    <Item noBg={true} noHover={true}>
                        {
                            hideAvatar === true ? null : (
                                <Column border={false}>
                                    <UserAvatar
                                        user={assignedUser}
                                        large={true}
                                        noMargin={true}
                                        initials={false}
                                        showInactive
                                    />
                                </Column>
                            )
                        }
                        <Column border={false}>
                            <Row margin={false}>
                                <span className="sd-list-item__normal">
                                    {gettext('Desk:')}
                                </span>
                                <span className="sd-list-item__strong">
                                    {assignedDeskName}
                                </span>
                            </Row>
                            <Row margin={false}>
                                <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                    {deskAssignor && (
                                        <span>
                                            {gettext('Assigned by {{name}}', {name: deskAssignorName})},
                                            &nbsp;<Datetime date={assignedDateDesk} />
                                        </span>
                                    )}
                                </span>
                            </Row>
                            <Row margin={false}>
                                <span className="sd-list-item__normal">
                                    {gettext('Assigned:')}
                                </span>
                                <span className="sd-list-item__strong">
                                    {assignedUserName}
                                </span>
                            </Row>
                            <Row margin={false}>
                                <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                    {userAssignor && (
                                        <span>
                                            {gettext('Assigned by {{name}}', {name: userAssignorName})},
                                            &nbsp;<Datetime date={assignedDateUser} />
                                        </span>
                                    )}
                                </span>
                            </Row>
                            {coverageProvider && (
                                <Row margin={false}>
                                    <span className="sd-list-item__normal">
                                        {gettext('Coverage Provider:')}
                                    </span>
                                    <span className="sd-list-item__strong">
                                        {coverageProvider}
                                    </span>
                                </Row>
                            )}
                            <Row marginTop={true}>
                                <span className="sd-list-item__normal">
                                    {gettext('Due:')}
                                </span>
                                <AbsoluteDate
                                    date={moment(planningSchedule).format()}
                                    noDateString={gettext('\'not scheduled yet\'')}
                                    toBeConfirmed={get(assignment, `planning.${TO_BE_CONFIRMED_FIELD}`)}
                                />
                            </Row>
                            <Row marginTop={true}>
                                <span
                                    data-sd-tooltip={
                                        gettext('Type: {{type}}', {
                                            type: stringUtils.firstCharUpperCase(
                                                get(planning, 'g2_content_type', '').replace('_', ' ')),
                                        })
                                    }
                                    data-flow="right"
                                >
                                    <i
                                        className={classNames('sd-list-item__inline-icon',
                                            coverageIcon)}
                                    />
                                </span>
                                <PriorityLabel
                                    item={assignment}
                                    priorities={priorities}
                                    tooltipFlow="right"
                                    inline={true}
                                />
                                <StateLabel
                                    item={assignedTo}
                                    inline={true}
                                />
                                {isAccepted && <Label iconType="highlight" text={gettext('Accepted')} /> }
                            </Row>
                        </Column>
                    </Item>
                </div>
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
