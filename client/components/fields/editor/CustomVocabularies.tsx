import * as React from 'react';
import {connect} from 'react-redux';

import {IVocabulary} from 'superdesk-api';
import {IEditorFieldProps, IEditorProfile} from '../../../interfaces';

import CustomVocabulariesFields from '../../CustomVocabulariesFields';

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
        return (
            <CustomVocabulariesFields
                testId={this.props.testId}
                customVocabularies={this.props.vocabularies}
                fieldProps={{
                    item: this.props.item,
                    diff: this.props.item,
                    readOnly: this.props.disabled,
                    onChange: this.props.onChange,
                    errors: this.props.errors,
                }}
                formProfile={this.props.profile}
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
