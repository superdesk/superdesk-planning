import * as React from 'react';
import {getHumanReadableFileSize} from '@sourcefabric/common';
import {IconButton, Spacer} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../superdeskApi';
import {IFile} from '../interfaces';
import {IPropsAttachmentsEditorStandalone} from './AttachmentsInputStandalone.interface';
import {getFileDownloadURL} from '../utils';

interface IState{
    uploading: null | {label: string; progress: number};
}

type IProps = IPropsAttachmentsEditorStandalone;

/**
 * Uses `planning_files` endpoint and `IFile` interface
 */
export class AttachmentsInputStandalone extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            uploading: null,
        };
    }

    render() {
        const {DropZone, WithLiveResources} = superdeskApi.components;
        const {uploadFileWithProgress} = superdeskApi.dataApi;
        const {gettext} = superdeskApi.localization;

        return (
            <Spacer v gap="16" noWrap>
                <WithLiveResources
                    resources={[
                        {resource: 'planning_files', ids: this.props.value},
                    ]}
                >
                    {(res) => {
                        const files: Array<IFile> = res[0]._items;

                        return (
                            <Spacer v gap="4">
                                {
                                    files.map((file) => (
                                        <Spacer h gap="4" justifyContent="space-between" key={file._id} noWrap>
                                            <a
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                href={getFileDownloadURL(file)}
                                            >
                                                {file.media.name}
                                                {' '}
                                                ({getHumanReadableFileSize(file.media.length)})
                                            </a>

                                            <IconButton
                                                ariaValue={gettext('Remove')}
                                                icon="trash"
                                                onClick={() => {
                                                    this.props.onChange(
                                                        this.props.value.filter((id) => id !== file._id),
                                                    );
                                                }}
                                            />
                                        </Spacer>
                                    ))
                                }
                            </Spacer>
                        );
                    }}
                </WithLiveResources>

                {
                    this.state.uploading != null && (
                        <Spacer h gap="16" justifyContent="start" noWrap>
                            <div style={{whiteSpace: 'nowrap'}}>{this.state.uploading.label}</div>
                            <progress value={this.state.uploading.progress} max={100} style={{width: '100%'}} />
                            <div>{this.state.uploading.progress}%</div>
                        </Spacer>
                    )
                }

                {
                    this.props.readOnly ? null : (
                        <DropZone
                            label={gettext('Drop files here to upload')}
                            disabled={this.state.uploading != null}
                            canDrop={() => true}
                            fileAccept={this.props.fileAccept}
                            onDrop={(event) => {
                                if (event.dataTransfer == null) {
                                    throw new Error('event.dataTransfer is null');
                                }

                                const totalFiles = event.dataTransfer.files.length;
                                let currentUploadNo = 1;

                                let promises = Promise.resolve();

                                for (const file of Array.from(event.dataTransfer.files)) {
                                    const data = new FormData();

                                    data.append('media', file);

                                    promises = promises.then(() => {
                                        return uploadFileWithProgress<IFile>(
                                            '/planning_files',
                                            data,
                                            (event) => {
                                                const {total, loaded} = event;
                                                const progressPercent = Math.round(loaded * 100 / total);

                                                this.setState({
                                                    uploading: {
                                                        progress: progressPercent,
                                                        label: totalFiles === 1
                                                            ? gettext('Uploading...')
                                                            : gettext(
                                                                'Uploading {{current}} of {{total}}',
                                                                {
                                                                    current: currentUploadNo,
                                                                    total: totalFiles,
                                                                },
                                                            )
                                                    },
                                                });
                                            },
                                        ).then((res) => {
                                            currentUploadNo++;
                                            this.props.onChange(
                                                [
                                                    ...(this.props.value ?? []),
                                                    res._id,
                                                ],
                                            );
                                        });
                                    });
                                }

                                promises.then(() => {
                                    this.setState({uploading: null});
                                });
                            }}
                        />
                    )
                }
            </Spacer>
        );
    }
}
