import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';
import moment from 'moment';

import {
    ICoverageScheduledUpdate,
    IEditorFieldProps,
    IG2ContentType,
    IGenre,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus
} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import * as selectors from '../../../selectors';

import {Button} from 'superdesk-ui-framework/react';
import {Row, LineInput, Label} from '../../UI/Form';
import {ScheduledUpdate} from '../../Coverages';

interface IProps extends IEditorFieldProps {
    index: number;
    readOnly?: boolean;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    contentTypes: Array<IG2ContentType>;
    genres: Array<IGenre>;
    openScheduledUpdates: Array<any>;
    canCreateScheduledUpdate?: boolean;

    onRemoveAssignment(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate: any,
        scheduledUpdateIndex: number
    ): void;
    setCoverageDefaultDesk(coverage: IPlanningCoverageItem): void;
    onRemoveScheduledUpdate(indexToRemove: number): void;
    onScheduleChanged(field: string, newValue: moment.Moment): void;
    onScheduledUpdateClose(scheduledUpdate: ICoverageScheduledUpdate): void;
    onScheduledUpdateOpen(scheduledUpdate: ICoverageScheduledUpdate): void;
    onAddScheduledUpdate(): void;
}

const mapStateToProps = (state) => ({
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    contentTypes: selectors.general.contentTypes(state),
    genres: state.genres,
});

class EditorFieldScheduledUpdatesComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'scheduled_updates';
        const value = get(this.props.item, field, []);

        return (
            <Row testId={this.props.testId}>
                <LineInput>
                    <Label text={this.props.label ?? gettext('Scheduled Updates')} />
                </LineInput>
                {value.map((s: ICoverageScheduledUpdate, index: number) => (
                    <ScheduledUpdate
                        {...this.props}
                        testId={`${this.props.testId}[${index}]`}
                        diff={this.props.item}
                        key={index}
                        value={s}
                        field={field}
                        coverageIndex={this.props.index}
                        index={index}
                        newsCoverageStatus={this.props.newsCoverageStatus}
                        readOnly={this.props.readOnly}
                        contentTypes={this.props.contentTypes}
                        onRemoveAssignment={this.props.onRemoveAssignment}
                        setCoverageDefaultDesk={this.props.setCoverageDefaultDesk}
                        onRemove={this.props.onRemoveScheduledUpdate.bind(null, index)}
                        onScheduleChanged={this.props.onScheduleChanged}
                        genres={this.props.genres}
                        onClose={this.props.onScheduledUpdateClose}
                        onOpen={this.props.onScheduledUpdateOpen}
                        openScheduledUpdates={this.props.openScheduledUpdates}
                        onChange={this.props.onChange}
                    />
                ))}
                {!this.props.canCreateScheduledUpdate ? null : (
                    <Button
                        type="primary"
                        text={gettext('Schedule an update')}
                        onClick={this.props.onAddScheduledUpdate}
                    />
                )}
            </Row>
        );
    }
}

export const EditorFieldScheduledUpdates = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldScheduledUpdatesComponent);
