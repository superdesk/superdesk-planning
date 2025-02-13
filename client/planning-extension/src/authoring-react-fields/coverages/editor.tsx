import * as React from 'react';
import {
    IEditorComponentProps,
    IUrlsFieldConfig,
    IUrlsFieldUserPreferences,
} from 'superdesk-api';
import {ICoveragesValueOperational} from './interfaces';
import {extensionBridge} from '../../extension_bridge';
import {IPlanningItem} from '../../../../interfaces';
import {superdesk} from '../../superdesk';
import {DebouncedChangeHOC} from '../debounced-change-hoc';
import {cloneDeep, omit, set} from 'lodash';

type IProps = IEditorComponentProps<ICoveragesValueOperational, IUrlsFieldConfig, IUrlsFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;
        const {EditorFieldCoverages} = extensionBridge.editor.fields;
        const itemIsNotSaved = this.props.item._id == null || (this.props.item._id ?? '').includes('temp-');

        return (
            <DebouncedChangeHOC
                key={(this.props.value ?? []).map((x) => x.coverage_id).join('')}
                processChangeQueue={(changeQueue, value) => {
                    const itemCopy = cloneDeep({coverages: value});

                    changeQueue.forEach((x) => {
                        set(itemCopy, x.fieldPath, x.value);
                    });

                    return itemCopy.coverages;
                }}
                onChange={this.props.onChange}
                value={
                    cloneDeep(this.props.value ?? []).map((x) => (
                        omit(x, 'planning._scheduledTime')
                    ))
                }
            >
                {(changedValue, onChange) => (
                    <EditorFieldCoverages
                        readOnly={itemIsNotSaved}
                        field="coverages"
                        item={{
                            // coverages are the main value
                            coverages: changedValue,

                            // related_events are used if available to prefill coverage fields
                            // when adding a new coverage
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
                         * sample arguments:
                         *  @fieldPath - 'coverages[0].planning.slugline'
                         *  @value - 'slugline 123'
                         */
                        onChange={onChange}
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
                )}
            </DebouncedChangeHOC>
        );
    }
}
