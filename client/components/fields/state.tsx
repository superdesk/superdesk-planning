import React from 'react';
import {eventUtils, getItemWorkflowStateLabel, isEvent, isItemExpired, isPlanning} from '../../utils';
import {Label} from '../';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {Spacer} from '@sourcefabric/common';
import * as actions from '../../actions';
import {IEventItem, IFieldsProps} from '../../interfaces';

export const state: React.FunctionComponent<IFieldsProps> = ({item}) => {
    const {gettext} = superdeskApi.localization;
    const itemState = getItemWorkflowStateLabel(item);

    const event: IEventItem = (() => {
        if (isPlanning(item)) {
            return item.event;
        } else if (isEvent(item)) {
            return item;
        } else {
            return null;
        }
    })();

    return (
        <Spacer h gap="4">
            <Label text={gettext(itemState.label)} iconType={itemState.iconType} />

            {
                (isEvent(item) && item.reschedule_from != null) && (
                    <Label
                        text={gettext('Rescheduled Event')}
                        iconType="primary"
                        tooltip={{text: gettext('View original event'), flow: 'right'}}
                        onClick={() => {
                            planningApi.redux.store.dispatch(
                                actions.main.openPreview({type: 'event', _id: item.reschedule_from}) as any,
                            );
                        }}
                    />
                )
            }

            {
                (event != null && eventUtils.isEventCompleted(event)) && (
                    <Label
                        text={gettext('Event Completed')}
                        iconType="success"
                        isHollow={true}
                    />
                )
            }

            {
                isItemExpired(item) && (
                    <Label
                        text={gettext('Expired')}
                        iconType="alert"
                        isHollow={true}
                    />
                )
            }
        </Spacer>
    );
};
