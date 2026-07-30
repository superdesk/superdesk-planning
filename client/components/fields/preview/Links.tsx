import * as React from 'react';
import {get} from 'lodash';

import {IListFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {ToggleBox} from '../../UI';
import {LinkInput} from '../../UI/Form';

interface IProps extends IListFieldProps {
    testId?: string;
    noToggle?: boolean; // set when rendered inside a toggle box group
}

export const PreviewFieldLinks: React.FunctionComponent<IProps> = (props) => {
    const {gettext} = superdeskApi.localization;
    const links: Array<string> = get(props.item, props.field ?? 'links') ?? [];

    const linkList = links.length > 0 ? (
        <ul>
            {links.map((link, index) => (
                <li key={index}>
                    <LinkInput value={link} readOnly={true} />
                </li>
            ))}
        </ul>
    ) :
        <span className="sd-text__info">{gettext('No external links added.')}</span>;

    if (props.noToggle) {
        return <div data-test-id={props.testId}>{linkList}</div>;
    }

    return (
        <ToggleBox
            testId={props.testId}
            title={gettext('External Links')}
            isOpen={false}
            badgeValue={links.length > 0 ? links.length : null}
        >
            {linkList}
        </ToggleBox>
    );
};
