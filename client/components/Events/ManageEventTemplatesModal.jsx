/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Modal} from '../../components';
import {ColumnBox} from '../../components/UI';
import {List} from '../../components/UI';
import {Form} from '../../components/UI';
import {TOOLTIPS} from '../../constants';

class EventTemplateEdit extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            name: props.template.name,
        };

        this.handleFieldChange = this.handleFieldChange.bind(this);
        this.save = this.save.bind(this);
    }
    handleFieldChange(field, nextValue) {
        this.setState({
            [field]: nextValue,
        });
    }
    save() {
        this.props.exitEditMode();
    }
    render() {
        return (
            <div style={{padding: 20}}>
                <Form.Row>
                    <Form.TextInput
                        field="name"
                        label={gettext('Template name')}
                        required={true}
                        value={this.state.name}
                        onChange={this.handleFieldChange}
                        invalid={false}
                        message={null}
                        autoFocus={true}
                    />
                </Form.Row>

                <button
                    onClick={this.save}
                    disabled={this.props.template.name === this.state.name}
                    className="btn btn--primary"
                >
                    {gettext('Save')}
                </button>
            </div>
        );
    }
}

EventTemplateEdit.propTypes = {
    template: PropTypes.object,
    exitEditMode: PropTypes.func,
};

class EventTemplatesList extends React.Component {
    render() {
        return (
            <ColumnBox.Box>
                <ColumnBox.MainColumn padded={true} verticalScroll={true} fullHeight>
                    {
                        this.props.eventTemplates.map((eventTemplate, i) => (
                            <List.Item shadow={1} key={i}>
                                <List.Column grow={true} border={false}>
                                    <List.Row>
                                        <span
                                            className="sd-overflow-ellipsis sd-list-item--element-grow"
                                        >
                                            {eventTemplate.name}
                                        </span>
                                    </List.Row>
                                </List.Column>
                                <List.Column border={false}>
                                    <List.Row>
                                        <button
                                            onClick={() => this.props.editTemplate(i)}
                                            className="dropdown__toggle"
                                            data-sd-tooltip={gettext(TOOLTIPS.edit)}
                                            data-flow="left"
                                        >
                                            <i className="icon-pencil"/>
                                        </button>
                                    </List.Row>
                                </List.Column>
                            </List.Item>
                        ))
                    }
                </ColumnBox.MainColumn>
            </ColumnBox.Box>
        );
    }
}

EventTemplatesList.propTypes = {
    eventTemplates: PropTypes.array,
    editTemplate: PropTypes.func,
};


class ManageFiltersComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            templateInEditMode: null,
        };

        this.editTemplate = this.editTemplate.bind(this);
        this.exitEditMode = this.exitEditMode.bind(this);
    }

    editTemplate(id) {
        this.setState({
            templateInEditMode: id,
        });
    }

    exitEditMode() {
        this.setState({
            templateInEditMode: null,
        });
    }

    render() {
        const {handleHide} = this.props;

        return (
            <Modal xLarge={false} show={true} onHide={handleHide} fullheight>
                <Modal.Header>
                    <a className="close" onClick={handleHide}>
                        <i className="icon-close-small" />
                    </a>
                    <h3 className="modal__heading">{gettext('Manage Event Templates')}</h3>
                </Modal.Header>
                <Modal.Body noPadding={true} noScroll fullHeight>
                    {
                        this.state.templateInEditMode == null
                            ? <EventTemplatesList eventTemplates={this.props.eventTemplates} editTemplate={this.editTemplate} />
                            : (
                                <EventTemplateEdit
                                    template={this.props.eventTemplates[this.state.templateInEditMode]}
                                    exitEditMode={this.exitEditMode}
                                />
                            )
                    }
                </Modal.Body>
            </Modal>
        );
    }
}

ManageFiltersComponent.propTypes = {
    handleHide: PropTypes.func,
    eventTemplates: PropTypes.array,
};

function mapStateToProps(state) {
    return {
        eventTemplates: state.events.eventTemplates,
    };
}

export const ManageEventTemplatesModal = connect(mapStateToProps)(ManageFiltersComponent);