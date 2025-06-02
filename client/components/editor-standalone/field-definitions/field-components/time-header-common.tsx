import React from 'react';
import {cloneDeep} from 'lodash';
import {superdeskApi} from '../../../../superdeskApi';
import {Spacer, Button} from 'superdesk-ui-framework/react';

interface IProps {
    value: Date;
    onChange: (nextVal: Date) => void;
}

export const TimeHeader = ({value, onChange}: IProps) => {
    const {gettext} = superdeskApi.localization;

    return (
        <Spacer
            h
            gap="4"
            noWrap
            style={{
                paddingBottom: 4,
            }}
        >
            <Button
                text={gettext('In 30 min')}
                onClick={() => {
                    const clonedValue = cloneDeep(value);

                    clonedValue.setMinutes(value.getMinutes() + 30);

                    onChange(clonedValue);
                }}
                size="small"
            />
            <Button
                text={gettext('In 1 hr')}
                onClick={() => {
                    const clonedValue = cloneDeep(value);

                    clonedValue.setHours(value.getHours() + 1);

                    onChange(clonedValue);
                }}
                size="small"
            />
            <Button
                text={gettext('In 2 hr')}
                onClick={() => {
                    const clonedValue = cloneDeep(value);

                    clonedValue.setHours(value.getHours() + 2);

                    onChange(clonedValue);
                }}
                size="small"
            />
        </Spacer>
    );
};
