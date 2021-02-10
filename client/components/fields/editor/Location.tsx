import * as React from 'react';
import {get} from 'lodash';
import {IEditorFieldProps} from '../../../interfaces';

import {superdeskApi} from '../../../superdeskApi';
import {GeoLookupInput} from '../../GeoLookupInput';
import {Row} from '../../UI/Form';

export class EditorFieldLocation extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'location';

        return (
            <Row testId={this.props.testId}>
                <GeoLookupInput
                    field={field}
                    label={this.props.label ?? gettext('Location')}
                    value={get(this.props.item, field, this.props.defaultValue)}
                    disableSearch={true}
                    {...this.props}
                />
            </Row>
        );
    }
}
