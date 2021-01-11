import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IG2ContentType, IEditorFieldProps} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';
import {getLanguages} from '../../../selectors/vocabs';

interface IProps extends IEditorFieldProps {
    languages: Array<IG2ContentType>;
}

const mapStateToProps = (state) => ({
    languages: getLanguages(state),
});

export class EditorFieldLanguageComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldSelect
                field={this.props.field ?? 'language'}
                label={this.props.label ?? gettext('Language')}
                options={this.props.languages}
                labelField="name"
                clearable={true}
                valueAsString={true}
                {...this.props}
            />
        );
    }
}

export const EditorFieldLanguage = connect(mapStateToProps)(EditorFieldLanguageComponent);
