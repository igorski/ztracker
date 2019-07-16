/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2016-2019 - https://www.igorski.nl
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { MIDINotes } from 'zmidi';
import InstrumentUtil from '../../utils/InstrumentUtil';

export default {
    state: {
        midiPortNumber: -1,
        midiConnected: false,
    },
    getters: {
        midiMessageHandler: state => handleMIDIMessage.bind(state),
    },
    mutations: {
        setMIDIPortNumber(state, value) {
            state.midiPortNumber = value;
        },
        setMIDIConnected(state, value) {
            state.midiConnected = !!value;
        },
    }
};

/**
 * MIDI message handler (received via zmidi library)
 * this method is bound to the store state
 *
 * @param {zMIDIEvent} aEvent
 */
function handleMIDIMessage( aEvent ) {
    const noteValue = aEvent.value,   // we only deal with note on/off so these always reflect a NOTE
          pitch     = MIDINotes.getPitchByNoteNumber(noteValue);

    switch ( aEvent.type )
    {
        case zMIDIEvent.NOTE_ON:

            const instrumentId = this.editor.activeInstrument;
            const instrument   = this.song.activeSong.instruments[ instrumentId ];
            InstrumentUtil.noteOn( pitch, instrument, this.editor.recordingInput, this.sequencer.playing );
            break;

        case zMIDIEvent.NOTE_OFF:
            InstrumentUtil.noteOff( pitch, this.sequencer.playing );
            break;
    }
}