import React, {Fragment, FunctionComponent} from 'react';
import classNames from 'classnames';

import {AgendaNameList} from '../Agendas';
import {superdeskApi} from '../../superdeskApi';

interface IProps {
    fieldsProps: {
        agendas: {
            agendas: any;
        }
    };
    noGrow: boolean;
}

export const agendas: FunctionComponent<IProps> = ({fieldsProps, noGrow}) => {
    const {gettext} = superdeskApi.localization;

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
                <AgendaNameList agendas={fieldsProps?.agendas?.agendas} />
            </span>
        </Fragment>
    );
};
