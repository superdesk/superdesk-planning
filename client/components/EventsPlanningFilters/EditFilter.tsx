import React from 'react';
import {pick, isEqual, cloneDeep, set, get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {superdeskApi, planningApi} from '../../superdeskApi';
import {
    ISearchFilter,
    IEventsPlanningContentPanelProps,
    FILTER_TYPE,
    ISearchParams,
} from '../../interfaces';

import {SidePanel} from '../UI';
import {gettext, eventPlanningUtils} from '../../utils';
import {AdvancedSearch} from '../AdvancedSearch';
import {renderFieldsForPanel} from '../fields';

interface IState {
    pristine: boolean;
    filter: Partial<ISearchFilter>;
    invalid: boolean;
    errors: {[key: string]: string};
    profile: any;
}

export class EditFilter extends React.Component<IEventsPlanningContentPanelProps, IState> {
    private popupContainer: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);
        const filter = this.props.filter != null ?
            cloneDeep(this.props.filter) :
            eventPlanningUtils.defaultFilterValues();

        this.state = {
            pristine: true,
            filter: filter,
            invalid: false,
            errors: {},
            profile: this.getProfile(filter.item_type),
        };

        this.onFilterChange = this.onFilterChange.bind(this);
        this.onParamChange = this.onParamChange.bind(this);
        this.onMultiParamChange = this.onMultiParamChange.bind(this);
        this.onSaveHandler = this.onSaveHandler.bind(this);
        this.isPristine = this.isPristine.bind(this);
        this.getPopupContainer = this.getPopupContainer.bind(this);
        this.onTypeChanged = this.onTypeChanged.bind(this);

        this.popupContainer = React.createRef();
    }

    getProfile(itemType: FILTER_TYPE = FILTER_TYPE.COMBINED) {
        switch (itemType) {
        case FILTER_TYPE.EVENTS:
            return planningApi.events.getSearchProfile();
        case FILTER_TYPE.PLANNING:
            return planningApi.planning.getSearchProfile();
        case FILTER_TYPE.COMBINED:
            return planningApi.combined.getSearchProfile();
        }
    }

    onTypeChanged(field: string, value: FILTER_TYPE) {
        this.setState({profile: this.getProfile(value)});
        this.onFilterChange(field, value);
    }

    getPopupContainer() {
        return this.popupContainer.current;
    }

    isPristine(updates: Partial<ISearchFilter> = null) {
        return this.state.filter.name == updates?.name &&
            this.state.filter.item_type == updates?.item_type &&
            isEqual(this.state.filter.params, updates?.params);
    }

    onFilterChange(field: string, value: any) {
        const updates = cloneDeep(this.state.filter);
        let newValue = value;

        if (field === 'name') {
            newValue = value.replace(/^\s+/, '');
        } else if (Array.isArray(value) && value.length === 0) {
            newValue = [];
        }

        set(updates, field, newValue);

        const pristine = this.isPristine(updates);
        let invalid = false, errors = {};

        if (!pristine) {
            ({invalid, errors} = this.isInValid(updates));
        }

        this.setState({
            filter: updates,
            pristine: pristine,
            invalid: invalid,
            errors: errors,
        });
    }

    onParamChange(field: string, value: any) {
        let newValue = value;

        if (typeof value === 'string') {
            // Remove whitespace from the string
            newValue = value.replace(/^\s+/, '');

            if (newValue.length === 0) {
                newValue = null;
            }
        } else if (Array.isArray(value) && value.length === 0) {
            newValue = null;
        }

        this.onFilterChange(`params.${field}`, newValue);
    }

    onMultiParamChange(updates: ISearchParams) {
        const filter = cloneDeep(this.state.filter);

        Object.keys(updates).forEach((field) => {
            const value = get(updates, field);

            if (Array.isArray(value) && value.length === 0) {
                set(filter.params, field, null);
            } else {
                set(filter.params, field, value);
            }
        });

        const pristine = this.isPristine(filter);
        let invalid = false, errors = {};

        if (!pristine) {
            ({invalid, errors} = this.isInValid(filter));
        }

        this.setState({
            filter,
            pristine,
            invalid,
            errors,
        });
    }

    isInValid(updates) {
        const errors: {[key: string]: string} = {};

        if ((get(updates, 'name') || '').replace(/^\s+/, '').length === 0) {
            errors.name = gettext('Name is required.');
        }

        return {
            invalid: Object.keys(errors).length > 0,
            errors: errors,
        };
    }

    onSaveHandler() {
        const {onClose, onSave, filter} = this.props;
        const updates = pick(this.state.filter, ['name', 'item_type', 'params']);
        const updateFilter: Partial<ISearchFilter> = {
            ...filter ?? {},
            ...updates,
        };

        onSave(updateFilter).then(() => onClose());
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {onClose} = this.props;
        const {pristine, invalid, profile} = this.state;

        return (
            <React.Fragment>
                <SidePanel.Header className="side-panel__header--border-b">
                    <div className="subnav__sliding-toolbar">
                        <h3 className="side-panel__heading">
                            {gettext('Filter Details')}
                        </h3>
                        <div className="button-group button-group--right">
                            <button
                                className="btn"
                                key="cancel"
                                onClick={onClose}
                            >
                                {gettext('Cancel')}
                            </button>
                            <button
                                className="btn btn--primary"
                                key="save"
                                onClick={this.onSaveHandler}
                                disabled={pristine || invalid}
                                data-test-id="manage-filters--save-filter"
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
                                {
                                    name: {enabled: true, index: 1},
                                    item_type: {enabled: true, index: 2},
                                },
                                {
                                    onChange: this.onFilterChange,
                                    popupContainer: this.getPopupContainer,
                                    language: getUserInterfaceLanguage(),
                                    item: this.state.filter,
                                },
                                {
                                    name: {
                                        label: gettext('Filter Name'),
                                        autoFocus: true,
                                        required: true,
                                        testId: 'field-filter_name',
                                    },
                                    item_type: {
                                        onChange: this.onTypeChanged,
                                    },
                                }
                            )}
                            <AdvancedSearch
                                params={this.state.filter.params}
                                onChange={this.onParamChange}
                                onChangeMultiple={this.onMultiParamChange}
                                searchProfile={profile}
                                popupContainer={this.getPopupContainer}
                                enabledField="filter_enabled"
                            />
                        </SidePanel.ContentBlockInner>
                    </SidePanel.ContentBlock>
                </SidePanel.Content>
                <div ref={this.popupContainer} />
            </React.Fragment>
        );
    }
}
