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


                /**
                 * sample of arguments:
                 *      fieldPath - 'coverages[0].planning.slugline'
                 *      value - 'slugline 123'
                 */
                onChange={(fieldPath: string, value: any): void => {
                    /**
                     * timeout is used to permit multiple calls in a single event loop
                     *
                     * e.g. we have an item {a: 5, b: 10} and execute the following code:
                     * onChange({fieldPath: 'a', value: 6})
                     * onChange({fieldPath: 'b', value: 10})
                     *
                     * since we clone this.props.value and apply the changes,
                     * only the values in the last call would get applied.
                     * with setTimeout we wait for re-render so we have the latest this.props.value
                     */
                    setTimeout(() => {
                        const item = cloneDeep({coverages: this.props.value});
                        const nextValue = set(item, fieldPath, value);

                        for (const coverage of nextValue.coverages) {
                            if (coverage.planning != null) {
                                delete coverage.planning['_scheduledTime'];
                            }
                        }

                        this.props.onChange(nextValue.coverages);
                    });
                }}
            >
                {({addButtonElement, itemsElement, errorMessageElement, emptyValueElement}) => {
                    const miniToolbar = (
                        <div
                            data-test-id="editor--planning-item__add-coverage"
                            style={{display: 'flex'}}
                        >
                            {addButtonElement}
                        </div>
                    );

                    return (
                        <Container miniToolbar={miniToolbar}>
                            {(this.props.value ?? []).length < 1 ? (
                                emptyValueElement
                            ) : (
                                <>
                                    {errorMessageElement}
                                    {itemsElement}
                                </>
                            )}
                        </Container>
                    );
                }}
            </EditorFieldCoverages>
        );
    }
}
