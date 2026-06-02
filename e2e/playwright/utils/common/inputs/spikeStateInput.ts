import {RadioInputs} from './radioInputs';

export class SpikeStateInput extends RadioInputs {
    async clear() {
        await this.type('Exclude Spike');
    }
}
