import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps, IFile} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Row, FileInput} from '../../UI/Form';

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
    node: React.RefObject<FileInput>;

    constructor(props) {
        super(props);

        this.state = {uploading: false};
        this.node = React.createRef();

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

        return (
            <Row>
                <div className={this.state.uploading ? 'sd-loader' : ''}>
                    <label className="form-label">
                        {this.props.label ?? gettext('Associate an XMP file')}
                    </label>
                    {this.state.uploading ? null : (
                        <FileInput
                            ref={this.node}
                            field={this.props.field ?? 'planning.xmp_file'}
                            value={value}
                            files={this.props.files}
                            createLink={this.props.createUploadLink}
                            onAddFiles={this.onAddFiles}
                            onRemoveFile={this.props.onRemoveFile}
                            formats={this.props.formats ?? '*.xmp'}
                            readOnly={this.props.readOnly}
                            hideInput={this.props.hideInput}
                        />
                    )}
                </div>
            </Row>
        );
    }
}
