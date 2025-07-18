import React from 'react';
import {IconButton} from 'superdesk-ui-framework/react';
import {Item, Border, Column} from '../../UI/List';
import {renderFields} from '../../fields';

import {
    lockUtils,
    isItemExpired,
    gettext,
} from '../../../utils';
import {LineItems} from '../../../components/UI/List/LineItems';
import {getPlanningSecondLineConfig, planningFirstLineConfig} from '../../../config';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';
import {ILockedItems, IPlanningItem} from '../../../interfaces';

interface IProps {
    item: IPlanningItem;
    lockedItems: ILockedItems;
    selectedPlanningIds: Array<string>;
    onAddToSelectedFeaturedPlanning(item: IPlanningItem, event: React.MouseEvent): any;
    onRemoveFromSelectedFeaturedPlanning(item: IPlanningItem, event: React.MouseEvent): any;
    readOnly: boolean;
    onClick(item: IPlanningItem, event: React.MouseEvent): void;
    withMargin: boolean;
    activated: boolean;
    disabled: boolean;
}

export const FeaturedPlanningItem: React.FunctionComponent<IProps> = ({
    item,
    lockedItems,
    selectedPlanningIds,
    onAddToSelectedFeaturedPlanning,
    onRemoveFromSelectedFeaturedPlanning,
    readOnly,
    activated,
    onClick,
    withMargin,
    disabled,
}) => {
    if (!item) {
        return null;
    }

    const isItemLocked = lockUtils.isItemLocked(item, lockedItems);
    const isExpired = isItemExpired(item);
    let borderState: React.ComponentProps<typeof Border>['state'] = false;

    if (isItemLocked) {
        borderState = 'locked';
    }

    const language = item.language || getUserInterfaceLanguageFromCV();

    const renderFieldsWithProps = (fields: Array<string>) => renderFields(
        fields,
        item,
        {
            fieldsProps: {
                // no field specific config needed yet
            },
        },
        language,
    );

    return (
        <Item
            shadow={1}
            disabled={isExpired || disabled}
            activated={activated}
            onClick={(event) => {
                onClick(item, event);
            }}
            margin={withMargin}
        >
            <Border state={borderState} />

            {!readOnly && selectedPlanningIds.includes(item._id) && (
                <Column border={false} style={{paddingInlineEnd: 0}}>
                    <IconButton
                        icon="chevron-left-thin"
                        ariaValue={gettext('Remove from Feature Stories')}
                        onClick={(event) => {
                            onRemoveFromSelectedFeaturedPlanning(item, event);
                        }}
                        style="outline"
                    />
                </Column>
            )}

            <Column
                grow={true}
                border={false}
                style={{paddingBlock: 'var(--space--1)'}}
            >
                <LineItems
                    firstLine={planningFirstLineConfig.filter(({fieldId}) => fieldId !== 'related_events')}
                    secondLine={
                        getPlanningSecondLineConfig({isAgendaEnabled: true})
                            .filter(({fieldId}) => fieldId !== 'related_events')
                    }
                    renderFieldsWithProps={renderFieldsWithProps}
                />
            </Column>

            {!readOnly && !selectedPlanningIds.includes(item._id) && (
                <Column border={false} style={{paddingInlineStart: 0}}>
                    <IconButton
                        icon="chevron-right-thin"
                        ariaValue={gettext('Add to Feature Stories')}
                        onClick={(event) => {
                            onAddToSelectedFeaturedPlanning(item, event);
                        }}
                        style="outline"
                    />
                </Column>
            )}
        </Item>
    );
};
