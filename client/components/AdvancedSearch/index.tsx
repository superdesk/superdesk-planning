import React from 'react';
import moment from 'moment';

import {getUserInterfaceLanguage} from 'appConfig';
import {SEARCH_SPIKE_STATE, IDateRange, ISearchParams, IWorkflowState} from '../../interfaces';

import {renderGroupedFieldsForPanel} from '../fields';


interface IProps {
    params: ISearchParams;
    onChange<T extends keyof ISearchParams>(field: T, value: ISearchParams[T]): void;
    onChangeMultiple(updates: ISearchParams): void;
    popupContainer?(): HTMLElement;
    searchProfile: any;
    enabledField: string;
}

const NON_PUBLISHED_STATES: Array<IWorkflowState> = [
    'draft',
    'ingested',
    'spiked',
];

export class AdvancedSearch extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);
        this.onStartDateTimeChange = this.onStartDateTimeChange.bind(this);
        this.onEndDateTimeChange = this.onEndDateTimeChange.bind(this);
        this.onRelativeDateTimeChange = this.onRelativeDateTimeChange.bind(this);
    }

    componentWillReceiveProps(nextProps: Readonly<IProps>) {
        const updates: ISearchParams = {};

        if (!this.props.params.state?.length && nextProps.params.state?.length) {
            updates.spike_state = SEARCH_SPIKE_STATE.BOTH;
            updates.include_killed = true;
        } else if (this.props.params.state?.length && !nextProps.params.state?.length) {
            updates.spike_state = SEARCH_SPIKE_STATE.NOT_SPIKED;
            updates.include_killed = false;
        }

        if (!this.props.params.posted && nextProps.params.posted && nextProps.params.state?.length) {
            const newStates = nextProps.params.state.filter(
                (state) => !NON_PUBLISHED_STATES.includes(state.qcode)
            );

            if (newStates.length != nextProps.params.state.length) {
                updates.state = newStates;
            }
        }

        if (Object.keys(updates).length) {
            this.props.onChangeMultiple(updates);
        }
    }

    onStartDateTimeChange(field: string, value: moment.Moment) {
        if (field === 'start_date.date' && this.props.params.start_date == null) {
            value.hour(0)
                .minute(0)
                .second(0);
        }

        this.props.onChangeMultiple({
            start_date: value,
            date_filter: null,
        });
    }

    onEndDateTimeChange(field: string, value: moment.Moment) {
        if (field === 'end_date.date' && this.props.params.end_date == null) {
            value.hour(23)
                .minute(59)
                .second(59);
        }

        this.props.onChangeMultiple({
            end_date: value,
            date_filter: null,
        });
    }

    onRelativeDateTimeChange(field: string, value: IDateRange) {
        this.props.onChangeMultiple({
            start_date: null,
            end_date: null,
            date_filter: value,
        });
    }

    render() {
        return renderGroupedFieldsForPanel(
            'editor',
            this.props.searchProfile,
            {
                onChange: this.props.onChange,
                popupContainer: this.props.popupContainer,
                language: getUserInterfaceLanguage(),
                item: this.props.params,
            },
            {
                start_date: {
                    canClear: true,
                    onChange: this.onStartDateTimeChange,
                },
                end_date: {
                    canClear: true,
                    onChange: this.onEndDateTimeChange,
                },
                date_filter: {
                    onChange: this.onRelativeDateTimeChange,
                },
                spike_state: {
                    enabled: (
                        !this.props.params.posted &&
                        !this.props.params.state?.length
                    ),
                },
                agendas: {
                    enabled: !this.props.params.no_agenda_assigned && this.props.enabledField !== 'search_enabled',
                },
                g2_content_type: {
                    enabled: !this.props.params.no_coverage,
                },
                calendars: {
                    enabled: !this.props.params.no_calendar_assigned && this.props.enabledField !== 'search_enabled',
                },
                include_killed: {
                    enabled: !this.props.params.state?.length,
                },
                exclude_rescheduled_and_cancelled: {
                    enabled: !this.props.params.state?.length,
                },
                state: {
                    excludeOptions: !this.props.params.posted ? [] : NON_PUBLISHED_STATES,
                },
                location: {
                    disableAddLocation: false,
                },
            },
            null,
            this.props.enabledField
        );
    }
}
