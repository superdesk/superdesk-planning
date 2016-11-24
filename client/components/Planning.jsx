import React from 'react'
import {
    EventsListPanelContainer,
    PlanningPanelContainer,
    AddEventContainer,
    CreateAgendaContainer } from './index'

export const Planning = () => (
    <div>
        <CreateAgendaContainer />
        <AddEventContainer />
        <EventsListPanelContainer />
        <PlanningPanelContainer />
    </div>
)
