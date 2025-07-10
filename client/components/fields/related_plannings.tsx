import React from 'react';
import {IEventListItemProps, IFieldsProps} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {isEvent} from '../../utils';

interface IProps extends IFieldsProps {
    fieldsProps: {
        related_plannings: {
            relatedEventsUI: IEventListItemProps['relatedEventsUI'];
            relatedPlanningsCount?: number;
        };
    };
}

export const related_plannings: React.FunctionComponent<IProps> = ({item, fieldsProps}) => {
    const {gettextPlural} = superdeskApi.localization;
    const relatedEventsUI = fieldsProps?.related_plannings?.relatedEventsUI;
    const relatedPlanningsCount = fieldsProps?.related_plannings?.relatedPlanningsCount ?? 0;

    if (!isEvent(item)) {
        return null;
    }

    if (relatedPlanningsCount < 1 || relatedEventsUI == null) {
        return null;
    }

    const relatedPlanningText = relatedEventsUI.visible
        ? gettextPlural(
            relatedPlanningsCount,
            'Hide 1 planning item', 'Hide {{n}} planning items',
            {n: relatedPlanningsCount},
        )
        : gettextPlural(
            relatedPlanningsCount,
            'Show 1 planning item', 'Show {{n}} planning items',
            {n: relatedPlanningsCount},
        );

    return (
        <span
            className="sd-overflow-ellipsis sd-list-item__element-lm-10"
        >
            <a
                className="sd-line-input__input--related-item-link"
                onClick={(event) => {
                    event.stopPropagation();
                    relatedEventsUI.setVisibility(!relatedEventsUI.visible);
                }}
            >
                <i className="icon-calendar" />
                <span className="sd-margin-l--0-5">
                    {relatedPlanningText}
                </span>
            </a>
        </span>
    );
};
