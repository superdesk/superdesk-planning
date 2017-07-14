import React from 'react'
import { PlanningItem } from '../../components/index'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import { List, AutoSizer } from 'react-virtualized'
import { connect } from 'react-redux'
import { LIST_ITEM_2_LINES_HEIGHT, PLANNING_LIST_ITEM_MARGIN_HEIGHT } from '../../constants'

class PlanningList extends React.Component {

    isPlanningLockedInThisSession(planning) {
        return planning.lock_user === this.props.session.identity._id &&
            planning.lock_session === this.props.session.sessionId ? true : false
    }

    previewOrEditPlanning(planning) {
        // If we have the lock in this session, dispatch openPlanningEditor instead
        if (this.isPlanningLockedInThisSession(planning)) {
            this.props.openPlanningEditor(planning)
        } else {
            this.props.previewPlanning(planning)
        }
    }

    rowRenderer({ index, key, style }) {
        const {
            plannings,
            currentAgenda,
            currentPlanning,
            planningsEvents,
            handlePlanningUnspike,
            handlePlanningSpike,
            privileges,
            openPlanningEditor,
        } = this.props
        const planning = plannings[index]
        return (
            <div key={key} style={style}>
                <PlanningItem
                    key={key}
                    style={style}
                    active={currentPlanning && currentPlanning._id === planning._id}
                    item={planning}
                    event={planningsEvents[planning._id]}
                    agenda={currentAgenda}
                    onSpike={handlePlanningSpike}
                    onUnspike={handlePlanningUnspike}
                    onClick={this.previewOrEditPlanning.bind(this, planning)}
                    onDoubleClick={openPlanningEditor}
                    privileges={privileges}
                    itemLocked={planning.lock_user && planning.lock_session ? true : false}
                    itemLockedInThisSession={this.isPlanningLockedInThisSession(planning)} />
            </div>
        )
    }

    render() {
        const { plannings } = this.props
        return (
            <div className="PlanningList">
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            rowRenderer={this.rowRenderer.bind(this)}
                            height={height}
                            width={width}
                            plannings={plannings}
                            rowCount={plannings.length}
                            rowHeight={LIST_ITEM_2_LINES_HEIGHT + PLANNING_LIST_ITEM_MARGIN_HEIGHT}
                        />
                    )}
                </AutoSizer>
            </div>
        )
    }
}

PlanningList.propTypes = {
    plannings: React.PropTypes.array.isRequired,
    currentAgenda: React.PropTypes.object,
    currentPlanning: React.PropTypes.object,
    planningsEvents: React.PropTypes.object,
    openPlanningEditor: React.PropTypes.func.isRequired,
    previewPlanning: React.PropTypes.func.isRequired,
    handlePlanningSpike: React.PropTypes.func.isRequired,
    handlePlanningUnspike: React.PropTypes.func.isRequired,
    privileges: React.PropTypes.object.isRequired,
    session: React.PropTypes.object,
}

const mapStateToProps = (state) => ({
    currentAgenda: selectors.getCurrentAgenda(state),
    currentPlanning: selectors.getCurrentPlanning(state),
    plannings: selectors.getFilteredPlanningList(state),
    planningsEvents: selectors.getFilteredPlanningListEvents(state),
    privileges: selectors.getPrivileges(state),
    session: selectors.getSessionDetails(state),
})

const mapDispatchToProps = (dispatch) => ({
    previewPlanning: (item) => (dispatch(actions.planning.ui.preview(item._id))),
    openPlanningEditor: (item) => (dispatch(actions.planning.ui.openEditor(item._id))),
    handlePlanningSpike: (item) => {
        dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: `Are you sure you want to spike the planning item ${item.slugline || item.headline} ?`,
                action: () => dispatch(actions.planning.ui.spike(item)),
            },
        }))
    },
    handlePlanningUnspike: (item) => {
        dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: `Are you sure you want to unspike the planning item ${item.slugline || item.headline} ?`,
                action: () => dispatch(actions.planning.ui.unspike(item)),
            },
        }))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanningList)
