import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldSubjects extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'subject';
        const subjectNames = (get(this.props.item, field) || [])
            .map((place) => place.name)
            .join(', ');

        if (!subjectNames.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Subjects:')}
                data={subjectNames}
            />
        );
    }
}
