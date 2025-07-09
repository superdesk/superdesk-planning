import React from 'react';
import {IFieldsProps} from '../../interfaces';
import {eventUtils, isPlanning} from '../../utils';
import {Label} from '../../components/Label';
import {superdeskApi} from '../../superdeskApi';

export const event_completed: React.ComponentType<IFieldsProps> = (props) => {
    const {item} = props;
    const {gettext} = superdeskApi.localization;

    if (!isPlanning(item)) {
        return null;
    }

    const event = item.event;

    if (event == null) {
        return null;
    }

    const eventCompleted = eventUtils.isEventCompleted(event);

    if (eventCompleted !== true) {
        return null;
    }

    return (
        <Label
            text={gettext('Event Completed')}
            iconType="success"
            isHollow={true}
        />
    );
};
