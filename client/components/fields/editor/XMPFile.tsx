import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps, IFile} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {FileInput} from '../../UI/Form';

interface IProps extends IEditorFieldProps {
    files: Array<IFile>;
    onAddFiles(fileList: FileList): Promise<void>;
    onRemoveFile(file: IFile): void;
    createUploadLink(file: IFile): string;
    hideInput?: boolean;
    formats?: string;
    readOnly?: boolean;
}

interface IState {
    uploading: boolean;
}

export class EditorFieldXMPFile extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {uploading: false};

        this.onAddFiles = this.onAddFiles.bind(this);
    }

    onAddFiles(fileList: FileList) {
        this.setState({uploading: true}, () => {
            this.props.onAddFiles(fileList)
                .finally(() => {
                    this.setState({uploading: false});
                });
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'planning.xmp_file';
        const value = get(this.props.item, field, []);

        return this.state.uploading ? (
            <div className="sd-loader" />
        ) : (
            <div
                className="sd-line-input"
                data-test-id={this.props.testId}
            >
                <FileInput
                    label={this.props.label ?? gettext('Associate an XMP file')}
                    field={this.props.field ?? 'planning.xmp_file'}
                    value={value}
                    createLink={this.props.createUploadLink}
                    readOnly={this.props.readOnly}
                    hideInput={this.props.hideInput}
                    files={this.props.files}
                    onAddFiles={this.onAddFiles}
                    onRemoveFile={this.props.onRemoveFile}
                    formats={this.props.formats ?? '*.xmp'}
                />
            </div>
        );
    }
}
