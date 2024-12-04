import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {extensionBridge} from '../../extension_bridge';
import {ICustomVocabulariesValueOperational} from './interfaces';
import {ICustomVocabulariesConfig} from '.';
import {cloneDeep, set} from 'lodash';

type IProps = IEditorComponentProps<ICustomVocabulariesValueOperational, ICustomVocabulariesConfig, never>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;
        const {EditorFieldCustomVocabularies} = extensionBridge.ui.components;

        return (
            <Container>
                <EditorFieldCustomVocabularies
                    field='custom_vocabularies'
                    item={this.props.item}
                    onChange={(fieldPath, value) => {
                        const valueCopy = cloneDeep(this.props.value ?? []);

                        if (typeof fieldPath == 'string') {
                            set(valueCopy, fieldPath, value);
                        }

                        this.props.onChange(valueCopy);
                    }}
                    schema={{
                        required: this.props.config.required ?? false,
                        vocabularies: this.props.config.vocabularyIds,
                        type: 'list',
                    }}
                />
            </Container>
        );
    }
}
