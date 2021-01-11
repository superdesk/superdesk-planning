import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IAgenda, IListFieldProps} from '../../../interfaces';
import {agendas as Agendas} from '../agendas';
import {agendas} from '../../../selectors/planning';
import {planningUtils} from '../../../utils';

interface IProps extends IListFieldProps {
    agendas: Array<IAgenda>;
}

const mapStateToProps = (state) => ({
    agendas: agendas(state),
});

class ListFieldAgendasComponent extends React.PureComponent<IProps> {
    render() {
        const field = this.props.field ?? 'agendas';
        const agendas = get(this.props.item, field) || [];

        if (agendas.length > 0) {
            return (
                <Agendas
                    item={this.props.item}
                    fieldsProps={{
                        agendas: {
                            agendas: planningUtils.getAgendaNames(
                                this.props.item,
                                this.props.agendas,
                                false,
                                field
                            ),
                        },
                    }}
                    noGrow={true}
                />
            );
        }

        return null;
    }
}

export const ListFieldAgendas = connect(mapStateToProps)(ListFieldAgendasComponent);
