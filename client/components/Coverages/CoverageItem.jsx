import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {Item, Column, Row, Border, ActionMenu} from '../UI/List';
import {StateLabel, InternalNoteLabel} from '../../components';
import {CoverageIcon} from './CoverageIcon';

import {
    getCreator,
    getItemInArrayById,
    getDateTimeString,
    gettext,
    stringUtils,
    planningUtils,
} from '../../utils';
import {UserAvatar} from '../UserAvatar';
import {WORKFLOW_STATE} from '../../constants';

export const CoverageItem = ({
    item,
    index,
    coverage,
    users,
    desks,
    dateFormat,
    timeFormat,
    contentTypes,
    itemActionComponent,
    isPreview,
    active,
}) => {
    const userAssigned = getCreator(coverage, 'assigned_to.user', users);
    const deskAssigned = getItemInArrayById(desks, get(coverage, 'assigned_to.desk'));
    const coverageDate = get(coverage, 'planning.scheduled');
    const coverageDateText = !coverageDate ? 'Not scheduled yet' :
        getDateTimeString(coverageDate, dateFormat, timeFormat);
    const coverageInWorkflow = planningUtils.isCoverageInWorkflow(coverage);
    const displayContentType = [
        stringUtils.firstCharUpperCase(get(coverage, 'planning.g2_content_type', '').replace('_', ' ')),
    ];
    const genre = stringUtils.firstCharUpperCase(get(coverage, 'planning.genre.name', ''));

    if (genre) {
        displayContentType.push(`/${genre}`);
    }

    return (
        <Item noBg={!active} activated={active}>
            <Border/>
            {!isPreview && <Column border={false}>
                {userAssigned ? (
                    <UserAvatar
                        user={userAssigned}
                        small={false}
                        showInactive
                    />
                ) : (
                    <UserAvatar
                        empty={true}
                        noMargin={true}
                        initials={false}
                        small={false}
                    />
                )}
            </Column>}
            <Column grow={true} border={false}>
                <Row paddingBottom>
                    <CoverageIcon coverage={coverage} dateFormat={dateFormat} timeFormat={timeFormat}
                        users={users} desks={desks} contentTypes={contentTypes}/>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {displayContentType.join('')}
                    </span>
                    <time>
                        <InternalNoteLabel item={coverage} prefix="planning." marginRight={true} />
                        <i className="icon-time"/>
                        {coverageDateText}
                    </time>
                </Row>
                <Row>
                    {!userAssigned && !deskAssigned && (
                        <span className="sd-list-item__text-label sd-list-item__text-label--normal
                            sd-overflow-ellipsis sd-list-item--element-grow">
                            {gettext('Unassigned')}
                        </span>
                    )}

                    {deskAssigned && (
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                {gettext('Desk: ')}
                            </span>
                            {get(deskAssigned, 'name')}
                        </span>
                    )}

                    <span className="grid">
                        <InternalNoteLabel
                            item={item}
                            prefix={`coverages[${index}].planning.`}
                            noteField="workflow_status_reason"
                            showTooltip
                            stateField = {coverage.workflow_status === WORKFLOW_STATE.CANCELLED ?
                                `coverages[${index}].workflow_status` : 'state'}
                            showHeaderText={false} />
                        <StateLabel
                            item={coverageInWorkflow ? get(coverage, 'assigned_to', {}) : coverage }
                            fieldName={coverageInWorkflow ? 'state' : 'workflow_status'} />
                    </span>
                </Row>
                <Row>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {userAssigned && (
                            <span>
                                <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                    {gettext('Assignee: ')}
                                </span>
                                {get(userAssigned, 'display_name', '')}
                            </span>
                        )}
                    </span>
                </Row>
            </Column>
            {itemActionComponent && <ActionMenu>
                {itemActionComponent}
            </ActionMenu>}
        </Item>
    );
};

CoverageItem.propTypes = {
    coverage: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    onDuplicateCoverage: PropTypes.func,
    onCancelCoverage: PropTypes.func,
    itemActionComponent: PropTypes.node,
    contentTypes: PropTypes.array,
    isPreview: PropTypes.bool,
    active: PropTypes.bool,
    item: PropTypes.object,
    index: PropTypes.number,
};

CoverageItem.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    isPreview: false,
};
