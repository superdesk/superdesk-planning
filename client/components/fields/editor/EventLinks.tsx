import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {ToggleBox, IconButton} from '../../UI';
import {Row, LinkInput} from '../../UI/Form';

export class EditorFieldEventLinks extends React.PureComponent<IEditorFieldProps> {
    constructor(props) {
        super(props);

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

    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'links';
        const links = this.getValue();

        return (
            <ToggleBox
                ref={this.props.refNode}
                title={this.props.label ?? gettext('External Links')}
                isOpen={false}
                onClose={() => false}
                onOpen={() => false}
                scrollInView={true}
                hideUsingCSS={true} // hideUsingCSS so the file data is kept on hide/show
                invalid={false}
                forceScroll={false}
                paddingTop={false}
                badgeValue={links?.length > 0 ? links.length : null}
                testId={this.props.testId}
            >
                <Row>
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
                        <IconButton
                            onClick={this.addLink}
                            icon="icon-plus-sign"
                            label={gettext('Add link')}
                            useDefaultClass={false}
                            className="text-link cursor-pointer link-input__add-btn"
                            tabIndex={0}
                            enterKeyIsClick={true}
                        />
                    )}
                </Row>
            </ToggleBox>
        );
    }
}
