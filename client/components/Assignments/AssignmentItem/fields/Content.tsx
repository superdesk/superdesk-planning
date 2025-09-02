import React from 'react';

import {Label} from 'superdesk-ui-framework/react';

import {superdeskApi} from '../../../../superdeskApi';
import {IAssignmentListItemField} from '../../../../components/Assignments/interfaces';

type IProps = IAssignmentListItemField;

export const ContentComponent = ({assignment}: IProps) => {
    const itemEventIds = (assignment.linked_items ?? []).map((item) => item.event_id);
    const numberOfContent = (new Set(itemEventIds)).size;

    if (numberOfContent === 0) {
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
