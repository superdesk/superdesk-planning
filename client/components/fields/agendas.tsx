import React, {Fragment, FunctionComponent} from 'react';
import classNames from 'classnames';
import {connect} from 'react-redux';
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
    const {item, agendas, fieldsProps} = props;

    if (!isPlanning(item)) {
        return null;
    }

    const agendasNames = planningUtils.getAgendaNames(item, agendas);

    // PR-TODO: ensure ellipsis is applied to agendas

    return (
        <Fragment>
            <span className="sd-list-item__text-label">{gettext('Agenda:')}</span>
            <span
                className={classNames(
                    'sd-overflow-ellipsis',
                    'sd-list-item__text-strong',
                )}
            >
                <AgendaNameList agendas={agendasNames} />
            </span>
        </Fragment>
    );
};

const mapStateToProps = (state: IPlanningAppState): IReduxStateProps => ({
    agendas: selectors.general.agendas(state),
});

export const agendas = connect(
    mapStateToProps,
)(AgendasComponent);
