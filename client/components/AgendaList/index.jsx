import React from 'react'
import { AgendaItem } from '../../components'
import './style.scss'

export const AgendaList = ({
    agendas,
    privileges,
    openEditAgenda,
    deleteAgenda,
    classNames,
    }) => {

    const agendaItems = agendas.map((agenda) => (
        <AgendaItem
            agenda={agenda}
            privileges={privileges}
            editAgenda={openEditAgenda.bind(this, agenda)}
            deleteAgenda={deleteAgenda.bind(this, agenda)}
            key={agenda._id} />
    ))

    return (
        <div className={classNames}>
            { agendaItems }
        </div>
    )
}

AgendaList.propTypes = {
    agendas: React.PropTypes.array.isRequired,
    privileges: React.PropTypes.object.isRequired,
    openEditAgenda: React.PropTypes.func.isRequired,
    deleteAgenda: React.PropTypes.func.isRequired,
    classNames: React.PropTypes.string,
}
