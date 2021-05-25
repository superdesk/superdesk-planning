import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    className?: string;
    padSmall?: boolean;
    flex?: boolean;
    noPadding?: boolean;
    navbar?: boolean;
    content?: boolean;
    onScroll?(event: React.UIEvent<HTMLDivElement>): void;
}

export class ContentBlock extends React.PureComponent<IProps> {
    render() {
        return (
            <div
                className={classNames(
                    'side-panel__content-block',
                    this.props.className,
                    {
                        'side-panel__content-block--pad-small': this.props.padSmall,
                        'side-panel__content-block--flex': this.props.flex,
                        'side-panel__content-block--no-padding': this.props.noPadding,
                        'side-panel__content-block--navbar': this.props.navbar,
                        'side-panel__content-block--content': this.props.content,
                    }
                )}
                onScroll={this.props.onScroll}
            >
                {this.props.children}
            </div>
        );
    }
}
