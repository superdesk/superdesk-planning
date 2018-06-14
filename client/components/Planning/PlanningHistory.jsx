import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {PLANNING, HISTORY_OPERATIONS} from '../../constants';
import {getItemInArrayById, gettext, historyUtils} from '../../utils';
import {get} from 'lodash';
import {ContentBlock} from '../UI/SidePanel';
import {CoverageHistory} from '../Coverages';

export class PlanningHistoryComponent extends React.Component {
    componentWillMount() {
        const {item, fetchPlanningHistory} = this.props;

        if (get(item, '_id', null) !== null) {
            fetchPlanningHistory(item._id);
        }
    }

    componentWillReceiveProps(nextProps) {
        const nextId = get(nextProps, 'item._id', null);
        const currentId = get(this.props, 'item._id', null);

        if (nextId !== currentId || get(nextProps, 'historyItems.length') !== get(this.props, 'historyItems.length')) {
            this.props.fetchPlanningHistory(nextId);
        }
    }

    closeAndOpenDuplicate(duplicateId) {
        this.props.openPlanningPreview(duplicateId);
    }

    getHistoryActionElement(historyItem) {
        let text, agenda;

        switch (historyItem.operation) {
        case HISTORY_OPERATIONS.CREATE:
            text = gettext('Created');
            break;

        case HISTORY_OPERATIONS.ADD_TO_PLANNING:
            text = gettext('Created from content by');
            break;

        case HISTORY_OPERATIONS.EDITED:
            text = gettext('Edited');
            break;

        case HISTORY_OPERATIONS.SPIKED:
            text = gettext('Spiked');
            break;

        case HISTORY_OPERATIONS.UNSPIKED:
            text = gettext('Unspiked');
            break;

        case HISTORY_OPERATIONS.RESCHEDULE:
            text = gettext('Event Rescheduled');
            break;

        case HISTORY_OPERATIONS.EVENTS_CANCEL:
            text = gettext('Event Cancelled');
            break;

        case HISTORY_OPERATIONS.PLANNING_CANCEL:
            text = gettext('Planning Cancelled');
            break;

        case HISTORY_OPERATIONS.POSTPONE:
            text = gettext('Event Postponed');
            break;

        case PLANNING.HISTORY_OPERATIONS.PLANNING_CANCEL:
            text = gettext('Planning cancelled');
            break;

        case PLANNING.HISTORY_OPERATIONS.ASSIGN_AGENDA:
            agenda = get(getItemInArrayById(this.props.agendas, get(historyItem, 'update.agendas[0]')), 'name');
            text = gettext('Assigned to agenda ') + agenda;
            break;

        case HISTORY_OPERATIONS.DUPLICATE_FROM:
            text = gettext('Duplicate created');
            break;

        case HISTORY_OPERATIONS.DUPLICATE:
            text = gettext('Duplicated');
            break;
        }

        return historyUtils.getHistoryRowElement(text, historyItem, this.props.users);
    }

    render() {
        const planningItemHistory = historyUtils.getPlanningItemHistory(this.props.historyItems);
        const groupedCoverageHistory = historyUtils.getGroupedCoverageHistory(this.props.historyItems);

        return (
            <ContentBlock>
                <ul className="history-list">
                    {planningItemHistory.map((historyItem, index) => {
                        const postElement = historyUtils.getPostedHistoryElement(
                            index, planningItemHistory, this.props.users);
                        const historyElement = this.getHistoryActionElement(historyItem);

                        if (postElement || historyElement) {
                            return (<li className="item" key={historyItem._id}>
                                <div>
                                    {postElement}
                                    {historyElement}
                                    <div>
                                        {historyItem.operation === HISTORY_OPERATIONS.EDITED &&
                                            <div className="more-description">
                                                Updated Fields:
                                                { // List updated fields as comma separated
                                                    <span>&nbsp;{Object.keys(historyItem.update).map((field) => field)
                                                        .join(', ')}</span>
                                                }
                                            </div>
                                        }
                                        {historyItem.operation === HISTORY_OPERATIONS.DUPLICATE && (
                                            <div className="history-list__link">
                                                <a onClick={this.closeAndOpenDuplicate.bind(
                                                    this,
                                                    historyItem.update.duplicate_id
                                                )}>
                                                    {gettext('View duplicate planning item')}
                                                </a>
                                            </div>
                                        )}
                                        {historyItem.operation === HISTORY_OPERATIONS.DUPLICATE_FROM && (
                                            <div className="history-list__link">
                                                <a onClick={this.closeAndOpenDuplicate.bind(
                                                    this,
                                                    historyItem.update.duplicate_id
                                                )}>
                                                    {gettext('View original planning item')}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>);
                        }

                        return null;
                    })}
                </ul>
                {Object.keys(groupedCoverageHistory).map((historyKey) =>
                    <CoverageHistory
                        key={historyKey}
                        historyData={groupedCoverageHistory[historyKey]}
                        users={this.props.users}
                        desks={this.props.desks}
                        timeFormat={this.props.timeFormat}
                        dateFormat={this.props.dateFormat} />)}
            </ContentBlock>
        );
    }
}

PlanningHistoryComponent.propTypes = {
    item: PropTypes.object,
    historyItems: PropTypes.array,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    desks: PropTypes.array,
    agendas: PropTypes.array,
    currentPlanningId: PropTypes.string,
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    fetchPlanningHistory: PropTypes.func,
    closePlanningHistory: PropTypes.func,
    openPlanningPreview: PropTypes.func,
};

const mapStateToProps = (state) => ({
    historyItems: selectors.planning.planningHistory(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    agendas: selectors.general.agendas(state),
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchPlanningHistory: (currentPlanningId) => (
        dispatch(actions.planning.api.fetchPlanningHistory(currentPlanningId))
    ),
    openPlanningPreview: (planningId) => (
        dispatch(actions.main.openPreview({
            _id: planningId,
            type: 'planning',
        }))
    ),
});

export const PlanningHistory = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningHistoryComponent);
