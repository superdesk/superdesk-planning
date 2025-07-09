import React from 'react';
import {IFieldsProps} from '../../interfaces';
import {isItemExpired} from '../../utils';
import {Label} from '../../components/Label';
import {superdeskApi} from '../../superdeskApi';

export const expired: React.ComponentType<IFieldsProps> = ({item}) => {
    const {gettext} = superdeskApi.localization;
    const isExpired = isItemExpired(item);

    if (isExpired !== true) {
        return null;
    }

    return (
        <Label
            text={gettext('Expired')}
            iconType="alert"
            isHollow={true}
        />
    );
};
