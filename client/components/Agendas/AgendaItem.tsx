import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {get} from 'lodash';
import {TOOLTIPS, PRIVILEGES} from '../../constants';
import {gettext} from '../../utils/gettext';
import {List} from '../UI';

export const AgendaItem = ({agenda, deleteAgenda, editAgenda, privileges, active}) => (
    <List.Item shadow={1}>
        <List.Border state={active ? 'active' : 'idle'} />
        <List.Column grow={true} border={false}>
            <List.Row>
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">{agenda.name}</span>
                <time>{gettext('updated') + ' ' + moment(agenda._updated).fromNow()}</time>
            </List.Row>
        </List.Column>
        {!!privileges[PRIVILEGES.AGENDA_MANAGEMENT] && (
            <List.ActionMenu>
                {editAgenda && (
                    <button
                        onClick={editAgenda.bind(null, agenda)}
                        className="dropdown__toggle"
                        data-sd-tooltip={gettext(TOOLTIPS.editAgenda)}
                        data-flow="left"
                    >
                        <i className="icon-pencil" />
                    </button>
                )}
                {get(agenda, 'plannings.length', 0) === 0 && !!privileges[PRIVILEGES.DELETE_AGENDA] && (
                    <button
                        onClick={deleteAgenda.bind(null, agenda)}
                        className="dropdown__toggle"
                        data-sd-tooltip={gettext(TOOLTIPS.deleteAgenda)}
                        data-flow="left"
                    >
                        <i className="icon-trash" />
                    </button>
                )}
            </List.ActionMenu>
        )}
    </List.Item>
);

AgendaItem.propTypes = {
    agenda: PropTypes.object.isRequired,
    editAgenda: PropTypes.func,
    privileges: PropTypes.object.isRequired,
    deleteAgenda: PropTypes.func.isRequired,
    active: PropTypes.bool.isRequired,
};
