import React from 'react';
import {getItemActionedStateLabel} from '../../utils';
import {Label} from '../';
import {IFieldsProps} from 'interfaces';

interface IProps extends IFieldsProps {
    fieldsProps: {
        actionedState: {
            onClick(): void;
        };
    };
}

export const actionedState: React.FunctionComponent<IProps> = ({item, fieldsProps}) => {
    const itemActionedState = getItemActionedStateLabel(item);

    if (!itemActionedState) {
        return null;
    }

    return (
        <Label
            text={itemActionedState.label}
            iconType={itemActionedState.iconType}
            tooltip={itemActionedState.tooltip}
            onClick={fieldsProps?.actionedState?.onClick}
        />
    );
};
