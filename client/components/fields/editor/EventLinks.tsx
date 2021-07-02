import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Button} from 'superdesk-ui-framework/react';
import {ToggleBox} from '../../UI';
import {Row, LinkInput} from '../../UI/Form';

export class EditorFieldEventLinks extends React.PureComponent<IEditorFieldProps> {
    node: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.node = React.createRef();

        this.addLink = this.addLink.bind(this);
        this.onOpen = this.onOpen.bind(this);
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

    onOpen() {
        this.getFirstFocusableElement()?.focus();
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'links';
        const links = this.getValue();

        return (
            <ToggleBox
                ref={this.props.refNode}
                title={this.props.label ?? gettext('External Links')}
                isOpen={false}
                onOpen={this.onOpen}
                scrollInView={true}
                hideUsingCSS={true} // hideUsingCSS so the file data is kept on hide/show
                invalid={false}
                forceScroll={false}
                paddingTop={false}
                badgeValue={links?.length > 0 ? links.length : null}
                testId={this.props.testId}
            >
                <Row refNode={this.node}>
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
            </ToggleBox>
        );
    }
}
