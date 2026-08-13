import React from 'react';
import {Spacer, SpacerBlock} from 'superdesk-ui-framework/react';
import {ILineConfig} from 'globals';
import {partitionLineItems} from '../../../helpers';

interface IProps {
    firstLine: Array<ILineConfig>;
    secondLine: Array<ILineConfig>;
    renderFieldsWithProps(fields: Array<ILineConfig>): Array<JSX.Element>;
}

export class LineItems extends React.PureComponent<IProps> {
    render() {
        const {renderFieldsWithProps, firstLine, secondLine} = this.props;

        const [firstLineStart, firstLineEnd] = partitionLineItems(firstLine);
        const [secondLineStart, secondLineEnd] = partitionLineItems(secondLine);

        const firstLineStyles: React.CSSProperties = {
            paddingBlockStart: 'var(--space--1)',
            flexGrow: 1,
        };
        const secondLineStyles: React.CSSProperties = {
            paddingBlockEnd: 'var(--space--1)',
            flexGrow: 1,
        };

        // Pushes the `end` items to the far side of the row. It is a zero-width flex item, so it
        // would collect the row gap on both sides; the negative margin cancels one of them and
        // leaves a single gap between the last `start` item and the first `end` one.
        const endDivider = (items: Array<ILineConfig>) => items.length < 1 ? null : (
            <div className="ms-auto" style={{marginInlineEnd: '-8px'}} />
        );

        return (
            <Spacer v gap="4" noWrap alignItems="stretch">
                <Spacer h gap="8" justifyContent="start" noWrap noGrow style={firstLineStyles}>
                    {renderFieldsWithProps(firstLineStart)}
                    {endDivider(firstLineEnd)}
                    {renderFieldsWithProps(firstLineEnd)}
                </Spacer>

                <Spacer h gap="8" justifyContent="start" noWrap noGrow style={secondLineStyles}>
                    {renderFieldsWithProps(secondLineStart)}
                    {endDivider(secondLineEnd)}
                    {renderFieldsWithProps(secondLineEnd)}
                </Spacer>
            </Spacer>
        );
    }
}

