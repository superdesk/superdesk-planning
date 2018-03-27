import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {assignmentUtils, planningUtils, gettext} from '../../../utils';

import {Item, Column, Row} from '../../UI/List';
import {ContentBlock, ContentBlockInner, Tools} from '../../UI/SidePanel';
import {
    UserAvatar,
    AbsoluteDate,
    PriorityLabel,
    StateLabel,
    Datetime,
    AuditInformation,
    ItemActionsMenu
} from '../../';

export const AssignmentPreviewHeader = ({
    assignment,
    planning,
    priorities,
    itemActions,
    users,
    desks,
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
        assignedDeskName
    } = assignmentUtils.getAssignmentInfo(assignment, users, desks);

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
                <div>
                    {get(itemActions, 'length') > 0 && <ItemActionsMenu actions={itemActions}/>}
                </div>
            </ContentBlock>
            <Tools className="AssignmentPreview__toolbar" topTools={true}>
                <div>
                    <Item noBg={true} noHover={true}>
                        <Column border={false}>
                            <UserAvatar
                                user={assignedUser}
                                large={true}
                                noMargin={true}
                                initials={false}
                            />
                        </Column>
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
                                            &nbsp;<Datetime date={assignedDateDesk}/>
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
                                            &nbsp;<Datetime date={assignedDateUser}/>
                                        </span>
                                    )}
                                </span>
                            </Row>
                            <Row marginTop={true}>
                                <span className="sd-list-item__normal">
                                    {gettext('Due:')}
                                </span>
                                <AbsoluteDate
                                    date={get(assignment, 'planning.scheduled', '').toString()}
                                    noDateString={gettext('\'not scheduled yet\'')}
                                />
                            </Row>
                            <Row marginTop={true}>
                                <span
                                    data-sd-tooltip={
                                        gettext('Type: {{type}}', {type: get(planning, 'g2_content_type')})
                                    }
                                    data-flow="down"
                                >
                                    <i
                                        className={classNames(
                                            'sd-list-item__inline-icon',
                                            planningUtils.getCoverageIcon(get(planning, 'g2_content_type'))
                                        )}
                                    />
                                </span>
                                <PriorityLabel
                                    item={assignment}
                                    priorities={priorities}
                                    tooltipFlow="down"
                                    inline={true}
                                />
                                <StateLabel
                                    item={assignedTo}
                                    inline={true}
                                />
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
};
