import React from 'react';
import moment from 'moment';

import {superdeskApi} from '../../superdeskApi';
import {IDesk} from 'superdesk-api';
import {SEARCH_SPIKE_STATE, IDateRange, ISearchParams, IAssignmentSearchParams, IWorkflowState} from '../../interfaces';

import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {renderGroupedFieldsForPanel} from '../fields';

interface ICommonParams {
    searchProfile: any;
    enabledField: string;
    filterUsersByDesk?: IDesk['_id'];
    popupContainer?(): HTMLElement;
}

interface IEventPlanningSearchProps extends ICommonParams {
    type: 'event_planning';
    params: ISearchParams;
    onChange<T extends keyof ISearchParams>(field: T, value: ISearchParams[T]): void;
    onChangeMultiple(updates: ISearchParams): void;
}

interface IAssignmentSearchProps extends ICommonParams {
    type: 'assignments';
    params: IAssignmentSearchParams;
    onChange<T extends keyof IAssignmentSearchParams>(field: T, value: IAssignmentSearchParams[T]): void;
    onChangeMultiple(updates: IAssignmentSearchParams): void;
}

type IProps = IEventPlanningSearchProps | IAssignmentSearchProps;

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
        if (this.props.type === 'event_planning' && nextProps.type === 'event_planning') {
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
    }

    onStartDateTimeChange(field: string, value: moment.Moment) {
        const startDate = this.props.type === 'event_planning' ?
            this.props.params.start_date :
            this.props.params.startDate;

        if (field === 'start_date.date' && startDate == null) {
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
        const endDate = this.props.type === 'event_planning' ?
            this.props.params.end_date :
            this.props.params.endDate;

        if (field === 'end_date.date' && endDate == null) {
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
        if (this.props.type === 'event_planning') {
            this.props.onChangeMultiple({
                start_date: null,
                end_date: null,
                date_filter: value,
            });
        } else {
            this.props.onChangeMultiple({
                startDate: null,
                endDate: null,
                dateFilter: value,
            });
        }
    }

    render() {
        const customTextFields = Object.keys(this.props.searchProfile)
            .filter((field) => superdeskApi.entities.vocabulary.getVocabulary(field)?.field_type === 'text')
            .reduce((prev, field) => ({
                ...prev,
                [field]: {storageField: `customText.${field}`},
            }), {});

        return renderGroupedFieldsForPanel(
            'editor',
            this.props.searchProfile,
            {
                onChange: this.props.onChange,
                popupContainer: this.props.popupContainer,
                language: getUserInterfaceLanguageFromCV(),
                item: this.props.params,
                schema: {},
            },
            {
                ...customTextFields,
                user: {
                    field: 'userIds',
                    valueStoredAsArray: true,
                    deskId: this.props.filterUsersByDesk,
                },
                content_type: {
                    field: 'contentType',
                },
                multiple_content: {
                    field: 'multipleContent',
                },
                genre: {
                    clearable: true,
                },
                assignment_priority: {
                    field: 'assignmentPriority',
                    noTitleInPopup: true,
                    clearable: true,
                },
                anpa_category: {
                    field: this.props.type === 'assignments' ? 'anpaCategory' : 'anpa_category',
                },
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
                        this.props.type === 'event_planning'
                        && !this.props.params.posted
                        && !this.props.params.state?.length
                    ),
                },
                agendas: {
                    enabled: (
                        this.props.type === 'event_planning'
                        && !this.props.params.no_agenda_assigned
                        && this.props.enabledField !== 'search_enabled'
                    ),
                },
                g2_content_type: {
                    enabled: this.props.type === 'assignments' || !this.props.params.no_coverage,
                },
                calendars: {
                    enabled: (
                        this.props.type === 'event_planning'
                        && !this.props.params.no_calendar_assigned
                        && this.props.enabledField !== 'search_enabled'
                    ),
                },
                include_killed: {
                    enabled: this.props.type === 'event_planning' && !this.props.params.state?.length,
                },
                exclude_rescheduled_and_cancelled: {
                    enabled: this.props.type === 'event_planning' && !this.props.params.state?.length,
                },
                state: {
                    excludeOptions: this.props.type === 'event_planning' && !this.props.params.posted ?
                        [] :
                        NON_PUBLISHED_STATES,
                },
                location: {
                    disableAddLocation: false,
                },
                priority: {
                    multiple: true,
                    defaultValue: [],
                },
                urgency: {
                    valueAsString: false,
                },
            },
            null,
            this.props.enabledField
        );
    }
}
