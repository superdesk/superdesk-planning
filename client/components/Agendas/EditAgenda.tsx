import React from 'react';
import {get} from 'lodash';
import {SlideInPanel, Form, Toggle} from '../UI';
import {gettext} from '../../utils/gettext';
import {Button} from 'superdesk-ui-framework';
import {IAgenda} from '../../interfaces';

interface IEditAgendaProps {
    agenda: IAgenda | null;
    onClose(): void;
    onSave(agenda: IAgenda): Promise<any>;
    openOnSaveModal(props: {
        title: string;
        body: string;
        okText: string;
        action(): void;
        autoClose: boolean;
    }): void;
}

interface IEditAgendaState {
    pristine: boolean;
    submitting: boolean;
    agendaEnabled: boolean;
    agendaName: string;
    message: string;
    invalid: boolean;
}

export class EditAgenda extends React.Component<IEditAgendaProps, IEditAgendaState> {
    constructor(props: IEditAgendaProps) {
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
        this.onSave = this.onSave.bind(this);
    }

    componentWillMount(): void {
        const {agenda} = this.props;

        if (agenda) {
            this.setState({
                agendaEnabled: agenda.is_enabled,
                agendaName: agenda.name,
            });
        }
    }

    isPristine(newName: string, newEnabled: boolean): boolean {
        if (!this.props.agenda)
            return !(this.state.agendaName || newName);

        return get(this.props, 'agenda.name') === newName &&
            get(this.props, 'agenda.is_enabled') === newEnabled;
    }

    onChange(field: string, value: string): void {
        let newName = value.replace(/^\s+/, '');

        this.setState({
            pristine: this.isPristine(newName, this.state.agendaEnabled),
            agendaName: newName,
        });
        this.setInvalid(newName);
    }

    onEnableChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const newEnabled = event.target.checked;

        this.setState({
            pristine: this.isPristine(this.state.agendaName, newEnabled),
            agendaEnabled: newEnabled,
        });
    }

    onSave(): void {
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

    saveAgenda(): void {
        if (this.state.agendaName) {
            const agenda: Partial<IAgenda> = {
                name: this.state.agendaName,
                is_enabled: this.state.agendaEnabled,
            };

            this.props.onSave({
                ...this.props.agenda,
                ...agenda,
            } as IAgenda)
                .then(() => this.props.onClose());
        }
    }

    setInvalid(value: string): void {
        if (!this.state.pristine) {
            if (value.length < 1) {
                this.setState({message: gettext('Must contain at least one character'), invalid: true});
                return;
            }
            this.setState({message: '', invalid: false});
        }
    }

    render(): React.ReactNode {
        const tools = [
            <Button
                key={1}
                onClick={this.props.onClose}
                text={gettext('Cancel')}
            />,
            <Button
                key={2}
                onClick={this.onSave}
                disabled={this.state.pristine || this.state.agendaName == null || this.state.invalid}
                text={gettext('Save')}
                type="primary"
            />
        ];

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
