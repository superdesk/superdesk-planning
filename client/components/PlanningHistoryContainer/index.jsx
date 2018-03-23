import React from 'react';
import PropTypes from 'prop-types';
import {PlanningHistoryList} from '../../components';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import * as selectors from '../../selectors';

class PlanningHistoryComponent extends React.Component {
    render() {
        const {
            planningHistoryItems,
            users,
            closePlanningHistory,
            openPlanningPreview,
        } = this.props;

        return (
            <div>
                <PlanningHistoryList
                    planningHistoryItems={planningHistoryItems}
                    users={users}
                    closePlanningHistory={closePlanningHistory}
                    openPlanningPreview={openPlanningPreview}
                />
            </div>
        );
    }

    componentWillMount() {
        this.props.fetchPlanningHistory(this.props.currentPlanningId);
    }
}

PlanningHistoryComponent.propTypes = {
    planningHistoryItems: PropTypes.array,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    currentPlanningId: PropTypes.string,
    fetchPlanningHistory: PropTypes.func,
    closePlanningHistory: PropTypes.func,
    openPlanningPreview: PropTypes.func,
};

const mapStateToProps = (state) => ({
    planningHistoryItems: selectors.getPlanningHistory(state),
    users: selectors.getUsers(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchPlanningHistory: (currentPlanningId) => (
        dispatch(actions.planning.api.fetchPlanningHistory(currentPlanningId))
    ),
    openPlanningPreview: (planningId) => (
        dispatch(actions.planning.ui.preview(planningId))
    ),
});

export const PlanningHistoryContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningHistoryComponent);
