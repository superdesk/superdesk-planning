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
            articleTemplate: this.props.modalProps.defaultArticleTemplate,
            articleTemplates: this.props.modalProps.articleTemplates,
        };

        this.onChange = this.onChange.bind(this);
        this.onSortChange = this.onSortChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.filterArticleTemplates = this.filterArticleTemplates.bind(this);
    }

    componentDidMount() {
        this.filterArticleTemplates(this.state.desk);
    }

    onChange(field, value) {
        if (field === 'desk') { // on desk change filter article-templates based on desk selected
            this.filterArticleTemplates(value);
        }
        this.setState({[field]: value});
    }

    onSubmit(e, download) {
        const {
            desk,
            template,
            items,
            articleTemplate,
        } = this.state;

        this.props.modalProps.action(items, get(desk, '_id'), get(template, 'name'),
            get(this.props, 'modalProps.type'), download, get(articleTemplate, '_id'));
        this.props.handleHide();
    }

    onSortChange(items) {
        this.setState({items: items});
    }

    filterArticleTemplates(desk) {
        const newObj = {};

        newObj.articleTemplates = this.props.modalProps.articleTemplates.filter((t) =>
            Object.keys(t).length > 0 && t.template_desks && t.template_desks.includes(desk._id));
        newObj.articleTemplate = newObj.articleTemplates.find((t) =>
            Object.keys(t).length > 0 && t._id === get(desk, 'default_content_template'))
            || newObj.articleTemplates[0];

        this.setState((prevState) => ({...prevState, ...newObj}));
    }

    render() {
        const {
            items,
            desks,
            templates,
            download,
        } = this.props.modalProps;

        const {
            desk,
            template,
            articleTemplate,
            articleTemplates,
        } = this.state;

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
                            value={desk}
                            onChange={this.onChange}
                            options={desks}
                            labelField="name"
                            keyField="_id" />
                    </Row>
                    <Row>
                        <SelectInput
                            field="articleTemplate"
                            label={gettext('Select Article Template')}
                            value={articleTemplate}
                            onChange={this.onChange}
                            options={articleTemplates}
                            labelField="template_name"
                            keyField="_id" />
                    </Row>
                    <Row>
                        <SelectInput
                            field="template"
                            label={gettext('Template')}
                            value={template}
                            onChange={this.onChange}
                            options={templates}
                            labelField="label"
                            keyField="name" />
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button"
                        onClick={this.props.handleHide}>{gettext('Cancel')}</Button>
                    <Button type="submit" className="btn--primary" disabled={!template || !desk}
                        onClick={this.onSubmit}>{gettext('Export')}</Button>
                    {download && <Button type="submit" className="btn--primary"onClick={this.onSubmit.bind(null, true)}>
                        {gettext('Download')}</Button>}
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
        download: PropTypes.bool,
        articleTemplates: PropTypes.array,
        defaultArticleTemplate: PropTypes.object,
    }),
};
