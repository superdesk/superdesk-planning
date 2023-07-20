import * as React from 'react';
import {connect} from 'react-redux';

import {IVocabulary} from 'superdesk-api';
import {IEditorFieldProps, IEditorProfile} from '../../../interfaces';
import CustomVocabulariesFields from '../../CustomVocabulariesFields';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';

interface IProps extends IEditorFieldProps {
    vocabularies: Array<IVocabulary>;
    profile: IEditorProfile;
    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

const mapStateToProps = (state) => ({
    vocabularies: state.customVocabularies
});

class CustomVocabulariesComponent extends React.PureComponent<IProps> {
    render() {
        const language = this.props.language ?? getUserInterfaceLanguageFromCV();

        return (
            <CustomVocabulariesFields
                testId={this.props.testId}
                customVocabularies={this.props.vocabularies.filter((cv) => (
                    (this.props.schema.vocabularies ?? []).includes(cv._id)
                ))}
                fieldProps={{
                    item: this.props.item,
                    readOnly: this.props.disabled,
                    onChange: this.props.onChange,
                    errors: this.props.errors,
                }}
                language={language}
                popupProps={{
                    onPopupOpen: this.props.onPopupOpen,
                    onPopupClose: this.props.onPopupClose,
                }}
                popupContainer={this.props.popupContainer}
            />
        );
    }
}

export const EditorFieldCustomVocabularies = connect(mapStateToProps)(CustomVocabulariesComponent);
