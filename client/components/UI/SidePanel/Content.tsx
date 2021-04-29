import * as React from 'react';
import classNames from 'classnames';

interface IProps {
    className?: string;
    flex?: boolean;
    withSidebar?: boolean;
    withTabs?: boolean;
    refNode: React.RefObject<HTMLDivElement>;
    // refNode?(ref: HTMLDivElement): void;
}

export class Content extends React.PureComponent<IProps> {
    render() {
        return (
            <div
                className={classNames(
                    'side-panel__content',
                    {
                        'side-panel__content--flex': this.props.flex,
                        'side-panel__content--with-sidebar': this.props.withSidebar,
                        'side-panel__content--with-tabs': this.props.withTabs,
                    },
                    this.props.className
                )}
                ref={this.props.refNode}
            >
                {this.props.children}
            </div>
        );
    }
}
