import React from 'react';
import {IFieldsProps} from '../../interfaces';
import {eventUtils, isEvent, isPlanning} from '../../utils';
import {Label} from '../../components/Label';
import {superdeskApi} from '../../superdeskApi';
import {IEventItem} from 'globals';

export const event_completed: React.ComponentType<IFieldsProps> = (props) => {
    const {item} = props;
    const {gettext} = superdeskApi.localization;

    const event: IEventItem = (() => {
        if (isPlanning(item)) {
            return item.event;
        } else if (isEvent(item)) {
            return item;
        } else {
            return null;
        }
    })();

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
