import React from 'react';
import {superdeskApi} from '../../superdeskApi';
import {Button, Spacer, TimePicker} from 'superdesk-ui-framework/react';

interface IProps {
    hours: Array<string>;
    onChange: (hours: Array<string>) => void;
}

export class TimeInputs extends React.Component<IProps> {
    updateHour(index: number, value: string) {
        this.props.onChange(
            this.props.hours.map((hour, i) =>
                i === index ? value : hour
            )
        );
    }

    addHour() {
        const used = new Set(this.props.hours);
        const allHours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        const nextAvailableHour = allHours.find((h) => !used.has(h)) || '00:00';

        this.props.onChange([...this.props.hours, nextAvailableHour]);
    }

    removeHour(index: number) {
        this.props.onChange(this.props.hours.filter((_, i) => i !== index));
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {hours = ['00:00']} = this.props;

        return (
            <div className="form__row">
                <div className="sd-line-input sd-line-input--no-margin">
                    <label className="sd-line-input__label">{gettext('HOUR')}</label>
                </div>
                <Spacer v gap="8">
                    <Spacer v gap="8">
                        {hours.map((time, index) => (
                            <Spacer
                                h
                                gap="8"
                                alignItems="center"
                                key={`time-slot-${index}`}
                                data-test-id={`time-slot-${index}`}
                                noWrap
                                noGrow
                            >
                                <TimePicker
                                    inlineLabel
                                    labelHidden
                                    value={time}
                                    onChange={(next) => {
                                        this.updateHour(index, next);
                                    }}
                                    data-test-id={index === 0 ? 'field-hour' : `field-hour-${index}`}
                                />
                                <Button
                                    type="default"
                                    size="small"
                                    icon="close-small"
                                    onClick={() => this.removeHour(index)}
                                    data-test-id={`remove-hour-${index}`}
                                    aria-label={gettext('Remove')}
                                    text=""
                                    iconOnly
                                    style="text-only"
                                />
                            </Spacer>
                        ))}
                    </Spacer>
                    <Button
                        type="primary"
                        size="small"
                        text={gettext('Add Time')}
                        onClick={() => this.addHour()}
                        data-test-id="add-hour"
                    />
                </Spacer>
            </div>
        );
    }
}
