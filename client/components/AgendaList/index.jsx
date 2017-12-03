import React from 'react';
import PropTypes from 'prop-types';
import {AgendaItem} from '../../components';
import './style.scss';

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
    ));

    return (
        <div className={classNames}>
            { agendaItems }
        </div>
    );
};

AgendaList.propTypes = {
    agendas: PropTypes.array.isRequired,
    privileges: PropTypes.object.isRequired,
    openEditAgenda: PropTypes.func.isRequired,
    deleteAgenda: PropTypes.func.isRequired,
    classNames: PropTypes.string,
};
