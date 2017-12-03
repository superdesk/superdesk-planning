import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {TOOLTIPS} from '../../constants';

export const AgendaItem = ({agenda, deleteAgenda, editAgenda, privileges}) => (
    <div className="sd-list-item sd-list-item--width50 sd-shadow--z1">
        <div className="sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border"
            onClick={privileges.planning_agenda_management === 1 && editAgenda.bind(this, agenda)}>
            <div className="sd-list-item__row">
                <span className="sd-overflow-ellipsis">{agenda.name}</span>
                <time>updated {moment(agenda._updated).fromNow()}</time>
            </div>
        </div>
        {privileges.planning_agenda_management === 1 &&
                <div className="sd-list-item__action-menu sd-list-item__action-menu--direction-row">
                    <button onClick={editAgenda.bind(this, agenda)} className="dropdown__toggle"
                        data-sd-tooltip={TOOLTIPS.editAgenda} data-flow="down">
                        <i className="icon-pencil"/>
                    </button>
                    <button onClick={deleteAgenda.bind(this, agenda)} className="dropdown__toggle"
                        data-sd-tooltip={TOOLTIPS.deleteAgenda} data-flow="down">
                        <i className="icon-trash"/>
                    </button>
                </div>
        }
    </div>
);

AgendaItem.propTypes = {
    agenda: PropTypes.object.isRequired,
    editAgenda: PropTypes.func.isRequired,
    privileges: PropTypes.object.isRequired,
    deleteAgenda: PropTypes.func.isRequired,
};
