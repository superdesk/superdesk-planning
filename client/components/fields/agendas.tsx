import React, {Fragment, FunctionComponent} from 'react';
import classNames from 'classnames';
import {connect} from 'react-redux';
import {Spacer} from '@sourcefabric/common';
import * as selectors from '../../selectors';
import {AgendaNameList} from '../Agendas';
import {superdeskApi} from '../../superdeskApi';
import {IAgenda, IFieldsProps, IPlanningAppState} from '../../interfaces';
import {isPlanning, planningUtils} from '../../utils';

interface IReduxStateProps {
    agendas: Array<IAgenda>;
}

type IProps = IFieldsProps & IReduxStateProps;

export const AgendasComponent: FunctionComponent<IProps> = (props) => {
    const {gettext} = superdeskApi.localization;
    const {item, agendas} = props;

    if (!isPlanning(item)) {
        return null;
    }

    const agendasNames = planningUtils.getAgendaNames(item, agendas);

    return (
        <Spacer h gap="4" noWrap style={{whiteSpace: 'nowrap'}}>
            <span className="sd-list-item__text-label">{gettext('Agenda:')}</span>
            <span
                className={classNames(
                    'sd-list-item__text-strong',
                )}
            >
                <AgendaNameList agendas={agendasNames} />
            </span>
        </Spacer>
    );
};

const mapStateToProps = (state: IPlanningAppState): IReduxStateProps => ({
    agendas: selectors.general.agendas(state),
});

export const agendas = connect(
    mapStateToProps,
)(AgendasComponent);
