import React from 'react';
import {Badge, WithPopover, Card, Button, Tag} from 'superdesk-ui-framework/react';
import {Spacer} from '@sourcefabric/common';
import {superdeskApi} from '../../superdeskApi';

interface IProps<T> {
    items: Array<T>;

    /**
     * Must return a fragment with items
     */
    template: React.ComponentType<{items: Array<T>}>;

    visibleAtOnce?: number; // defaults to 2
}

/**
 * Will only show a few items and a button to see the rest in a popover
 */
export class WithMoreItems<T> extends React.PureComponent<IProps<T>> {
    render() {
        const {items, visibleAtOnce = 2} = this.props;
        const Template = this.props.template;
        const {gettext, gettextPlural} = superdeskApi.localization;

        if (items.length < 1) {
            return null;
        }

        const visible = items.slice(0, visibleAtOnce);
        const moreItems = items.slice(visibleAtOnce);

        return (
            <Spacer h gap="4" noWrap justifyContent="start" style={{whiteSpace: 'nowrap'}}>
                <Template items={visible} />

                {
                    moreItems.length > 0 && (
                        <div>
                            <WithPopover
                                placement="bottom-end"
                                component={({closePopup}) => (
                                    <Card paddingBase="0" style={{display: 'flex', flexDirection: 'column'}}>
                                        <Spacer
                                            h
                                            gap="16"
                                            noWrap
                                            style={{padding: 'var(--space--1)'}}
                                        >
                                            <h4>
                                                {
                                                    gettextPlural(
                                                        moreItems.length,
                                                        '1 more item',
                                                        '{{n}} more items',
                                                        {n: moreItems.length},
                                                    )
                                                }
                                            </h4>

                                            <div>
                                                <Button
                                                    type="primary"
                                                    icon="close-small"
                                                    text={gettext('Close')}
                                                    size="small"
                                                    iconOnly={true}
                                                    onClick={closePopup}
                                                    shape="round"
                                                    style="hollow"
                                                />
                                            </div>
                                        </Spacer>

                                        <Spacer
                                            v
                                            gap="4"
                                            noWrap
                                            style={{
                                                flexShrink: 1,
                                                overflow: 'auto',
                                                paddingInline: 'var(--space--1)',
                                                paddingBlockEnd: 'var(--space--1)'
                                            }}
                                        >
                                            <Template items={moreItems} />
                                        </Spacer>
                                    </Card>
                                )}
                            >
                                {(onToggle) => (
                                    <button
                                        onClick={(event) => {
                                            onToggle(event.target as HTMLElement);
                                        }}
                                        style={{padding: 0}}
                                    >
                                        <Tag
                                            text={`+${moreItems.length}`}
                                            shade="highlight1"
                                            size="small"
                                        />
                                    </button>
                                )}
                            </WithPopover>
                        </div>
                    )
                }
            </Spacer>
        );
    }
}
