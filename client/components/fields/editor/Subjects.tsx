import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldVocabulary} from './base/vocabulary';
import {IEditorFieldProps} from '../../../interfaces';
import {subjects} from '../../../selectors/vocabs';
import {ISubject} from 'superdesk-api';

interface IProps extends IEditorFieldProps {
    subjects: Array<ISubject>;
}

const mapStateToProps = (state) => ({
    subjects: subjects(state),
});

export class EditorFieldSubjectsComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldVocabulary
                {...this.props}
                field={this.props.field ?? 'subject'}
                label={this.props.label ?? gettext('Subject')}
                onChange={this.props.onChange}
                options={this.props.subjects}
            />
        );
    }
}

export const EditorFieldSubjects = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldSubjectsComponent);
