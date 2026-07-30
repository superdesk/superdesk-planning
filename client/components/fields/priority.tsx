import React, {FunctionComponent} from 'react';
import {Spacer} from '@sourcefabric/common';
import {superdeskApi} from '../../superdeskApi';
import {IFieldsProps} from '../../interfaces';
import {PriorityBadge} from './PriorityBadge';
import {ILineConfigPriority} from 'globals';

type IProps = Omit<IFieldsProps, 'fieldOptions'> & ILineConfigPriority;

export const priority: FunctionComponent<IProps> = (props) => {
    const {gettext} = superdeskApi.localization;
    const {item} = props;

    if (item.priority == null) {
        return null;
    }

    const showFieldLabel = props.fieldOptions?.hideLabel !== true;

    return (
        <Spacer h gap="4" justifyContent="start" noWrap style={{whiteSpace: 'nowrap', width: 'auto'}}>
            {showFieldLabel && <span className="sd-list-item__text-label">{gettext('Priority:')}</span>}

            <PriorityBadge priority={item.priority} />
        </Spacer>
    );
};
