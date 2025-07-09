import React, {Fragment, FunctionComponent} from 'react';
import classNames from 'classnames';

import {AgendaNameList} from '../Agendas';
import {superdeskApi} from '../../superdeskApi';
import {IAgenda, IFieldsProps} from 'interfaces';

interface IProps extends IFieldsProps {
    fieldsProps: {
        agendas: {
            agendas: Array<IAgenda>;
            noGrow: boolean;
        }
    };
}

export const agendas: FunctionComponent<IProps> = ({fieldsProps}) => {
    const {gettext} = superdeskApi.localization;

    const agendas = fieldsProps?.agendas?.agendas;
    const noGrow = fieldsProps?.agendas?.noGrow ?? false;

    if (agendas == null) {
        return null;
    }

    return (
        <Fragment>
            <span className="sd-list-item__text-label">{gettext('Agenda:')}</span>
            <span
                className={classNames(
                    'sd-overflow-ellipsis',
                    'sd-list-item__text-strong',
                    {
                        'sd-list-item--element-grow': !noGrow,
                    }
                )}
            >
                <AgendaNameList agendas={agendas} />
            </span>
        </Fragment>
    );
};
