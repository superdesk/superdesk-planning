import React from 'react'
import PropTypes from 'prop-types'
import { PlanningItem } from '../../components/index'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import { InfiniteLoader, List, AutoSizer } from 'react-virtualized'
import { connect } from 'react-redux'
import { LIST_ITEM_2_LINES_HEIGHT, PLANNING_LIST_ITEM_MARGIN_HEIGHT, WORKSPACE } from '../../constants'

class PlanningList extends React.Component {

    constructor(props) {
        super(props)
        this.state = { isNextPageLoading: false }
    }

    isPlanningLockedInThisSession(planning) {
        return planning.lock_user === this.props.session.identity._id &&
            planning.lock_session === this.props.session.sessionId ? true : false
    }

    previewOrEditPlanning(planning) {
        const { currentWorkspace } = this.props
        // If we have the lock in this session, dispatch openPlanningEditor instead
        if (currentWorkspace === WORKSPACE.PLANNING && this.isPlanningLockedInThisSession(planning)) {
            this.props.openPlanningEditor(planning)
        } else {
            this.props.previewPlanning(planning)
        }
    }

    isRowLoaded({ index }) {
        return index <= this.props.plannings.length
    }

    loadMoreRows() {
        const { loadMorePlannings } = this.props
        const { isNextPageLoading } = this.state

        if (isNextPageLoading) {
            return Promise.resolve()
        } else {
            this.setState({ isNextPageLoading: true })
            return loadMorePlannings()
            .then(() => {this.setState({ isNextPageLoading: false })})
        }
    }

    rowRenderer({ index, key, style }) {
        const {
            plannings,
            agendas,
            currentPlanning,
            planningsEvents,
            handlePlanningUnspike,
            handlePlanningSpike,
            onAgendaClick,
            privileges,
            openPlanningEditor,
            handlePlanningDuplicate,
            session,
            users,
            desks,
            onCancelEvent,
            onUpdateEventTime,
            onRescheduleEvent,
            onPostponeEvent,
            onConvertToRecurringEvent,
            onCancelPlanning,
            onCancelAllCoverage,
            onSelectItem,
            selected,
            lockedItems,
            currentWorkspace,
        } = this.props
        const planning = plannings[index]
        const isSelected = selected.indexOf(planning._id) > -1

        return (
            <div key={key} style={style}>
                <PlanningItem
                    key={key}
                    style={style}
                    agendas={agendas || []}
                    active={(currentPlanning && currentPlanning._id === planning._id) || isSelected}
                    item={planning}
                    event={planningsEvents[planning._id]}
                    onSpike={handlePlanningSpike}
                    onUnspike={handlePlanningUnspike}
                    onDuplicate={handlePlanningDuplicate}
                    onCancelEvent={onCancelEvent}
                    onConvertToRecurringEvent={onConvertToRecurringEvent}
                    onUpdateEventTime={onUpdateEventTime}
                    onRescheduleEvent={onRescheduleEvent}
                    onPostponeEvent={onPostponeEvent}
                    onCancelPlanning={onCancelPlanning}
                    onCancelAllCoverage={onCancelAllCoverage}
                    onClick={this.previewOrEditPlanning.bind(this, planning)}
                    onDoubleClick={openPlanningEditor}
                    onAgendaClick={onAgendaClick}
                    privileges={privileges}
                    session={session}
                    users={users}
                    desks={desks}
                    lockedItems={lockedItems}
                    onSelectItem={() => onSelectItem(planning._id)}
                    isSelected={isSelected}
                    currentWorkspace={currentWorkspace}
                    />
            </div>
        )
    }

