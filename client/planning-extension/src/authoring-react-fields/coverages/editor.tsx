import * as React from 'react';
import {
    IEditorComponentProps,
    IUrlsFieldConfig,
    IUrlsFieldUserPreferences,
} from 'superdesk-api';
import {ICoveragesValueOperational} from './interfaces';
import {cloneDeep, noop, set} from 'lodash';
import {extensionBridge} from '../../extension_bridge';
import {IPlanningItem} from '../../../../interfaces';

type IProps = IEditorComponentProps<ICoveragesValueOperational, IUrlsFieldConfig, IUrlsFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        const {EditorFieldCoverages} = extensionBridge.editor.fields;

        return (
            <Container>
                <EditorFieldCoverages
                    field='coverages'
                    item={{
                        // coverages are the main value
                        coverages: this.props.value,

                        // related_events are used if available to prefill coverage fields when adding a new coverage
                        related_events: this.props.item.related_events,
                    } as IPlanningItem}
                    // PR-TODO: implement functions below
                    onRemoveAssignment={noop}
                    setCoverageDefaultDesk={noop}
                    setCoverageAddAdvancedMode={() => Promise.resolve()}
                    preferredCoverageDesks={{}}
                    uploadFiles={() => Promise.resolve([])}
                    onAddScheduledUpdateToWorkflow={noop}
                    message={{}}
                    notifyValidationErrors={noop}
                    onChange={(fieldPath: any, value: any) => {
                        /**
                         * sample of arguments:
                         *      fieldPath - 'coverages[0].planning.slugline'
                         *      value - 'slugline 123'
                         */

                        const item = cloneDeep({coverages: this.props.value});
                        const nextValue = set(item, fieldPath, value);

                        for (const coverage of nextValue.coverages) {
                            if (coverage.planning != null) {
                                delete coverage.planning['_scheduledTime'];
                            }
                        }

                        this.props.onChange(nextValue.coverages);
                    }}
                />
            </Container>
        );
    }
}
