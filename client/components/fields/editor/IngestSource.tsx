import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldVocabulary} from './base/vocabulary';
import {IEditorFieldProps, ISearchParams} from '../../../interfaces';
import {ingestProviders} from '../../../selectors/general';

interface IProps extends IEditorFieldProps {
    ingestProviders: Array<ISearchParams['source']>;
}

const mapStateToProps = (state) => ({
    ingestProviders: ingestProviders(state),
});

export class EditorFieldIngestSourceComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldVocabulary
                {...this.props}
                field={this.props.field ?? 'source'}
                label={this.props.label ?? gettext('Source')}
                defaultValue={[]}
                options={this.props.ingestProviders}
                valueKey={'id'}
            />
        );
    }
}

export const EditorFieldIngestSource = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldIngestSourceComponent);
