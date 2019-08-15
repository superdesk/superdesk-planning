import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {AgendaNameList} from '../Agendas';

export const agendas = ({item, fieldsProps}) => (
    <div className="sd-list-item--element-grow">
        <span className="sd-list-item__text-label">Agenda:</span>
        <span className="sd-overflow-ellipsis sd-list-item__text-strong">
            <AgendaNameList agendas={get(fieldsProps, 'agendas.agendas')}/>
        </span>
    </div>

);

agendas.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    fieldsProps: PropTypes.object,
};
