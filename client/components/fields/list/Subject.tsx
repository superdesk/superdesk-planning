import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IListFieldProps} from '../../../interfaces';

export class ListFieldSubjects extends React.PureComponent<IListFieldProps> {
    render() {
        const field = this.props.field ?? 'subjects';
        const subjectNames = (get(this.props.item, field) || [])
            .map((subject) => subject.name)
            .join(', ');

        if (subjectNames.length > 0) {
            const {gettext} = superdeskApi.localization;

            return (
                <div className="sd-list-item--element-grow">
                    <span className="sd-list-item__text-label">
                        {gettext('Subjects:')}
                    </span>
                    <span className="sd-overflow-ellipsis sd-list-item__text-strong">
                        {subjectNames}
                    </span>
                </div>
            );
        }

        return null;
    }
}
