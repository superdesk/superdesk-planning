import React from 'react';
import {superdeskApi} from '../../superdeskApi';
import {TimePicker, Button, Spacer} from 'superdesk-ui-framework/react';

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
        const next = allHours.find((h) => !used.has(h)) || '00:00';

        this.props.onChange([...this.props.hours, next]);
    }

    removeHour(index: number) {
        this.props.onChange(this.props.hours.filter((_, i) => i !== index));
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {hours} = this.props;

        return (
            <div className="form__row">
                <label className="form__label">{gettext('HOUR')}</label>
                <div className="form__row-items">
                    {(hours.length === 0 ? ['00:00'] : hours).map((time, idx) => (
                        <div
                            key={idx}
                            data-test-id={`time-slot-${idx}`}
                        >
                            <Spacer h gap="8" alignItems="center" noWrap>
                                <div className="sd-list-item__column--grow">
                                    <TimePicker
                                        data-test-id={idx === 0 ? 'field-hour' : `field-hour-${idx}`}
                                        value={time}
                                        onChange={(val) => this.updateHour(idx, val)}
                                    />
                                </div>
                                <div className="sd-padding-t--2">
                                    <Button
                                        type="default"
                                        size="small"
                                        icon="close-small"
                                        onClick={() => this.removeHour(idx)}
                                        data-test-id={`remove-hour-${idx}`}
                                        aria-label={gettext('Remove')}
                                        text=""
                                        iconOnly
                                        style="text-only"
                                    />
                                </div>
                            </Spacer>
                        </div>
                    ))}
                    <div className="sd-padding-t--1">
                        <Button
                            type="primary"
                            size="small"
                            text={gettext('Add Time')}
                            onClick={() => this.addHour()}
                            data-test-id="add-hour"
                        />
                    </div>
                </div>
            </div>
        );
    }
}
