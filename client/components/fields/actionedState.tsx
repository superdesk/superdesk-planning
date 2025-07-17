import React from 'react';
import {Label} from '../';
import {IFieldsProps} from 'interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';
import * as actions from '../../actions';
import {isEvent} from '../../utils';

export const actionedState: React.FunctionComponent<IFieldsProps> = ({item, fieldsProps}) => {
    const {gettext} = superdeskApi.localization;

    if (isEvent(item) && item.reschedule_from != null) {
        return (
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
        );
    }

    return null;
};
