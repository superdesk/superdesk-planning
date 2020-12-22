import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldNoAgendaAssigned extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'no_agenda_assigned';
        const noAgendaAssigned = (get(this.props.item, field));

        if (noAgendaAssigned == null) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('No Agenda Assigned:')}
                data={noAgendaAssigned == true ?
                    gettext('True') :
                    gettext('False')
                }
            />
        );
    }
}
