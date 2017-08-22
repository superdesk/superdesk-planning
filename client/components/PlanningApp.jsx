import React from 'react'
import { connect } from 'react-redux'
import {
    ModalsContainer,
    EventsPanelContainer,
    PlanningPanelContainer,
} from './index'
import { get } from 'lodash'

const PlanningAppComponent = ({ showEvents }) => {
    const classes = [
        'Planning',
        showEvents ? null : 'Planning--hide-events',
    ]
    return (
        <div className={classes.join(' ')}>
            <ModalsContainer />
            <EventsPanelContainer />
            <PlanningPanelContainer />
        </div>
    )
}

PlanningAppComponent.propTypes = { showEvents: React.PropTypes.bool }

const mapStateToProps = (state) => ({ showEvents: get(state, 'events.show', true) })

export const PlanningApp = connect(mapStateToProps)(PlanningAppComponent)
