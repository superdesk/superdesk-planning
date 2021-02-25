import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IListFieldProps, ILocation} from '../../../interfaces';

import {PreviewFormItem} from './base/PreviewFormItem';
import {Location} from '../../Location';

export class PreviewFieldLocation extends React.PureComponent<IListFieldProps> {
    render() {
        const field = this.props.field ?? 'location';
        const location = get(this.props.item, field) as ILocation;

        return (
            <PreviewFormItem
                label={superdeskApi.localization.gettext('Location')}
                light={true}
                {...this.props}
            >
                <div>
                    <Location
                        name={location?.name}
                        address={location?.formatted_address}
                        multiLine={true}
                        details={location?.details?.[0]}
                    />
                </div>
            </PreviewFormItem>
        );
    }
}
