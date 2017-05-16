import React from 'react'
import { PlanningItem } from '../../components/index'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import { List, AutoSizer } from 'react-virtualized'
import { connect } from 'react-redux'
import { LIST_ITEM_HEIGHT, PLANNING_LIST_ITEM_MARGIN_HEIGHT } from '../../constants'

class PlanningList extends React.Component {

    rowRenderer({ index, key, style }) {
        const {
            plannings,
            currentPlanning,
            planningsEvents,
            openPlanningEditor,
            handlePlanningUnspike,
            handlePlanningSpike,
            privileges,
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
                    onSpike={handlePlanningSpike}
                    onUnspike={handlePlanningUnspike}
                    onClick={openPlanningEditor.bind(null, planning._id)}
                    privileges={privileges} />
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
                            rowHeight={LIST_ITEM_HEIGHT + PLANNING_LIST_ITEM_MARGIN_HEIGHT}
                        />
                    )}
                </AutoSizer>
            </div>
        )
    }
}

PlanningList.propTypes = {
    plannings: React.PropTypes.array.isRequired,
    currentPlanning: React.PropTypes.object,
    planningsEvents: React.PropTypes.object,
    openPlanningEditor: React.PropTypes.func.isRequired,
    handlePlanningSpike: React.PropTypes.func.isRequired,
    handlePlanningUnspike: React.PropTypes.func.isRequired,
    privileges: React.PropTypes.object.isRequired,
}

const mapStateToProps = (state) => ({
    currentPlanning: selectors.getCurrentPlanning(state),
    plannings: selectors.getCurrentAgendaPlannings(state),
    planningsEvents: selectors.getCurrentAgendaPlanningsEvents(state),
    privileges: selectors.getPrivileges(state),
})

const mapDispatchToProps = (dispatch) => ({
    openPlanningEditor: (planning) => (dispatch(actions.openPlanningEditor(planning))),
    handlePlanningSpike: (planning) => {
        dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: `Are you sure you want to spike the planning item ${planning.slugline} ?`,
                action: () => dispatch(actions.spikePlanning(planning)),
            },
        }))
    },
    handlePlanningUnspike: (planning) => {
        dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: `Are you sure you want to unspike the planning item ${planning.slugline} ?`,
                action: () => dispatch(actions.unspikePlanning(planning)),
            },
        }))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanningList)