    render() {
        const { plannings } = this.props
        return (
            <div className="PlanningList">
                <InfiniteLoader
                    isRowLoaded={this.isRowLoaded.bind(this)}
                    loadMoreRows={this.loadMoreRows.bind(this)}
                    rowCount={plannings.length + 20}
                >
                    {({ onRowsRendered, registerChild }) => (
                        <AutoSizer>
                            {({ height, width }) => (
                                <List
                                    ref={registerChild}
                                    onRowsRendered={onRowsRendered}
                                    rowRenderer={this.rowRenderer.bind(this)}
                                    height={height}
                                    width={width}
                                    plannings={plannings}
                                    rowCount={plannings.length}
                                    rowHeight={LIST_ITEM_2_LINES_HEIGHT + PLANNING_LIST_ITEM_MARGIN_HEIGHT}
                                />
                            )}
                        </AutoSizer>
                    )}
                </InfiniteLoader>
            </div>
        )
    }
}

PlanningList.propTypes = {
    plannings: PropTypes.array.isRequired,
    agendas: PropTypes.array,
    currentPlanning: PropTypes.object,
    planningsEvents: PropTypes.object,
    openPlanningEditor: PropTypes.func.isRequired,
    previewPlanning: PropTypes.func.isRequired,
    handlePlanningSpike: PropTypes.func.isRequired,
    handlePlanningUnspike: PropTypes.func.isRequired,
    privileges: PropTypes.object.isRequired,
    session: PropTypes.object,
    users: PropTypes.array.isRequired,
    desks: PropTypes.array.isRequired,
    onAgendaClick: PropTypes.func,
    loadMorePlannings: PropTypes.func,
    handlePlanningDuplicate: PropTypes.func,
    onCancelEvent: PropTypes.func,
    onUpdateEventTime: PropTypes.func,
    onRescheduleEvent: PropTypes.func,
    onPostponeEvent: PropTypes.func,
    onConvertToRecurringEvent: PropTypes.func,
    onCancelPlanning: PropTypes.func,
    onCancelAllCoverage: PropTypes.func,
    onSelectItem: PropTypes.func,
    selected: PropTypes.array,
    lockedItems: PropTypes.object,
    currentWorkspace: PropTypes.string,
}

const mapStateToProps = (state) => ({
    agendas: selectors.getAgendas(state),
    currentPlanning: selectors.getCurrentPlanning(state),
    plannings: selectors.getFilteredPlanningList(state),
    planningsEvents: selectors.getFilteredPlanningListEvents(state),
    privileges: selectors.getPrivileges(state),
    session: selectors.getSessionDetails(state),
    users: selectors.getUsers(state),
    desks: state.desks && state.desks.length > 0 ? state.desks : [],
    lockedItems: selectors.getLockedItems(state),
    currentWorkspace: selectors.getCurrentWorkspace(state),
})

const mapDispatchToProps = (dispatch) => ({
    previewPlanning: (item) => (dispatch(actions.planning.ui.preview(item._id))),
    openPlanningEditor: (item) => (dispatch(actions.planning.ui.openEditor(item))),
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

    onAgendaClick: (agendaId) => (dispatch(actions.selectAgenda(agendaId))),
    loadMorePlannings: () => (dispatch(actions.planning.ui.fetchMoreToList())),
    handlePlanningDuplicate: (planning) => (dispatch(actions.planning.ui.duplicate(planning))),
    onCancelEvent: (event) => dispatch(actions.events.ui.openCancelModal(event)),
    onUpdateEventTime: (event) => dispatch(actions.events.ui.updateTime(event)),
    onRescheduleEvent: (event) => dispatch(actions.events.ui.openRescheduleModal(event)),
    onPostponeEvent: (event) => dispatch(actions.events.ui.openPostponeModal(event)),
    onConvertToRecurringEvent: (event) => dispatch(actions.events.ui.convertToRecurringEvent(event)),
    onCancelPlanning: (planning) => dispatch(actions.planning.ui.openCancelPlanningModal(planning)),
    onCancelAllCoverage: (planning) => dispatch(actions.planning.ui.openCancelAllCoverageModal(planning)),
    onSelectItem: (itemId) => dispatch(actions.planning.ui.toggleItemSelected(itemId)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PlanningList)
