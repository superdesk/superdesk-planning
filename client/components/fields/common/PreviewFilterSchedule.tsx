import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IListFieldProps, ISearchFilterSchedule} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';
import {IDesk} from 'superdesk-api';
import {getDesksById} from '../../../selectors/general';
import {getSearchFilterScheduleText} from '../../../utils/filters';
import {IconButton, IconLabel, Spacer} from 'superdesk-ui-framework/react';

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
                        <Spacer
                            h
                            gap="8"
                            justifyContent="center"
                            alignItems="center"
                            noWrap
                        >
                            {gettext('Scheduled export: {{ description }}', {description: scheduleText})}
                            <Spacer
                                h
                                noWrap
                                gap="4"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {this.props.editSchedule && (
                                    <IconButton
                                        icon="pencil"
                                        size="small"
                                        ariaValue={gettext('Edit')}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            this.props.editSchedule(this.props.item);
                                        }}
                                    />
                                )}
                                {this.props.deleteSchedule && (
                                    <IconButton
                                        icon="trash"
                                        size="small"
                                        ariaValue={gettext('Delete')}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            this.props.deleteSchedule(this.props.item);
                                        }}
                                    />
                                )}
                            </Spacer>
                        </Spacer>
                    )}
                    type="success"
                    style="translucent"
                />
            </div>
        );
    }
}

export const PreviewFieldFilterSchedule = connect(mapStateToProps)(PreviewFieldFilterScheduleComponent);
