import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {DATE_RANGE, IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldRelativeDate extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'date_filter';

        const getFilterString = (filter?: DATE_RANGE) => {
            switch (filter) {
            case DATE_RANGE.TODAY:
                return gettext('Today');
            case DATE_RANGE.TOMORROW:
                return gettext('Tomorrow');
            case DATE_RANGE.THIS_WEEK:
                return gettext('This Week');
            case DATE_RANGE.NEXT_WEEK:
                return gettext('Next Week');
            }

            return null;
        };

        const filterString = getFilterString(get(this.props.item, field));

        if (!filterString?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Date Filter:')}
                data={filterString}
            />
        );
    }
}
