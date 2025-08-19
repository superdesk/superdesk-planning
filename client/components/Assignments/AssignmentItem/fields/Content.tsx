import React from 'react';

import {Label} from 'superdesk-ui-framework/react';

import {superdeskApi} from '../../../../superdeskApi';
import {IAssignmentItem} from '../../../../interfaces';

interface IProps {
    assignment: IAssignmentItem;
}

export const ContentComponent = ({assignment}: IProps) => {
    const itemEventIds = (assignment.linked_items ?? []).map((item) => item.event_id);
    const numberOfContent = (new Set(itemEventIds)).size;

    if (!numberOfContent) {
        return null;
    }

    const {gettext} = superdeskApi.localization;

    return (
        <Label
            type="highlight"
            style="translucent"
            text={gettext('Content: {{ numberOfContent }}', {numberOfContent})}
        />
    );
};
