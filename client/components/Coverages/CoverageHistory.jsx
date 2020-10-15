import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {appConfig} from 'appConfig';

import {COVERAGES, ASSIGNMENTS, HISTORY_OPERATIONS} from '../../constants';
import {stringUtils, historyUtils, getDateTimeString, getItemInArrayById, gettext} from '../../utils';
import {Item, Column, Row, Border} from '../UI/List';
import {ContentBlock} from '../UI/SidePanel';
import {CollapseBox} from '../UI';
import {CoverageIcon} from './index';

export class CoverageHistory extends React.Component {
    getHistoryActionElement(historyItem) {
        let text, action, assignment = '', desk, user, contentType;

        switch (historyItem.operation) {
        case ASSIGNMENTS.HISTORY_OPERATIONS.REASSIGNED:
        case COVERAGES.HISTORY_OPERATIONS.CREATED:
        case COVERAGES.HISTORY_OPERATIONS.CREATED_CONTENT:
        case COVERAGES.HISTORY_OPERATIONS.ASSIGNED:
            contentType = stringUtils.firstCharUpperCase(get(historyItem, 'update.planning.g2_content_type',
                '').replace('_', ' '));
            action = gettext('Coverage of type {{ type }} created', {type: contentType});

            if (historyItem.operation === COVERAGES.HISTORY_OPERATIONS.CREATED_CONTENT) {
                action += gettext(' from content');
            } else if (historyItem.operation === ASSIGNMENTS.HISTORY_OPERATIONS.REASSIGNED) {
                action = gettext('Coverage reassigned');
            } else if (historyItem.operation === COVERAGES.HISTORY_OPERATIONS.ASSIGNED) {
                action = gettext('Coverage assigned');
            }

            if (get(historyItem, 'update.assigned_to.desk')) {
                desk = getItemInArrayById(this.props.desks, historyItem.update.assigned_to.desk);
                user = getItemInArrayById(this.props.users, get(historyItem.update, 'assigned_to.user'));

                assignment = ([ASSIGNMENTS.HISTORY_OPERATIONS.REASSIGNED,
                    COVERAGES.HISTORY_OPERATIONS.ASSIGNED].includes(historyItem.operation) ?
                    gettext(' to \'{{ desk }}\'', {desk: desk.name}) :
                    gettext(' for \'{{ desk }}\'', {desk: desk.name}));

                if (user) {
                    assignment += gettext(' and \'{{ user }}\'', {user: user.display_name});
                }
            }
            text = action + assignment;
            break;

        case COVERAGES.HISTORY_OPERATIONS.DELETED:
            text = gettext('Coverage removed');
            break;

        case HISTORY_OPERATIONS.PLANNING_CANCEL:
            text = gettext('Planning cancelled');
            break;

        case HISTORY_OPERATIONS.EVENTS_CANCEL:
            text = gettext('Event cancelled');
            break;

        case COVERAGES.HISTORY_OPERATIONS.EDITED:
            text = gettext('Coverage edited');
            break;

        case COVERAGES.HISTORY_OPERATIONS.CANCELLED:
            text = gettext('Coverage cancelled');
            break;

        case ASSIGNMENTS.HISTORY_OPERATIONS.CONTENT_LINK:
            text = gettext('Content linked to coverage');
            break;

        case ASSIGNMENTS.HISTORY_OPERATIONS.UNLINK:
        case ASSIGNMENTS.HISTORY_OPERATIONS.SPIKE_UNLINK:
            text = gettext('Content unlinked');
            break;

        case ASSIGNMENTS.HISTORY_OPERATIONS.EDIT_PRIORITY:
            text = gettext('Coverage priority modified');
            break;

        case ASSIGNMENTS.HISTORY_OPERATIONS.ADD_TO_WORKFLOW:
            text = gettext('Coverage added to workflow');
            break;

        case ASSIGNMENTS.HISTORY_OPERATIONS.CONFIRM:
            text = gettext('Coverage availability confirmed');
            break;

        case ASSIGNMENTS.HISTORY_OPERATIONS.REVERT:
            text = gettext('Coverage availability reverted');
            break;

        case ASSIGNMENTS.HISTORY_OPERATIONS.ASSIGNMENT_REMOVED:
            text = gettext('Assignment removed');
            break;

        case ASSIGNMENTS.HISTORY_OPERATIONS.START_WORKING:
            text = gettext('Work started on coverage');
            break;

        case ASSIGNMENTS.HISTORY_OPERATIONS.COMPLETE:
            text = gettext('Coverage completed');
            break;
        }

        return historyUtils.getHistoryRowElement(text, historyItem, this.props.users);
    }

    getHistoryItemEditedFields(historyItem) {
        // List updated fields as comma separated
        let fields = Object.keys(get(historyItem.update, 'planning', {})).map((field) => field)
            .join(', ');

        if (historyItem.update.news_coverage_status) {
            fields += ', news_coverage_status';
        }
        return (<span>&nbsp;{fields}</span>);
    }

    render() {
        const {historyData, users, desks, contentTypes} = this.props;
        const coverage = get((historyData.items || []).find((item) =>
            [COVERAGES.HISTORY_OPERATIONS.CREATED, COVERAGES.HISTORY_OPERATIONS.CREATED_CONTENT].includes(
                item.operation)), 'update');

        if (!coverage) {
            return null;
        }

        const coverageDateText = !get(historyData, 'planning.scheduled') ?
            gettext('Not scheduled') :
            getDateTimeString(
                historyData.planning.scheduled,
                appConfig.planning.dateformat,
                appConfig.planning.timeformat
            );

        const coverageItem = (
            <Item>
                <Border />
                <Column grow={true} border={false}>
                    <Row paddingBottom>
                        <CoverageIcon
                            coverage={historyData}
                            users={users}
                            desks={desks}
                            contentTypes={contentTypes}
                        />
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {stringUtils.firstCharUpperCase(
                                get(historyData, 'planning.g2_content_type', '').replace('_', ' '))}
                        </span>
                        <time>
                            <i className="icon-time" />
                            {coverageDateText}
                        </time>
                    </Row>
                </Column>
            </Item>
        );

        const coverageHistoryItems = (
            <ContentBlock noPadding>
                <ul className="history-list">
                    {historyData.items.map((historyItem, index) => (
                        <li className="item" key={historyItem._id}>
                            <div>
                                {this.getHistoryActionElement(historyItem)}
                                <div>
                                    {historyItem.operation === COVERAGES.HISTORY_OPERATIONS.EDITED && (
                                        <div className="more-description">
                                            Updated Fields: {this.getHistoryItemEditedFields(historyItem)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </ContentBlock>
        );

        return (
            <CollapseBox
                collapsedItem={coverageItem}
                openItem={coverageHistoryItems}
                scrollInView
            />
        );
    }
}

CoverageHistory.propTypes = {
    historyData: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    contentTypes: PropTypes.array,
};
