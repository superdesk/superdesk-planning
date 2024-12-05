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
                    item={{coverages: this.props.value}}
                    // PR-TODO: implement functions below
                    onDuplicateCoverage={noop}
                    onCancelCoverage={noop}
                    onAddCoverageToWorkflow={noop}
                    onRemoveAssignment={noop}
                    setCoverageDefaultDesk={noop}
                    onChange={(fieldPath, value) => { // 'coverages[0].planning.slugline', 'planning 1 coverage12'
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
