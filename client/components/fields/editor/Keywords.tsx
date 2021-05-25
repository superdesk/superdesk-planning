import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldTagsInput} from './base/tags';
import {IEditorFieldProps, IKeyword} from '../../../interfaces';
import {keywords as getKeywords} from '../../../selectors/general';

interface IProps extends IEditorFieldProps {
    keywords: Array<IKeyword>;
}

const mapStateToProps = (state) => ({
    keywords: getKeywords(state),
});

export class EditorFieldKeywordsComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldTagsInput
                {...this.props}
                field={this.props.field ?? 'keywords'}
                label={this.props.label ?? gettext('Keywords')}
                options={this.props.keywords}
                allowCustom={true}
            />
        );
    }
}

export const EditorFieldKeywords = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldKeywordsComponent);
