import * as React from 'react';
import {get} from 'lodash';

import {IListFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {PreviewFormItem} from './base/PreviewFormItem';
import {PriorityBadge} from '../PriorityBadge';

interface IProps extends IListFieldProps {
    testId?: string;
    renderEmpty?: boolean;
}

/**
 * Priority as a coloured badge, same as in list views.
 */
export const PreviewFieldPriority: React.FunctionComponent<IProps> = (props) => {
    const {gettext} = superdeskApi.localization;
    const priority = get(props.item, props.field ?? 'priority');
    const label = gettext('Priority');

    if (priority == null) {
        return (
            <PreviewFormItem
                testId={props.testId}
                label={label}
                light={true}
                renderEmpty={props.renderEmpty}
            />
        );
    }

    return (
        <PreviewFormItem
            testId={props.testId}
            label={label}
            light={true}
            renderEmpty={true}
        >
            <PriorityBadge priority={priority} />
        </PreviewFormItem>
    );
};
