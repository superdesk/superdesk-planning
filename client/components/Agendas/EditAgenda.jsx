import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {SlideInPanel, Form, Toggle} from '../UI';
import {gettext} from '../../utils/gettext';

export class EditAgenda extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pristine: true,
            submitting: true,
            agendaEnabled: true,
            agendaName: '',
            message: '',
            invalid: false,
        };

        this.onChange = this.onChange.bind(this);
        this.onEnableChange = this.onEnableChange.bind(this);
        this.saveAgenda = this.saveAgenda.bind(this);
    }

    componentWillMount() {
        const {agenda} = this.props;

        if (agenda) {
            this.setState({
                agendaEnabled: agenda.is_enabled,
                agendaName: agenda.name,
            });
        }
    }

    isPristine(newName, newEnabled) {
        if (!this.props.agenda)
            return !(this.state.agendaName || newName);

        return get(this.props, 'agenda.name') === newName &&
            get(this.props, 'agenda.is_enabled') === newEnabled;
    }

    onChange(field, value) {
        let newName = value.replace(/^\s+/, '');

        this.setState({
            pristine: this.isPristine(newName, this.state.agendaEnabled),
            agendaName: newName,
        });
        this.setInvalid(newName);
    }

    onEnableChange(event) {
        const newEnabled = get(event, 'target.value');

        this.setState({
            pristine: this.isPristine(this.state.agendaName, newEnabled),
            agendaEnabled: newEnabled,
        });
    }

    onSave() {
        if (get(this.props, 'agenda.is_enabled') === true &&
            get(this.state, 'agendaEnabled') === false && get(this.props, 'agenda.plannings.length', 0) > 0) {
            this.props.openOnSaveModal({
                title: gettext('Disable confirmation'),
                body: gettext('Agenda \'{{ name }}\' has planning items associated with it. Continue ?',
                    {name: this.state.agendaName}),
                okText: gettext('Save'),
                action: () => this.saveAgenda(),
                autoClose: true,
            });
        } else {
            this.saveAgenda();
        }
    }

    saveAgenda() {
        if (this.state.agendaName) {
            const agenda = {
                name: this.state.agendaName,
                is_enabled: this.state.agendaEnabled,
            };

            this.props.onSave({
                ...this.props.agenda,
                ...agenda,
            })
                .then(() => this.props.onClose());
        }
    }

    setInvalid(value) {
        if (!this.state.pristine) {
            if (value.length < 1) {
                this.setState({message: gettext('Must contain at least one character'), invalid: true});
                return;
            }
            this.setState({message: '', invalid: false});
        }
    }

    render() {
        let tools = [<a className="btn" key={1} onClick={this.props.onClose}>{gettext('Cancel')}</a>];

        if (!this.state.pristine && this.state.agendaName && !this.state.invalid) {
            tools.push(
                <a
                    className="btn btn--primary"
                    key={2}
                    onClick={this.onSave.bind(this)}
                >
                    {gettext('Save')}
                </a>
            );
        }

        return (
            <SlideInPanel.Panel>
                <SlideInPanel.Header
                    tools={tools}
                />
                <SlideInPanel.Content>
                    <Form.Row>
                        <Form.TextInput
                            field="name"
                            label={gettext('Name')}
                            required={true}
                            value={this.state.agendaName}
                            onChange={this.onChange}
                            invalid={this.state.invalid}
                            message={this.state.message}
                            autoFocus={true}
                        />
                    </Form.Row>

                    <Form.Row>
                        <Form.Label text={gettext('Enabled')} />
                        <Toggle
                            value={this.state.agendaEnabled}
                            onChange={this.onEnableChange}
                        />
                    </Form.Row>
                </SlideInPanel.Content>
            </SlideInPanel.Panel>
        );
    }
}

EditAgenda.propTypes = {
    agenda: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    openOnSaveModal: PropTypes.func.isRequired,
};
