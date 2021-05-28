import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IListFieldProps, ISearchFilterSchedule} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';
import {IDesk} from 'superdesk-api';
import {getDesksById} from '../../../selectors/general';
import {getSearchFilterScheduleText} from '../../../utils/filters';
import {IconButton, IconLabel} from 'superdesk-ui-framework/react';

interface IProps extends IListFieldProps {
    desks: {[key: string]: IDesk};
    editSchedule?(schedule: ISearchFilterSchedule): void;
    deleteSchedule?(schedule: ISearchFilterSchedule): void;
}

const mapStateToProps = (state) => ({
    desks: getDesksById(state),
});

export class PreviewFieldFilterScheduleComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'schedules[0]';
        const schedule = get(this.props.item, field) as ISearchFilterSchedule;

        if (!schedule) {
            return null;
        }

        const scheduleText = getSearchFilterScheduleText(schedule, this.props.desks);

        return (
            <div className="sd-list-item--element-grow">
                <IconLabel
                    icon="time"
                    text={(
                        <React.Fragment>
                            {gettext('Scheduled export: {{ description }}', {description: scheduleText})}
                            <span className="sd-margin-l--1">
                                {this.props.editSchedule == null ? null : (
                                    <IconButton
                                        icon="pencil"
                                        ariaValue={gettext('Edit schedule')}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            this.props.editSchedule(this.props.item);
                                        }}
                                    />
                                )}
                                {this.props.deleteSchedule == null ? null : (
                                    <IconButton
                                        icon="trash"
                                        ariaValue={gettext('Delete schedule')}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            this.props.deleteSchedule(this.props.item);
                                        }}
                                    />
                                )}
                            </span>
                        </React.Fragment>
                    )}
                    type="success"
                    style="translucent"
                />
            </div>
        );
    }
}

export const PreviewFieldFilterSchedule = connect(mapStateToProps)(PreviewFieldFilterScheduleComponent);
