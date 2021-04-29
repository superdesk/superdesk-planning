import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IG2ContentType, IEditorFieldProps} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';
import {getLanguages} from '../../../selectors/vocabs';

interface IProps extends IEditorFieldProps {
    languages: Array<IG2ContentType>;
    clearable?: boolean;
    valueAsString?: boolean;
}

const mapStateToProps = (state) => ({
    languages: getLanguages(state),
});

export class EditorFieldLanguageComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            refNode,
            ...props
        } = this.props;

        return (
            <EditorFieldSelect
                ref={refNode}
                {...props}
                field={props.field ?? 'language'}
                label={props.label ?? gettext('Language')}
                options={props.languages}
                labelField="name"
                clearable={props.clearable ?? true}
                valueAsString={props.valueAsString ?? true}
            />
        );
    }
}

export const EditorFieldLanguage = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldLanguageComponent);
