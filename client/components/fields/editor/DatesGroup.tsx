import React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {ISearchProfile} from '../../../interfaces';
import {ContentDivider} from 'superdesk-ui-framework/react';

import {renderFieldsForPanel} from '../../fields';
import {ToggleBox} from '../../UI/ToggleBox';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';

interface IProps {
    searchProfile: ISearchProfile;
    params: {[key: string]: any};
    onChange<T extends keyof any>(field: T, value: any): void;
    onChangeMultiple(updates: {[key: string]: any}): void;
    popupContainer?(): HTMLElement;
    enabledField: string;
    onStartDateTimeChange(field: string, value: any): void;
    onEndDateTimeChange(field: string, value: any): void;
    onRelativeDateTimeChange(field: string, value: any): void;
}

export class DatesGroup extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const eventPlanningDateProfile = {
            ...(this.props.searchProfile.start_date ? {start_date: this.props.searchProfile.start_date} : {}),
            ...(this.props.searchProfile.end_date ? {end_date: this.props.searchProfile.end_date} : {}),
            ...(this.props.searchProfile.date_filter ? {date_filter: this.props.searchProfile.date_filter} : {}),
        };
        const creationDateProfile = this.props.searchProfile.creation_date ? {
            creation_date: this.props.searchProfile.creation_date,
        } : {};

        if (!Object.keys(eventPlanningDateProfile).length && !Object.keys(creationDateProfile).length) {
            return null;
        }

        return (
            <ToggleBox isOpen={false} title={gettext('Dates')} testId="toggle-dates">
                {Object.keys(eventPlanningDateProfile).length ? (
                    <React.Fragment>
                        <ContentDivider type="dashed" margin="small">
                            <span style={{fontWeight: 'normal'}}>{gettext('Event/Planning date')}</span>
                        </ContentDivider>
                        {renderFieldsForPanel(
                            'editor',
                            eventPlanningDateProfile,
                            {
                                onChange: this.props.onChange,
                                popupContainer: this.props.popupContainer,
                                language: getUserInterfaceLanguageFromCV(),
                                item: this.props.params,
                                onChangeMultiple: this.props.onChangeMultiple,
                                schema: {},
                            },
                            {
                                start_date: {
                                    canClear: true,
                                    onChange: this.props.onStartDateTimeChange,
                                },
                                end_date: {
                                    canClear: true,
                                    onChange: this.props.onEndDateTimeChange,
                                },
                                date_filter: {
                                    onChange: this.props.onRelativeDateTimeChange,
                                },
                            },
                            null,
                            'dates',
                            this.props.enabledField
                        )}
                    </React.Fragment>
                ) : null}

                {Object.keys(creationDateProfile).length ? (
                    <React.Fragment>
                        <ContentDivider type="dashed" margin="small">
                            <span style={{fontWeight: 'normal'}}>{gettext('Creation date')}</span>
                        </ContentDivider>
                        {renderFieldsForPanel(
                            'editor',
                            creationDateProfile,
                            {
                                onChange: this.props.onChange,
                                popupContainer: this.props.popupContainer,
                                language: getUserInterfaceLanguageFromCV(),
                                item: this.props.params,
                                onChangeMultiple: this.props.onChangeMultiple,
                                schema: {},
                            },
                            {
                                creation_date: {
                                    onChangeMultiple: this.props.onChangeMultiple,
                                },
                            },
                            null,
                            'dates',
                            this.props.enabledField
                        )}
                    </React.Fragment>
                ) : null}
            </ToggleBox>
        );
    }
}
