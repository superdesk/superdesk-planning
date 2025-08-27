import React, {FunctionComponent} from 'react';
import {Spacer} from '@sourcefabric/common';
import {superdeskApi} from '../../superdeskApi';
import {IFieldsProps} from '../../interfaces';
import {isPlanning} from '../../utils';

export const urgency: FunctionComponent<IFieldsProps> = (props) => {
    const {gettext} = superdeskApi.localization;
    const {item} = props;

    if (!isPlanning(item)) {
        return null;
    }

    if (item.urgency == null) {
        return null;
    }

    return (
        <Spacer h gap="4" noWrap style={{whiteSpace: 'nowrap'}}>
            <span className="sd-list-item__text-label">{gettext('Urgency:')}</span>
            <div style={{display: 'flex', alignItems: 'center'}}>
                <div className={`urgency-label urgency-label--${item.urgency}`}>{item.urgency}</div>
            </div>
        </Spacer>
    );
};
