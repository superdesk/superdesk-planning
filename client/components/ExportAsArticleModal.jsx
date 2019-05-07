import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';
import {gettext} from '../utils';

import {Button} from './UI';
import {SelectInput, Row} from './UI/Form';
import {Modal} from './index';
import SortItems from './SortItems/index';

export class ExportAsArticleModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            template: this.props.modalProps.defaultTemplate,
            desk: this.props.modalProps.defaultDesk,
            items: this.props.modalProps.items,
        };

        this.onChange = this.onChange.bind(this);
        this.onSortChange = this.onSortChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onChange(field, value) {
        this.setState({[field]: value});
    }

    onSubmit() {
        const {
            desk,
            template,
            items,
        } = this.state;

        this.props.modalProps.action(items, get(desk, '_id'), get(template, 'name'),
            get(this.props, 'modalProps.type'));
        this.props.handleHide();
    }

    onSortChange(items) {
        this.setState({items: items});
    }

    render() {
        const {
            items,
            desks,
            templates,
        } = this.props.modalProps;

        return (
            <Modal show={true}>
                <Modal.Header>
                    <h3>{gettext('Export as article')}</h3>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <SortItems items={items} onSortChange={this.onSortChange}/>
                    </Row>
                    <Row>
                        <SelectInput
                            field="desk"
                            label={gettext('Desk')}
                            value={this.state.desk}
                            onChange={this.onChange}
                            options={desks}
                            labelField="name"
                            keyField="_id" />
                    </Row>
                    <Row>
                        <SelectInput
                            field="template"
                            label={gettext('Template')}
                            value={this.state.template}
                            onChange={this.onChange}
                            options={templates}
                            labelField="label"
                            keyField="name" />
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button"
                        onClick={this.props.handleHide}>{gettext('Cancel')}</Button>
                    <Button type="submit" className="btn--primary" disabled={!this.state.template || !this.state.desk}
                        onClick={this.onSubmit}>{gettext('Done')}</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

ExportAsArticleModal.propTypes = {
    handleHide: PropTypes.func,
    modalProps: PropTypes.shape({
        items: PropTypes.array,
        desks: PropTypes.array,
        templates: PropTypes.array,
        defaultDesk: PropTypes.object,
        defaultTemplate: PropTypes.object,
        onSortChange: PropTypes.func,
        action: PropTypes.func,
    }),
};
