import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IEventLocation, IListFieldProps} from '../../../interfaces';

import {PreviewFormItem} from './base/PreviewFormItem';
import {Location} from '../../Location';
import {eventUtils} from '../../../utils';

export class PreviewFieldLocation extends React.PureComponent<IListFieldProps> {
    render() {
        const field = this.props.field ?? 'location';
        const locations = get(this.props.item, field, []) as Array<IEventLocation>;

        return (
            <div>
                <PreviewFormItem
                    label={superdeskApi.localization.gettext('Location')}
                    light={true}
                    value={locations.length ? '' : undefined} // otherwise it won't render in preview
                    {...this.props}
                >
                    {/* An empty array is truthy, which would suppress the "-" fallback */}
                    {locations.length === 0 ? null : locations.map((location) => (
                        <div key={location.qcode}>
                            <Location
                                name={location.name}
                                address={location.formatted_address}
                                multiLine={true}
                                details={eventUtils.normalizeLocationDetails(location.details)}
                            />
                        </div>
                    ))}
                </PreviewFormItem>
            </div>
        );
    }
}
