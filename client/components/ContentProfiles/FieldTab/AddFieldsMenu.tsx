import React from 'react';
import {IProfileFieldEntry} from 'interfaces';
import {TreeMenu, Button} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../../superdeskApi';
import {getFieldNameTranslated} from '../../../utils/contentProfiles';

interface IProps {
    options: Array<{value: IProfileFieldEntry; onSelect: () => void;}>;
    buttonLabel: string;
}

export default class AddFieldsMenu extends React.PureComponent<IProps, any> {
    render(): React.ReactNode {
        const {gettext} = superdeskApi.localization;
        const {options, buttonLabel} = this.props;

        return (
            <TreeMenu
                data-test-id="menu"
                getId={(field) => field.name}
                optionTemplate={(item) => item.schema?.type === 'custom_vocabulary' ? (
                    <>
                        {getFieldNameTranslated(item.name)}
                        <span className="sd-text--italic sd-text--light">
                            &nbsp;({gettext('custom vocabulary')})
                        </span>
                    </>
                ) : (
                    <>
                        {getFieldNameTranslated(item.name)}
                    </>
                )}
                getLabel={(item) => getFieldNameTranslated(item.name)}
                getOptions={() => options}
            >
                {(toggle) => (
                    <Button
                        text={buttonLabel}
                        iconOnly={true}
                        icon="plus-large"
                        shape="round"
                        type="primary"
                        onClick={toggle}
                    />
                )}
            </TreeMenu>
        );
    }
}
