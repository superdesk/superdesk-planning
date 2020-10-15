import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {AgendaNameList} from '../Agendas';

export const agendas = ({item, fieldsProps}) => (
    <Fragment>
        <span className="sd-list-item__text-label">Agenda:</span>
        <span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-grow">
            <AgendaNameList agendas={get(fieldsProps, 'agendas.agendas')} />
        </span>
    </Fragment>

);

agendas.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    fieldsProps: PropTypes.object,
};
