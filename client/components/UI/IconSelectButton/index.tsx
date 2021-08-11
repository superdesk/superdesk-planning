import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';

import {OverlayPanel} from '@superdesk/primereact/overlaypanel';
import {Button} from 'superdesk-ui-framework/react';

import {IconPicker} from './IconPicker';
import './style.scss';

interface IProps {
    label: string;
    icon: string;
    onChange(icon: string): void;
}

export class IconSelectButton extends React.PureComponent<IProps> {
    buttonContainer: React.RefObject<HTMLDivElement>;
    overlayPanel: React.RefObject<OverlayPanel>;

    constructor(props) {
        super(props);

        this.buttonContainer = React.createRef();
        this.overlayPanel = React.createRef();
        this.togglePopup = this.togglePopup.bind(this);
        this.hidePopup = this.hidePopup.bind(this);
    }

    togglePopup(event: React.SyntheticEvent) {
        this.overlayPanel.current.toggle(event);
    }

    hidePopup() {
        this.overlayPanel.current.hide();
        this.buttonContainer.current.querySelector('button')?.focus();
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <React.Fragment>
                <div
                    className="sd-input sd-input--icon-select"
                    ref={this.buttonContainer}
                >
                    <label className="sd-input__label">
                        {this.props.label}
                    </label>
                    <Button
                        icon={this.props.icon}
                        text={this.props.icon}
                        iconOnly={true}
                        onClick={this.togglePopup}
                    />
                    <div className="sd-input__message-box" />
                </div>
                <OverlayPanel
                    ref={this.overlayPanel}
                    dismissable={true}
                    className="select-icon__overlay-panel"
                    appendTo={document.body} // making it work inside `overflow:hidden`
                >
                    <IconPicker
                        searchPlaceholder={gettext('Search icons....')}
                        selectIcon={this.props.onChange}
                        hidePopup={this.hidePopup}
                    />
                </OverlayPanel>
            </React.Fragment>
        );
    }
}
