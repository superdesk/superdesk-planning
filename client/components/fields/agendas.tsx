import React, {Fragment} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {AgendaNameList} from '../Agendas';

export const agendas = ({item, fieldsProps, noGrow}) => (
    <Fragment>
        <span className="sd-list-item__text-label">Agenda:</span>
        <span
            className={classNames(
                'sd-overflow-ellipsis',
                'sd-list-item__text-strong',
                {
                    'sd-list-item--element-grow': !noGrow,
                }
            )}
        >
            <AgendaNameList agendas={get(fieldsProps, 'agendas.agendas')} />
        </span>
    </Fragment>
);

agendas.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    fieldsProps: PropTypes.object,
    noGrow: PropTypes.bool,
};
