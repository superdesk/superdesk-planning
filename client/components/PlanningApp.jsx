import React from 'react'
import {
    EventsListPanelContainer,
    PlanningPanelContainer,
    AddEventContainer,
    CreateAgendaContainer } from './index'

export const PlanningApp = () => (
    <div>
        <CreateAgendaContainer />
        <AddEventContainer />
        <EventsListPanelContainer />
        <PlanningPanelContainer />
    </div>
)
