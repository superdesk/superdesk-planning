import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {AgendaItem} from './index';
import {List} from '../UI';
import {gettext} from '../../utils';

export const AgendaList = ({
    agendas,
    privileges,
    editAgenda,
    deleteAgenda,
    status,
}) => {
    const agendaItems = get(agendas, 'length', 0) > 0 ? agendas.map((agenda) => (
        <AgendaItem
            agenda={agenda}
            privileges={privileges}
            editAgenda={editAgenda ? editAgenda : null}
            deleteAgenda={deleteAgenda.bind(this, agenda)}
            key={agenda._id}
            active={agenda.is_enabled} />
    )) :
        <span>{gettext('There are no ') + status + gettext(' agendas')}</span>;

    return (
        <div>
            <List.Header title={status + gettext(' Agendas')} marginTop={status === 'disabled'}/>
            <List.Group spaceBetween={true}>
                { agendaItems }
            </List.Group>
        </div>
    );
};

AgendaList.propTypes = {
    agendas: PropTypes.array.isRequired,
    privileges: PropTypes.object.isRequired,
    deleteAgenda: PropTypes.func.isRequired,
    editAgenda: PropTypes.func,
    status: PropTypes.string,
};
