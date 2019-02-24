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

// editor module stores all states of the editor such as
// the instrument which is currently be edited, the active track
// in the currently active pattern, etc.

export default {
    state: {
        /**
         * which instrument is currently selected
         *
         * @type {number}
         */
        activeInstrument: 0,
    
        /**
         * which pattern is currently selected
         *
         * @type {number}
         */
        activePattern: 0,
    
        /**
         * which pattern step is currently selected
         *
         * @type {number}
         */
        activeStep: 0,
    
        /**
         * which parameter slot within an instruments step
         * is currently selected (e.g. note 0, instrument 1, module parameter 2 or module parameter value 3)
         * -1 indicates no deliberate slot was selected
         *
         * @type {number}
         */
        activeSlot: -1,
    
        /**
         * the amount of steps in the currently selected pattern
         *
         * @type {number}
         */
        amountOfSteps: 16,
    
        /**
         * whether the editor is recording notes
         * from the MIDI input device
         *
         * @type {boolean}
         */
        recordingInput: false,
    
        /**
         * whether the sequencer should loop its
         * current range during recording
         *
         * @type {boolean}
         */
        loopedRecording: true,
    
        /**
         * the root octave of the lower keyboard note range
         *
         * @type {number}
         */
        higherKeyboardOctave: 4,
    
        /**
         * the root octave of the lower keyboard note range
         *
         * @type {number}
         */
        lowerKeyboardOctave: 2
    },
    mutations: {
        reset(state) {
            state.activeInstrument =
            state.activePattern    =
            state.activeStep       = 0;
            state.recordingInput   = false;
        }
    }
};
