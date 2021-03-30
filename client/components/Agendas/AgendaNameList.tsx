/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {get, sortBy} from 'lodash';
import {gettext} from '../../utils';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

export const AgendaNameList = ({agendas}) => {
    let tooltipElem = (agendas || []).map((a) =>
        <div key={a._id}>{a.name}{!a.is_enabled ? ' (Disabled)' : ''}</div>);

    return (
        <span>
            {get(agendas, 'length', 0) === 0 ? gettext('No Agenda Assigned.') :
                (
                    <OverlayTrigger
                        placement="left"
                        overlay={(
                            <Tooltip id="agenda_tooltip" className="tooltip--text-left">
                                {tooltipElem}
                            </Tooltip>
                        )}
                    >
                        <span>
                            {sortBy(agendas.filter((a) => a), [(a) => get(a, 'name', '').toLowerCase()])
                                .map((a, index, arr) => (
                                    <span
                                        key={a._id}
                                        className={!a.is_enabled ? 'sd-list-item__text--disabled' : ''}
                                    >
                                        {a.name}{index === arr.length - 1 ? '' : ', '}
                                    </span>
                                ))}</span>
                    </OverlayTrigger>
                )
            }
        </span>
    );
};

AgendaNameList.propTypes = {
    agendas: PropTypes.array,
};