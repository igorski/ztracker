/**
 * The MIT License (MIT)
 *
 * Igor Zinken 2016-2018 - https://www.igorski.nl
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
"use strict";

/* private properties */

let container, element, efflux, keyboardController;
let instrumentSelect, noteList, octaveList, data, closeCallback;
let selectedNote, selectedOctave;

const NoteEntryController = module.exports =
{
    /**
     * initialize NoteEntryController
     *
     * @param containerRef
     * @param effluxRef
     * @param keyboardControllerRef
     */
    init( containerRef, effluxRef, keyboardControllerRef )
    {
        container          = containerRef;
        efflux             = effluxRef;
        keyboardController = keyboardControllerRef;

        efflux.TemplateService.renderAsElement( "noteEntry" ).then(( template ) => {

            element = template;

            // grab view elements

            instrumentSelect = element.querySelector( "#instrument" );

            // initialize keyboard and octave selectors

            const keyboard = element.querySelector( "#keyboardNotes" );
            noteList       = keyboard.querySelectorAll( "li" );
            keyboard.addEventListener( "click", handleKeyboardClick );

            const octaves = element.querySelector( "#octaves" );
            octaveList    = octaves.querySelectorAll( "li" );
            octaves.addEventListener( "click", handleOctaveClick );

            // add listeners

            element.querySelector( ".close-button" ).addEventListener  ( "click", handleClose );
            element.querySelector( ".help-button" ).addEventListener   ( "click", handleHelp );
            element.querySelector( ".confirm-button" ).addEventListener( "click", handleReady );
        });
    },

    /* event handlers */

    handleKey( type, keyCode, event )
    {
        if ( type === "down" )
        {
            switch ( keyCode )
            {
                case 27: // escape
                    handleClose();
                    break;

                case 13: // enter
                    handleReady();
                    break;

                /* notes */

                case 67: // C
                    selectedNote = ( selectedNote === "C" ) ? "C#" : "C"; // jump between C and C#
                    setSelectedValueInList( noteList, selectedNote );
                    break;

                case 68: // D
                    selectedNote = ( selectedNote === "D" ) ? "D#" : "D"; // jump between D and D#
                    setSelectedValueInList( noteList, selectedNote );
                    break;

                case 69: // E
                    setSelectedValueInList( noteList, selectedNote = "E" );
                    break;

                case 70: // F
                    selectedNote = ( selectedNote === "F" ) ? "F#" : "F"; // jump between F and F#
                    setSelectedValueInList( noteList, selectedNote );
                    break;

                case 71: // G
                    selectedNote = ( selectedNote === "G" ) ? "G#" : "G"; // jump between C and C#
                    setSelectedValueInList( noteList, selectedNote );
                    break;

                case 65: // A
                    selectedNote = ( selectedNote === "A" ) ? "A#" : "A"; // jump between A and A#
                    setSelectedValueInList( noteList, selectedNote );
                    break;

                case 66: // B
                    setSelectedValueInList( noteList, selectedNote = "B" );
                    break;

                /* octaves */

                case 49: setSelectedValueInList( octaveList, 1 ); break;
                case 50: setSelectedValueInList( octaveList, 2 ); break;
                case 51: setSelectedValueInList( octaveList, 3 ); break;
                case 52: setSelectedValueInList( octaveList, 4 ); break;
                case 53: setSelectedValueInList( octaveList, 5 ); break;
                case 54: setSelectedValueInList( octaveList, 6 ); break;
                case 55: setSelectedValueInList( octaveList, 7 ); break;
                case 56: setSelectedValueInList( octaveList, 8 ); break;
            }
        }
    }
};

function handleHelp( aEvent )
{
    window.open( Manual.NOTE_ENTRY_HELP, "_blank" );
}

function handleReady()
{
    data.instrument = parseFloat( Form.getSelectedOption( instrumentSelect ));
    data.note       = getSelectedValueFromList( noteList );
    data.octave     = parseFloat( getSelectedValueFromList( octaveList ));

    // update model and view

    if ( EventValidator.hasContent( data )) {

        const pattern = efflux.activeSong.patterns[ data.patternIndex ],
              channel = pattern.channels[ data.channelIndex ];

        let event        = channel[ data.step ];
        const isNewEvent = !event;

        if ( isNewEvent )
            event = EventFactory.createAudioEvent();

        event.action     = 1; // noteOn
        event.instrument = data.instrument;
        event.note       = data.note;
        event.octave     = data.octave;

        Pubsub.publish( Messages.ADD_EVENT_AT_POSITION, [ event, {
            patternIndex : data.patternIndex,
            channelIndex : data.channelIndex,
            step         : data.step,
            newEvent     : isNewEvent
        } ]);
    }
    handleClose();
}

/* note selection */

function handleKeyboardClick( aEvent )
{
    const target = aEvent.target;
    if ( target.nodeName === "LI" ) {
        selectedNote = target.getAttribute( "data-value" );
        setSelectedValueInList( noteList, selectedNote );
    }
}

/* octave select */

function handleOctaveClick( aEvent )
{
    const target = aEvent.target;
    if ( target.nodeName === "LI" ) {
        selectedOctave = target.getAttribute( "data-value" );
        setSelectedValueInList( octaveList, selectedOctave );
    }
}

/* list functions */

function setSelectedValueInList( list, value )
{
    value = value.toString();
    let i = list.length, option;

    while ( i-- )
    {
        option = list[ i ];

        if ( option.getAttribute( "data-value" ) === value )
            option.classList.add( "selected" );
        else
            option.classList.remove( "selected" );
    }
}

function getSelectedValueFromList( list )
{
    let i = list.length, option;
    while ( i-- )
    {
        option = list[ i ];
        if ( option.classList.contains( "selected" ))
            return option.getAttribute( "data-value" );
    }
    return null;
}
