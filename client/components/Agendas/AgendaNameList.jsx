import React from 'react';
import PropTypes from 'prop-types';
import {get, sortBy} from 'lodash';
import {gettext} from '../../utils';

export const AgendaNameList = ({agendas}) => (
    <span>
        {get(agendas, 'length', 0) === 0 ? gettext('No Agenda Assigned.') :
            sortBy(agendas, [(a) => a.name.toLowerCase()])
                .map((agenda, index, arr) => {
                    const className = !agenda.is_enabled ? 'Agenda--disabled' : '';

                    return (
                        <span key={index} className={className}>
                            {agenda.name}{arr.length - 1 > index && ', '}
                        </span>
                    );
                })
        }
    </span>
);

AgendaNameList.propTypes = {
    agendas: PropTypes.array
};