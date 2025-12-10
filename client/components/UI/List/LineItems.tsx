import React from 'react';
import {Spacer} from 'superdesk-ui-framework/react';
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

        return (
            <Spacer v gap="4" noWrap alignItems="stretch">
                <Spacer h gap="8" justifyContent="start" noWrap noGrow style={firstLineStyles}>
                    {renderFieldsWithProps(firstLineStart)}
                    <div className="ms-auto" />
                    {renderFieldsWithProps(firstLineEnd)}
                </Spacer>

                <Spacer h gap="8" justifyContent="start" noWrap noGrow style={secondLineStyles}>
                    {renderFieldsWithProps(secondLineStart)}
                    <div className="ms-auto" />
                    {renderFieldsWithProps(secondLineEnd)}
                </Spacer>
            </Spacer>
        );
    }
}

