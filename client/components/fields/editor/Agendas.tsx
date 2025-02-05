import * as React from 'react';
import {get, set} from 'lodash';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldVocabulary} from './base/vocabulary';
import {IAgenda, IEditorFieldProps} from '../../../interfaces';
import {agendas} from '../../../selectors/general';
import {planningUtils} from '../../../utils';

interface IProps extends IEditorFieldProps {
    agendas: Array<IAgenda>;
}

const mapStateToProps = (state) => ({
    agendas: agendas(state),
});

export class EditorFieldAgendasComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const item = {};
        const field = this.props.field ?? 'agendas';
        const agendaValues = (get(this.props.item, field) ?? [])
            .map((agendaId) => this.props.agendas.find((agenda) => agenda._id === agendaId));

        agendaValues.forEach((agenda) => {
            agenda.name = planningUtils.formatAgendaName(agenda);
        });
        set(item, field, agendaValues);

        const onChange = (field: string, value: Array<IAgenda>) => {
            this.props.onChange(field, (value ?? []).map(
                (agenda) => agenda._id
            ));
        };

        return (
            <EditorFieldVocabulary
                {...this.props}
                field={field}
                label={this.props.label ?? gettext('Agendas')}
                options={this.props.agendas.filter(
                    (agenda) => agenda.is_enabled
                )}
                defaultValue={[]}
                valueKey="_id"
                item={item}
                onChange={onChange}
            />
        );
    }
}

export const EditorFieldAgendas = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldAgendasComponent);
