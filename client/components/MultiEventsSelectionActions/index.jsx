import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { getSelectedEventsObjects } from '../../selectors'
import classNames from 'classnames'
import * as actions from '../../actions'
import './style.scss'

function MultiEventsSelectionActions({
    selectedEvents,
    className,
    selectAll,
    deselect,
    createPlanning,
    spike,
}) {
    const count = selectedEvents.length
    const classes = classNames('MultiEventsSelectionActions', className)
    return (
        <div className={classes}>
            <div className="MultiEventsSelectionActions__info">
                {count} selected event{count > 1 && 's'}&nbsp;
                <a onClick={selectAll}>select&nbsp;all</a>&nbsp;/&nbsp;
                <a onClick={deselect}>deselect</a>
            </div>
            <div className="MultiEventsSelectionActions__actions">
                <button onClick={createPlanning} className="btn btn--primary">
                    Create a planning
                </button>
                <button onClick={spike} className="btn btn--warning">
                    <i className="icon-trash"/> Spike
                </button>
            </div>
        </div>
    )
}

MultiEventsSelectionActions.propTypes = {
    selectedEvents: PropTypes.array.isRequired,
    className: PropTypes.string,
    selectAll: PropTypes.func.isRequired,
    deselect: PropTypes.func.isRequired,
    createPlanning: PropTypes.func.isRequired,
    spike: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => (
    { selectedEvents: getSelectedEventsObjects(state) }
)

const mapDispatchToProps = (dispatch) => ({
    selectAll: () => dispatch(actions.selectAllTheEventList()),
    deselect: () => dispatch(actions.deselectAllTheEventList()),
    addEventToCurrentAgenda: (events) => dispatch(actions.showModal({
        modalType: 'CONFIRMATION',
        modalProps: {
            body: `Do you want to add these ${events.length} events to the current agenda ?`,
            action: () => dispatch(actions.addEventToCurrentAgenda(events)),
        },
    })),
    spikeEvent: (events) => dispatch(actions.showModal({
        modalType: 'CONFIRMATION',
        modalProps: {
            body: `Do you want to spike these ${events.length} events ?`,
            action: () => dispatch(actions.spikeEvent(events)),
        },
    })),
})

const mergeProps = (stateProps, dispatchProps, ownProps) => (
    {
        ...ownProps,
        ...stateProps,
        ...dispatchProps,
        createPlanning: () => dispatchProps.addEventToCurrentAgenda(stateProps.selectedEvents),
        spike: () => dispatchProps.spikeEvent(stateProps.selectedEvents),
    }
)

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(MultiEventsSelectionActions)
