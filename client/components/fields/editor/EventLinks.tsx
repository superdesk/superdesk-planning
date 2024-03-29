import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Button} from 'superdesk-ui-framework/react';
import {Row, LinkInput} from '../../UI/Form';

export class EditorFieldEventLinks extends React.PureComponent<IEditorFieldProps> {
    node: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.node = React.createRef();

        this.addLink = this.addLink.bind(this);
    }

    getValue(): Array<string> {
        return get(
            this.props.item,
            this.props.field ?? 'links',
            this.props.defaultValue ?? []
        );
    }

    addLink() {
        const value = this.getValue();

        value.push('');
        this.props.onChange(this.props.field ?? 'links', value);
    }

    removeLink(index) {
        const value = this.getValue();

        this.props.onChange(
            this.props.field ?? 'links',
            value.filter((link, ind) => ind !== index)
        );
    }

    getFirstFocusableElement(): HTMLTextAreaElement | HTMLButtonElement | null {
        return this.node.current?.querySelector('textarea[name="links[0]"]') ??
            this.node.current?.querySelector('[data-test-id="event-links__add-new-button"]');
    }

    focus() {
        this.getFirstFocusableElement()?.focus();
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'links';
        const links = this.getValue();

        return (
            <Row refNode={this.node}>
                <label className="form-label">
                    {gettext('Links')}
                </label>
                {links.map((link, index) => (
                    <LinkInput
                        key={index}
                        field={`${field}[${index}]`}
                        onChange={this.props.onChange}
                        value={link}
                        remove={this.removeLink.bind(this, index)}
                        readOnly={this.props.disabled}
                    />
                ))}

                {this.props.disabled ? null : (
                    <Button
                        text={gettext('Add link')}
                        data-test-id="event-links__add-new-button"
                        type="primary"
                        style="hollow"
                        expand={true}
                        icon="plus-sign"
                        onClick={this.addLink}
                    />
                )}
            </Row>
        );
    }
}
