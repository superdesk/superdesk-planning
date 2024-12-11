import * as React from 'react';
import {
    IEditorComponentProps,
    IUrlsFieldConfig,
    IUrlsFieldUserPreferences,
} from 'superdesk-api';
import {ICoveragesValueOperational} from './interfaces';
import {cloneDeep, noop, set} from 'lodash';

type IProps = IEditorComponentProps<ICoveragesValueOperational, IUrlsFieldConfig, IUrlsFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        // PR-TODO: consume from extensions bridge
        const {EditorFieldCoverages} = window as any;

        return (
            <Container>
                <EditorFieldCoverages
                    item={{
                        // coverages are the main value
                        coverages: this.props.value,

                        // related_events are used if available to prefill coverage fields when adding a new coverage
                        related_events: this.props.item.related_events,
                    }}
                    // PR-TODO: implement functions below
                    onAddCoverageToWorkflow={noop}
                    onRemoveAssignment={noop}
                    setCoverageDefaultDesk={noop}
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
