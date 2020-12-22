import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {SEARCH_SPIKE_STATE} from '../../../interfaces';

import {IEditorFieldProps} from './base';
import {EditorFieldRadio} from './base/radio';

export class EditorFieldSpikeState extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldRadio
                field={this.props.field ?? 'spike_state'}
                label={this.props.label ?? gettext('Spike State')}
                defaultValue={SEARCH_SPIKE_STATE.NOT_SPIKED}
                options={[{
                    value: SEARCH_SPIKE_STATE.NOT_SPIKED,
                    label: gettext('Exclude Spike'),
                }, {
                    value: SEARCH_SPIKE_STATE.BOTH,
                    label: gettext('Include Spike'),
                }, {
                    value: SEARCH_SPIKE_STATE.SPIKED,
                    label: gettext('Spiked Only'),
                }]}
                {...this.props}
            />
        );
    }
}
