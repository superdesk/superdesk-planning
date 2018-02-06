import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {TOOLTIPS} from '../../constants';
import {List} from '../UI';

export const AgendaItem = ({agenda, deleteAgenda, editAgenda, privileges, active}) => (
    <List.Item shadow={1}>
        <List.Border state={active ? 'active' : 'idle'} />
        <List.Column grow={true} border={false}>
            <List.Row>
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">{agenda.name}</span>
                <time>updated {moment(agenda._updated).fromNow()}</time>
            </List.Row>
        </List.Column>
        {privileges.planning_agenda_management === 1 &&
            <List.ActionMenu>
                {editAgenda && <button onClick={editAgenda.bind(null, agenda)} className="dropdown__toggle"
                    data-sd-tooltip={TOOLTIPS.editAgenda} data-flow="down">
                    <i className="icon-pencil"/>
                </button>}
                <button onClick={deleteAgenda.bind(null, agenda)} className="dropdown__toggle"
                    data-sd-tooltip={TOOLTIPS.deleteAgenda} data-flow="down">
                    <i className="icon-trash"/>
                </button>
            </List.ActionMenu>
        }
    </List.Item>
);

AgendaItem.propTypes = {
    agenda: PropTypes.object.isRequired,
    editAgenda: PropTypes.func,
    privileges: PropTypes.object.isRequired,
    deleteAgenda: PropTypes.func.isRequired,
    active: PropTypes.bool.isRequired,
};
