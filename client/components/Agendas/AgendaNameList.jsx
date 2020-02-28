/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {get, sortBy} from 'lodash';
import {gettext} from '../../utils';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

export const AgendaNameList = ({agendas}) => {
    let tooltipElem = (agendas || []).map((a) =>
        <div key={a._id}>{a.name}{!a.is_enabled ? ' (Disabled)' : ''}</div>);

    const agendaElem = (a, index, arr) => (<OverlayTrigger
        key={a._id}
        overlay={<Tooltip id="agenda_tooltip" className="tooltip--text-left">
            {tooltipElem}
        </Tooltip>}>
        {<span
            className={!a.is_enabled ? 'sd-list-item__text--disabled' : ''}>
            {a.name}{index === arr.length - 1 ? '' : ', '}
        </span>}
    </OverlayTrigger>);


    return (<span>
        {get(agendas, 'length', 0) === 0 ? gettext('No Agenda Assigned.') :
            sortBy(agendas.filter((a) => a), [(a) => get(a, 'name', '').toLowerCase()])
                .map((agenda, index, arr) => agendaElem(agenda, index, arr))
        }
    </span>);
};

AgendaNameList.propTypes = {
    agendas: PropTypes.array,
};