import React from 'react';
import moment from 'moment';

import {getUserInterfaceLanguage} from 'appConfig';
import {SEARCH_SPIKE_STATE, IDateRange, ISearchParams} from '../../interfaces';

import {renderGroupedFieldsForPanel} from '../fields';


interface IProps {
    params: ISearchParams;
    onChange<T extends keyof ISearchParams>(field: T, value: ISearchParams[T]): void;
    onChangeMultiple(updates: ISearchParams): void;
    popupContainer?(): HTMLElement;
    searchProfile: any;
    enabledField: string;
}

export class AdvancedSearch extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);
        this.onStartDateTimeChange = this.onStartDateTimeChange.bind(this);
        this.onEndDateTimeChange = this.onEndDateTimeChange.bind(this);
        this.onRelativeDateTimeChange = this.onRelativeDateTimeChange.bind(this);
    }

    componentWillReceiveProps(nextProps: Readonly<IProps>) {
        if (nextProps.params.posted && !this.props.params.posted) {
            this.props.onChange('spike_state', SEARCH_SPIKE_STATE.NOT_SPIKED);
        } else if (nextProps.params.state?.length > 0 &&
            nextProps.params.spike_state === SEARCH_SPIKE_STATE.SPIKED
        ) {
            this.props.onChange('spike_state', SEARCH_SPIKE_STATE.NOT_SPIKED);
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
                    readOnly: this.props.params.posted == true,
                },
            },
            null,
            this.props.enabledField
        );
    }
}
