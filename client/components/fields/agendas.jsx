import React from 'react';
import PropTypes from 'prop-types';

import {AgendaNameList} from '../Agendas';

export const agendas = ({item, agendas}) => (
    <div className="sd-list-item--element-grow">
        <span className="sd-list-item__text-label">agenda:</span>
        <span className="sd-overflow-ellipsis sd-list-item__text-strong">
            <AgendaNameList agendas={agendas}/>
        </span>
    </div>

);

agendas.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    agendas: PropTypes.array,
};
