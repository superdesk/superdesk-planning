import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldAgendas extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'agendas';
        const agendaNames = (get(this.props.item, field) || [])
            .map((agenda) => agenda.name)
            .join(', ');

        if (!agendaNames.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Agendas:')}
                data={agendaNames}
            />
        );
    }
}
