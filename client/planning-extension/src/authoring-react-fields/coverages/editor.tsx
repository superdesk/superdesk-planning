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

type IProps = IEditorComponentProps<ICoveragesValueOperational, IUrlsFieldConfig, IUrlsFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;
        const {EditorFieldCoverages} = extensionBridge.editor.fields;

        return (
            <DebouncedChangeHOC onChange={this.props.onChange} value={this.props.value}>
                {(changedValue, onChange) => (
                    <EditorFieldCoverages
                        field="coverages"
                        item={{
                            // coverages are the main value
                            coverages: changedValue,

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
                         * sample arguments:
                         *  @fieldPath - 'coverages[0].planning.slugline'
                         *  @value - 'slugline 123'
                         */
                        onChange={onChange}
                    >
                        {({addButtonElement, itemsElement, errorMessageElement}) => {
                            const miniToolbar = (
                                <div data-test-id="editor--planning-item__add-coverage">{addButtonElement}</div>
                            );

                            return (
                                <Container miniToolbar={miniToolbar}>
                                    {errorMessageElement}
                                    {itemsElement}
                                </Container>
                            );
                        }}
                    </EditorFieldCoverages>
                )}
            </DebouncedChangeHOC>
        );
    }
}
