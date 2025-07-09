import React from 'react';
import {IFieldsProps} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {Spacer} from 'superdesk-ui-framework/react';
import {isPlanning} from '../../utils';

export const related_events: React.ComponentType<IFieldsProps> = ({item, fieldsProps}) => {
    const {gettextPlural} = superdeskApi.localization;
    const relatedEventsUI = fieldsProps?.related_events?.relatedEventsUI;

    if (!isPlanning(item)) {
        return null;
    }

    const relatedEvents = item.related_events ?? [];

    if (relatedEvents.length < 1 || relatedEventsUI == null) {
        return null;
    }

    return (
        <a
            className="sd-line-input__input--related-item-link"
            onClick={(event) => {
                event.stopPropagation();

                relatedEventsUI.setVisibility(!relatedEventsUI.visible);
            }}
        >
            <Spacer h gap="4" alignItems="center" noWrap>
                <span
                    style={{
                        paddingBlockStart: 1, // fixing icon alignment
                    }}
                >
                    <i className="icon-event" />
                </span>

                <span>
                    {
                        relatedEventsUI.visible
                            ? gettextPlural(
                                relatedEvents.length,
                                'Hide 1 event',
                                'Hide {{n}} events',
                                {n: relatedEvents.length},
                            )
                            : gettextPlural(
                                relatedEvents.length,
                                'Show 1 event',
                                'Show {{n}} events',
                                {n: relatedEvents.length},
                            )
                    }
                </span>
            </Spacer>
        </a>
    );
};
