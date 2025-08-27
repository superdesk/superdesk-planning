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

        const firstLineStyles: React.CSSProperties = {overflow: 'hidden', paddingBlockStart: 'var(--space--1)'};
        const secondLineStyles: React.CSSProperties = {overflow: 'hidden', paddingBlockEnd: 'var(--space--1)'};

        return (
            <Spacer v gap="4">
                {/** overflow: hidden needed for support ellipsis for children */}
                <Spacer h gap="8" justifyContent="space-between" noWrap noGrow style={firstLineStyles}>
                    <Spacer h gap="8" justifyContent="start" noWrap noGrow style={{overflow: 'hidden'}}>
                        {renderFieldsWithProps(firstLineStart)}
                    </Spacer>

                    {/** overflow: hidden not needed - ellipsis not supported on end */}
                    <Spacer h gap="8" justifyContent="start" noWrap noGrow>
                        {renderFieldsWithProps(firstLineEnd)}
                    </Spacer>
                </Spacer>

                {/** overflow: hidden needed for support ellipsis for children */}
                <Spacer h gap="8" justifyContent="space-between" noWrap noGrow style={secondLineStyles}>
                    <Spacer h gap="8" justifyContent="start" noWrap noGrow style={{overflow: 'hidden'}}>
                        {renderFieldsWithProps(secondLineStart)}
                    </Spacer>

                    <Spacer h gap="8" justifyContent="start" noWrap noGrow>
                        {renderFieldsWithProps(secondLineEnd)}
                    </Spacer>
                </Spacer>
            </Spacer>
        );
    }
}

