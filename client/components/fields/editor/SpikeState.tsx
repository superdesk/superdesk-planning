import * as React from 'react';
import {get, set} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {SEARCH_SPIKE_STATE, IEditorFieldProps} from '../../../interfaces';

import {EditorFieldToggle} from './base/toggle';

export class EditorFieldSpikeState extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'spike_state';
        const item = {};
        const value = (get(this.props.item, field) ?? SEARCH_SPIKE_STATE.NOT_SPIKED) === SEARCH_SPIKE_STATE.BOTH;

        const onChange = (_: string, newValue: boolean) => {
            this.props.onChange(
                field,
                newValue ?
                    SEARCH_SPIKE_STATE.BOTH :
                    SEARCH_SPIKE_STATE.NOT_SPIKED
            );
        };

        set(item, field, value);

        return (
            <EditorFieldToggle
                {...this.props}
                field={field}
                label={this.props.label ?? gettext('Include Spiked')}
                defaultValue={false}
                item={item}
                onChange={onChange}
            />
        );
    }
}
