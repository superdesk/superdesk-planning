import React from 'react';
import PropTypes from 'prop-types';
import {pick, isEqual, cloneDeep, set, get} from 'lodash';
import {SlideInPanel, Form} from '../UI';
import {gettext, eventPlanningUtils} from '../../utils';
import {SelectMetaTermsInput} from '../UI/Form';

export class EditFilter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pristine: true,
            filter: eventPlanningUtils.defaultFilterValues(),
            invalid: false,
            errors: {},
        };

        this.onChange = this.onChange.bind(this);
        this.onSaveHandler = this.onSaveHandler.bind(this);
        this.isPristine = this.isPristine.bind(this);
        this.getPopupContainer = this.getPopupContainer.bind(this);
        this.dom = {popupContainer: null};
        this.editableFields = ['name', 'calendars', 'agendas'];
    }

    componentWillMount() {
        const {filter} = this.props;

        if (filter) {
            this.setState({filter: cloneDeep(filter)});
        }
    }

    getPopupContainer() {
        return this.dom.popupContainer;
    }

    isPristine(updates = null) {
        const updated = pick(updates || this.state.filter, this.editableFields);
        const original = pick(this.props.filter || eventPlanningUtils.defaultFilterValues(), this.editableFields);

        return isEqual(updated, original);
    }

    onChange(field, value) {
        const updates = cloneDeep(this.state.filter);
        let newValue = value;

        if (field === 'name') {
            newValue = value.replace(/^\s+/, '');
        } else if ((field === 'calendars' || field === 'agendas') && !value) {
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

    isInValid(updates) {
        const errors = {};

        if ((get(updates, 'name') || '').replace(/^\s+/, '').length === 0) {
            errors.name = gettext('Name is required.');
        }

        if (get(updates, 'calendars.length', 0) === 0 && get(updates, 'agendas.length', 0) === 0) {
            errors.agendas = errors.calendars = gettext('Either Calendar or Agenda is required.');
        }
        return {
            invalid: Object.keys(errors).length > 0,
            errors: errors,
        };
    }

    onSaveHandler() {
        const {onClose, onSave, filter} = this.props;
        const updates = pick(this.state.filter, this.editableFields);
        const updateFilter = {
            ...filter,
            ...updates,
        };

        onSave(updateFilter)
            .then(() => onClose());
    }

    render() {
        const {
            onClose,
            enabledCalendars,
            enabledAgendas,
        } = this.props;
        const {pristine, invalid, errors, filter} = this.state;
        let tools = [<a className="btn" key="cancel" onClick={onClose}>{gettext('Cancel')}</a>];

        if (!pristine && !invalid) {
            tools.push(
                <a className="btn btn--primary" key="save" onClick={this.onSaveHandler}>{gettext('Save')}</a>
            );
        }

        return (
            <SlideInPanel.Panel>
                <SlideInPanel.Header tools={tools} />
                <SlideInPanel.Content>
                    <Form.Row>
                        <Form.TextInput
                            field="name"
                            label={gettext('Name')}
                            required={true}
                            value={filter.name}
                            onChange={this.onChange}
                            autoFocus={true}
                            message={get(errors, 'name', '')}
                            invalid={get(errors, 'name.length', 0) > 0 && invalid}
                        />
                    </Form.Row>
                    <Form.Row>
                        <SelectMetaTermsInput
                            field="calendars"
                            label={gettext('Calendars')}
                            defaultValue={[]}
                            options={enabledCalendars}
                            onChange={this.onChange}
                            value={filter.calendars || []}
                            popupContainer={this.getPopupContainer}
                            invalid={get(errors, 'calendars.length', 0) > 0 && invalid}
                            message={get(errors, 'calendars', '')}
                        />
                    </Form.Row>
                    <Form.Row>
                        <SelectMetaTermsInput
                            field="agendas"
                            label={gettext('Agendas')}
                            defaultValue={[]}
                            valueKey="_id"
                            options={enabledAgendas}
                            onChange={this.onChange}
                            value={filter.agendas || []}
                            popupContainer={this.getPopupContainer}
                            invalid={get(errors, 'agendas.length', 0) > 0 && invalid}
                            message={get(errors, 'agendas', '')}
                        />
                    </Form.Row>
                </SlideInPanel.Content>
                <div ref={(node) => this.dom.popupContainer = node} />
            </SlideInPanel.Panel>
        );
    }
}

EditFilter.propTypes = {
    filter: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    enabledCalendars: PropTypes.array.isRequired,
    enabledAgendas: PropTypes.array.isRequired,
};
