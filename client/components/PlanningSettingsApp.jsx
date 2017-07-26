import React from 'react'
import { connect } from 'react-redux'
import { PlanningSettingsContainer } from './index'

const PlanningSettingsAppComponent = () => {
    return (
        <PlanningSettingsContainer/>
    )
}

PlanningSettingsAppComponent.propTypes = { }

export const PlanningSettingsApp = connect(null)(PlanningSettingsAppComponent)
