import React from 'react';
import {connect} from 'react-redux';
import {cloneDeep} from 'lodash';
import {getLocalizedHourOptions} from '../../utils/filters';
import {superdeskApi} from '../../superdeskApi';
import {IDesk} from 'superdesk-api';
import {
    IEventsPlanningContentPanelProps,
    ISearchFilterSchedule,
    ISearchFilter,
    SCHEDULE_FREQUENCY,
    WEEK_DAY,
} from '../../interfaces';
import {SidePanel, ToggleBox} from '../UI';
import {renderFieldsForPanel} from '../fields';
import {desks as getDesks} from '../../selectors/general';

interface IProps extends IEventsPlanningContentPanelProps {
    desks: Array<IDesk>;
}

interface IState {
    pristine: boolean;
    schedule: Partial<ISearchFilterSchedule>;
    invalid: boolean;
    errors: {[key: string]: string};
}

const mapStateToProps = (state) => ({
    desks: getDesks(state),
});

export class EditFilterScheduleComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {
            pristine: false,
            schedule: cloneDeep(this.props.filter.schedules?.[0] ?? {
                frequency: SCHEDULE_FREQUENCY.HOURLY,
                desk: this.props.desks[0]._id,
            }),
            invalid: false,
            errors: {},
        };

        this.onSaveHandler = this.onSaveHandler.bind(this);
        this.previewFilter = this.previewFilter.bind(this);
        this.onChange = this.onChange.bind(this);
        this.updateHour = this.updateHour.bind(this);
        this.addHour = this.addHour.bind(this);
        this.removeHour = this.removeHour.bind(this);
    }

    onSaveHandler() {
        const schedule = Object.assign({}, this.state.schedule);

        switch (schedule.frequency) {
        case SCHEDULE_FREQUENCY.HOURLY:
            delete schedule.hour;
            delete schedule.day;
            delete schedule.week_days;
            break;
        case SCHEDULE_FREQUENCY.WEEKLY:
            delete schedule.day;
            if (!schedule.week_days?.length) {
                schedule.week_days = [
                    WEEK_DAY.SUNDAY,
                    WEEK_DAY.MONDAY,
                    WEEK_DAY.TUESDAY,
                    WEEK_DAY.WEDNESDAY,
                    WEEK_DAY.THURSDAY,
                    WEEK_DAY.FRIDAY,
                    WEEK_DAY.SATURDAY,
                ];
            }
            break;
        case SCHEDULE_FREQUENCY.MONTHLY:
            delete schedule.week_days;
            break;
        }

        this.props.onSave({
            ...this.props.filter,
            schedules: [schedule as ISearchFilterSchedule],
        }).then(() => this.props.onClose());
    }

    previewFilter() {
        this.props.previewFilter(this.props.filter as ISearchFilter);
    }

    onChange<T extends keyof ISearchFilterSchedule>(field: T, value: ISearchFilterSchedule[T]) {
        const schedule = {...this.state.schedule};

        schedule[field] = value;

        if (field === 'frequency' && value === 'weekly') {
            // When changing the frequency to weekly
            // If the week_days array is empty, delete the attribute
            // This enabled the input field to automatically select all days
            // Which converts this to a 'daily' schedule automatically
            if (!schedule.week_days?.length) {
                delete schedule.week_days;
            }
        }

        this.setState({schedule});
    }

    updateHour(index: number, value: string) {
        const hours = [...(this.state.schedule.hours ?? [])];
        hours[index] = value === '-1' ? '' : value;

        this.setState({
            schedule: {...this.state.schedule, hours},
            pristine: false,
        });
    }

    addHour() {
        const hours = [...(this.state.schedule.hours ?? []), '-1'];
        this.setState({
            schedule: {...this.state.schedule, hours},
            pristine: false,
        });
    }

    removeHour(index: number) {
        const hours = [...(this.state.schedule.hours ?? [])];
        hours.splice(index, 1);

        this.setState({
            schedule: {...this.state.schedule, hours},
            pristine: false,
        });
    }

    getScheduleProfile() {
        const profile = {
            frequency: {enabled: true, index: 1},
            week_days: {enabled: false, index: 2},
            month_day: {enabled: false, index: 3},
        };

        switch (this.state.schedule.frequency) {
            case SCHEDULE_FREQUENCY.WEEKLY:
                profile.week_days.enabled = true;
                break;
            case SCHEDULE_FREQUENCY.MONTHLY:
                profile.month_day.enabled = true;
                break;
        }

        return profile;
    }

    renderTimeInputs() {
        const {gettext} = superdeskApi.localization;
        const {schedule} = this.state;

        if (
            schedule.frequency !== SCHEDULE_FREQUENCY.WEEKLY &&
            schedule.frequency !== SCHEDULE_FREQUENCY.MONTHLY
        ) {
            return null;
        }

        const hourOptions = getLocalizedHourOptions();

        return (
            <div className="form__row">
                <label className="form__label">{gettext('HOUR')}</label>
                <div className="form__row-items">
                    {(schedule.hours ?? []).map((time, idx) => (
                        <div
                            className="form__row-item--flex sd-flex sd-align-items-center sd-gap-x--1 sd-m-b--1"
                            key={idx}
                            data-test-id={`time-slot-${idx}`}
                        >
                            <select
                                data-test-id={idx === 0 ? 'field-hour' : `field-hour-${idx}`}
                                value={time || '-1'}
                                className="sd-input__input sd-input__select sd-input__input--default"
                                onChange={(e) => this.updateHour(idx, e.target.value)}
                            >
                                {hourOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="btn btn--hollow btn--small"
                                onClick={() => this.removeHour(idx)}
                                data-test-id={`remove-hour-${idx}`}
                            >
                                {gettext('Remove')}
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="btn btn--hollow btn--small"
                        onClick={this.addHour}
                        data-test-id="add-hour"
                    >
                        {gettext('+ Add Time')}
                    </button>
                </div>
            </div>
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const scheduleProfile = this.getScheduleProfile();

        return (
            <React.Fragment>
                <SidePanel.Header className="side-panel__header--border-b">
                    <div className="subnav__sliding-toolbar">
                        <h3 className="side-panel__heading">
                            {gettext('Filter Schedule')}
                        </h3>
                        <div className="button-group button-group--right">
                            <button
                                className="btn"
                                key="cancel"
                                onClick={this.previewFilter}
                            >
                                {gettext('Cancel')}
                            </button>
                            <button
                                className="btn btn--primary"
                                key="save"
                                onClick={this.onSaveHandler}
                                disabled={this.state.pristine || this.state.invalid}
                                data-test-id="manage-filters--save-schedule"
                            >
                                {this.props.filter?._id == null ?
                                    gettext('Create') :
                                    gettext('Save')
                                }
                            </button>
                        </div>
                    </div>
                </SidePanel.Header>
                <SidePanel.Content>
                    <SidePanel.ContentBlock flex={true}>
                        <SidePanel.ContentBlockInner grow={true}>
                            {renderFieldsForPanel(
                                'editor',
                                scheduleProfile,
                                {
                                    item: this.state.schedule,
                                    onChange: this.onChange,
                                },
                                {
                                    week_days: {
                                        defaultAllOn: true,
                                    },
                                    month_day: {
                                        field: 'day',
                                    },
                                }
                            )}

                            {this.renderTimeInputs()}

                            <ToggleBox
                                title={gettext('Destination')}
                                isOpen={true}
                                style="toggle-box--circle"
                                noMargin={true}
                            >
                                {renderFieldsForPanel(
                                    'editor',
                                    {
                                        desk: {enabled: true, index: 1},
                                        content_template: {enabled: true, index: 2},
                                        export_template: {enabled: true, index: 3},
                                    },
                                    {
                                        item: this.state.schedule,
                                        onChange: this.onChange,
                                    },
                                    {
                                        content_template: {
                                            field: 'article_template',
                                            label: gettext('Article Template'),
                                            deskId: this.state.schedule.desk,
                                            clearable: true,
                                        },
                                        export_template: {
                                            field: 'template',
                                            label: gettext('Custom Layout'),
                                            itemType: this.props.filter.item_type,
                                            clearable: true,
                                        },
                                    },
                                )}
                            </ToggleBox>
                        </SidePanel.ContentBlockInner>
                    </SidePanel.ContentBlock>
                </SidePanel.Content>
            </React.Fragment>
        );
    }
}

export const EditFilterSchedule = connect(mapStateToProps)(EditFilterScheduleComponent);
