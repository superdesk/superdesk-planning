import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {SEARCH_SPIKE_STATE, IListFieldProps} from '../../../../interfaces';

import {PreviewSimpleListItem} from './PreviewSimpleListItem';

export class PreviewFieldSpikeState extends React.PureComponent<IListFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'date_filter';

        const getSpikeStateString = (state?: SEARCH_SPIKE_STATE) => {
            switch (state) {
            case SEARCH_SPIKE_STATE.NOT_SPIKED:
                return gettext('Exclude Spike');
            case SEARCH_SPIKE_STATE.BOTH:
                return gettext('Include Spike');
            case SEARCH_SPIKE_STATE.SPIKED:
                return gettext('Spiked Only');
            }

            return null;
        };

        const spikeStateString = getSpikeStateString(get(this.props.item, field));

        if (!spikeStateString?.length) {
            return null;
        }

        return (
            <PreviewSimpleListItem
                label={gettext('Spike State:')}
                data={spikeStateString}
            />
        );
    }
}
