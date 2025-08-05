import React from 'react';
import {connect} from 'react-redux';
import {cloneDeep} from 'lodash';

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
        const original = this.props.filter.schedules?.[0];

        this.state = {
            pristine: false,
            schedule: cloneDeep(original ?? {
                frequency: SCHEDULE_FREQUENCY.HOURLY,
                desk: this.props.desks[0]._id,
                hours: [],
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
        const schedule = {...this.state.schedule};

        // Clean up legacy `hour` field
        delete schedule.hour;

        // Default single hour if not set
        if (schedule.frequency === SCHEDULE_FREQUENCY.WEEKLY || schedule.frequency === SCHEDULE_FREQUENCY.MONTHLY) {
            schedule.hours = schedule.hours ?? [];
        } else {
            delete schedule.hours;
        }

        if (schedule.frequency === SCHEDULE_FREQUENCY.WEEKLY && !schedule.week_days?.length) {
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

        if (field === 'frequency') {
            if (value === SCHEDULE_FREQUENCY.WEEKLY || value === SCHEDULE_FREQUENCY.MONTHLY) {
                schedule.hours = [];
            } else {
                delete schedule.hours;
            }
        }

        this.setState({schedule});
    }

    updateHour(index: number, value: string) {
        const hours = [...(this.state.schedule.hours ?? [])];

        hours[index] = value;
        this.setState({schedule: {...this.state.schedule, hours}});
    }

    addHour() {
        const used = new Set(this.state.schedule.hours ?? []);
        const allHours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        const next = allHours.find((h) => !used.has(h)) || '00:00';

        const hours = [...(this.state.schedule.hours ?? []), next];

        this.setState({schedule: {...this.state.schedule, hours}});
    }

    removeHour(index: number) {
        const hours = [...(this.state.schedule.hours ?? [])];

        hours.splice(index, 1);
        this.setState({schedule: {...this.state.schedule, hours}});
    }

    getScheduleProfile() {
        const profile = {
            frequency: {enabled: true, index: 1},
            week_days: {enabled: false, index: 2},
            month_day: {enabled: false, index: 3},
        };

        switch (this.state.schedule.frequency) {
        case SCHEDULE_FREQUENCY.HOURLY:
            break;
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

        const hourOptions = Array.from({length: 24}).map((_, i) => {
            const value = `${i.toString().padStart(2, '0')}:00`;

            return (
                <option key={value} value={value}>
                    {value}
                </option>
            );
        });

        return (
            <div className="form__row">
                <label className="form__label">{gettext('HOUR')}</label>
                <div className="form__row-items">
                    {(schedule.hours ?? []).map((time, idx) => (
                        <div
                            className="form__row-item--flex sd-flex sd-align-items-center sd-gap-x--1 sd-m-b--1"
                            key={idx}
                        >
                            <select
                                data-test-id={`field-hour-${idx}`}
                                value={time}
                                className="sd-input__input sd-flex-grow sd-min-width--100"
                                onChange={(e) => this.updateHour(idx, e.target.value)}
                            >
                                {hourOptions}
                            </select>
                            <button
                                type="button"
                                className="btn btn--hollow btn--small"
                                onClick={() => this.removeHour(idx)}
                            >
                                {gettext('Remove')}
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="btn btn--hollow btn--small"
                        onClick={this.addHour}
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
