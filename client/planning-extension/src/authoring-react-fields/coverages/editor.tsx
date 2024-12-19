import * as React from 'react';
import {
    IEditorComponentProps,
    IUrlsFieldConfig,
    IUrlsFieldUserPreferences,
} from 'superdesk-api';
import {ICoveragesValueOperational} from './interfaces';
import {cloneDeep, set} from 'lodash';
import {extensionBridge} from '../../extension_bridge';
import {IPlanningItem} from '../../../../interfaces';
import {superdesk} from '../../superdesk';

type IProps = IEditorComponentProps<ICoveragesValueOperational, IUrlsFieldConfig, IUrlsFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        const {EditorFieldCoverages} = extensionBridge.editor.fields;

        return (
            <Container>
                <EditorFieldCoverages
                    field="coverages"

                    item={{
                        // coverages are the main value
                        coverages: this.props.value,

                        // related_events are used if available to prefill coverage fields when adding a new coverage
                        related_events: this.props.item.related_events,
                    } as IPlanningItem}

                    /**
                     * It looks like this prop is designed to accept a validation message.
                     * authoring-react field types don't accept validation messages.
                     * They are rendered higher in the component tree.
                     * We do handle it in PlanningEditorStandalone component (on save).
                     */
                    message={{}}

                    notifyValidationErrors={(errors) => {
                        for (const error of errors) {
                            superdesk.ui.notify.error(error);
                        }
                    }}

                    onChange={(fieldPath: string, value: any): void => {
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
