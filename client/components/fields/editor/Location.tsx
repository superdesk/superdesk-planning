import * as React from 'react';
import {superdeskApi} from '../../../superdeskApi';
import {GeoLookupInput} from '../../GeoLookupInput';
import {Row} from '../../UI/Form';
import {IEditorFieldLocationProps} from './Location.interface';

export class EditorFieldLocation extends React.PureComponent<IEditorFieldLocationProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'location';

        return (
            <Row testId={this.props.testId}>
                <GeoLookupInput
                    {...this.props}
                    field={field}
                    label={this.props.label ?? gettext('Location')}
                    value={this.props.item[field] ?? this.props.defaultValue}
                    disableSearch={!this.props.enableExternalSearch}
                    disableAddLocation={this.props.disableAddLocation}
                    readOnly={this.props.disabled}
                />
            </Row>
        );
    }
}
