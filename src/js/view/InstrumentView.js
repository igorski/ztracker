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
const Form              = require( "../utils/Form" );
const Manual            = require( "../definitions/Manual" );
const Messages          = require( "../definitions/Messages" );
const Pubsub            = require( "pubsub-js" );
const InstrumentFactory = require( "../model/factory/InstrumentFactory" );

let efflux, model, listener, keyboardController;
let element, canvas, wtDraw,
    instrumentSelect, presetSelect, presetSave, presetNameInput,
    oscEnabledSelect, oscWaveformSelect, oscVolumeControl, instrumentVolumeControl,
    detuneControl, octaveShiftControl, fineShiftControl,
    amplitudeEditor, pitchEditor,
    attackControl, decayControl, sustainControl, releaseControl,
    pitchRangeControl, pitchAttackControl, pitchDecayControl, pitchSustainControl, pitchReleaseControl,
    moduleEditorPage1, moduleEditorPage2,
    filterEnabledSelect, frequencyControl, qControl, lfoSelect, filterSelect, speedControl, depthControl,
    eqEnabledSelect, eqLowControl, eqMidControl, eqHighControl,
    odEnabledSelect, odDriveControl, odColorControl, odPreBandControl, odPostCutControl,
    delayEnabledSelect, delayTypeSelect, delayTimeControl, delayFeedbackControl, delayCutoffControl, delayOffsetControl;

const self = module.exports = {

    // View-Controller communication messages (via init() listener)

    EVENTS: {
        READY     : 0,
        CLOSE     : 1,
        SET_OSC   : 2,
        CACHE_OSC : 3,
        SELECT_PRESET: 4,
        SELECT_INSTRUMENT: 5,
        SET_TUNING: 6,
        SAVE_PRESET: 7
    },

    /**
     * @public
     * @param {Object} effluxRef reference to Efflux namespace (see main.js)
     * @param {Object} keyboardControllerRef reference to keyboard controller)
     * @param {!Function} listenerRef handler for this Views state change events
     * @return {Promise}
     */
    init( effluxRef, keyboardControllerRef, listenerRef ) {

        efflux             = effluxRef;
        model              = efflux.InstrumentModel;
        keyboardController = keyboardControllerRef;
        listener           = listenerRef;

        element = document.createElement( "div" );
        element.setAttribute( "id", "instrumentEditor" );

        efflux.TemplateService.render( "instrumentEditor", element ).then(() => {

            instrumentSelect        = element.querySelector( "#instrumentSelect" );
            presetSelect            = element.querySelector( "#presetSelect" );
            presetSave              = element.querySelector( "#presetSave" );
            presetNameInput         = element.querySelector( "#presetName" );
            instrumentVolumeControl = element.querySelector( "#instrumentVolume" );


            // pitch envelope

            amplitudeEditor = element.querySelector( "#amplitudeEditor" );
            pitchEditor     = element.querySelector( "#pitchEditor" );

            moduleEditorPage1 = element.querySelector( "#modulesPage1" );
            moduleEditorPage2 = element.querySelector( "#modulesPage2" );

            // filter
            filterEnabledSelect     = element.querySelector( "#filterEnabled" );
            frequencyControl        = element.querySelector( "#filterFrequency" );
            qControl                = element.querySelector( "#filterQ" );
            lfoSelect               = element.querySelector( "#filterLFO" );
            filterSelect            = element.querySelector( "#filterType" );
            speedControl            = element.querySelector( "#filterSpeed" );
            depthControl            = element.querySelector( "#filterDepth" );

            // delay
            delayEnabledSelect   = element.querySelector( "#delayEnabled" );
            delayTypeSelect      = element.querySelector( "#delayType" );
            delayTimeControl     = element.querySelector( "#delayTime" );
            delayFeedbackControl = element.querySelector( "#delayFeedback" );
            delayCutoffControl   = element.querySelector( "#delayCutoff" );
            delayOffsetControl   = element.querySelector( "#delayOffset" );

            // eq
            eqEnabledSelect = element.querySelector( "#eqEnabled" );
            eqLowControl    = element.querySelector( "#eqLow" );
            eqMidControl    = element.querySelector( "#eqMid" );
            eqHighControl   = element.querySelector( "#eqHigh" );

            // overdrive
            odEnabledSelect  = element.querySelector( "#odEnabled" );
            odDriveControl   = element.querySelector( "#odDrive" );
            odColorControl   = element.querySelector( "#odColor" );
            odPreBandControl = element.querySelector( "#odPreBand" );
            odPostCutControl = element.querySelector( "#odPostCut" );

            // add listeners

            element.querySelector( ".close-button" ).addEventListener  ( "click", ( e ) => listener( self.EVENTS.CLOSE ));
            element.querySelector( ".help-button" ).addEventListener   ( "click", handleHelp );
            element.querySelector( "#oscillatorTabs" ).addEventListener( "click", handleOscillatorTabClick );
            element.querySelector( "#modulesTabs" ).addEventListener   ( "click", handleModulesTabClick );
            instrumentSelect.addEventListener ( "change", handleInstrumentSelect );
            presetSelect.addEventListener     ( "change", handlePresetSelect );
            presetSave.addEventListener       ( "click",  handlePresetSave );
            presetNameInput.addEventListener  ( "focus",  handlePresetFocus );
            presetNameInput.addEventListener  ( "blur",   handlePresetBlur );

            instrumentVolumeControl.addEventListener( "input", handleInstrumentVolumeChange );

            filterEnabledSelect.addEventListener( "change", handleFilterChange );
            lfoSelect.addEventListener          ( "change", handleFilterChange );
            filterSelect.addEventListener       ( "change", handleFilterChange );
            [ frequencyControl, qControl, speedControl, depthControl ].forEach(( control ) => {
                control.addEventListener( "input", handleFilterChange );
            });

            delayEnabledSelect.addEventListener( "change", handleDelayChange );
            delayTypeSelect.addEventListener   ( "change", handleDelayChange );
            [ delayTimeControl, delayFeedbackControl, delayCutoffControl, delayOffsetControl ].forEach(( control ) => {
                control.addEventListener( "input", handleDelayChange );
            });

            eqEnabledSelect.addEventListener( "change", handleEqChange );
            [ eqLowControl, eqMidControl, eqHighControl ].forEach(( control => {
                control.addEventListener( "input", handleEqChange );
            }));

            odEnabledSelect.addEventListener( "change", handleOverdriveChange );
            [ odDriveControl, odColorControl, odPreBandControl, odPostCutControl ].forEach(( control => {
                control.addEventListener( "input", handleOverdriveChange );
            }));

            listener( self.EVENTS.READY );
        });
    },

    update( instrumentRef, activeOscillatorIndex ) {

        element.querySelector( "h2" ).innerHTML = "Editing " + instrumentRef.name;

        showWaveformForOscillator( oscillator );

        Form.setSelectedOption( oscEnabledSelect,  oscillator.enabled );
        Form.setSelectedOption( oscWaveformSelect, oscillator.waveform );
        Form.setSelectedOption( instrumentSelect,  instrumentRef.id );

        detuneControl.value      = oscillator.detune;
        octaveShiftControl.value = oscillator.octaveShift;
        fineShiftControl.value   = oscillator.fineShift;
        oscVolumeControl.value   = oscillator.volume;

        attackControl.value  = oscillator.adsr.attack;
        decayControl.value   = oscillator.adsr.decay;
        sustainControl.value = oscillator.adsr.sustain;
        releaseControl.value = oscillator.adsr.release;

        pitchRangeControl.value   = oscillator.pitch.range;
        pitchAttackControl.value  = oscillator.pitch.attack;
        pitchDecayControl.value   = oscillator.pitch.decay;
        pitchSustainControl.value = oscillator.pitch.sustain;
        pitchReleaseControl.value = oscillator.pitch.release;

        instrumentVolumeControl.value = instrumentRef.volume;

        Form.setSelectedOption( filterEnabledSelect, instrumentRef.filter.enabled );
        Form.setSelectedOption( lfoSelect,           instrumentRef.filter.lfoType );
        Form.setSelectedOption( filterSelect,        instrumentRef.filter.type );
        frequencyControl.value = instrumentRef.filter.frequency;
        qControl.value         = instrumentRef.filter.q;
        speedControl.value     = instrumentRef.filter.speed;
        depthControl.value     = instrumentRef.filter.depth;

        Form.setSelectedOption( delayEnabledSelect, instrumentRef.delay.enabled );
        Form.setSelectedOption( delayTypeSelect,    instrumentRef.delay.type );
        delayTimeControl.value     = instrumentRef.delay.time;
        delayFeedbackControl.value = instrumentRef.delay.feedback;
        delayCutoffControl.value   = instrumentRef.delay.cutoff;
        delayOffsetControl.value   = instrumentRef.delay.offset + 0.5;

        Form.setSelectedOption( eqEnabledSelect, instrumentRef.eq.enabled );
        eqLowControl.value  = instrumentRef.eq.lowGain;
        eqMidControl.value  = instrumentRef.eq.midGain;
        eqHighControl.value = instrumentRef.eq.highGain;

        Form.setSelectedOption( odEnabledSelect, instrumentRef.overdrive.enabled );
        odDriveControl.value   = instrumentRef.overdrive.drive;
        odColorControl.value   = instrumentRef.overdrive.color;
        odPreBandControl.value = instrumentRef.overdrive.preBand;
        odPostCutControl.value = instrumentRef.overdrive.postCut;
    },

    /* public methods */

    setPresets( list, presetName ) {
        Form.setOptions( presetSelect, list );
        Form.setSelectedOption( presetSelect, presetName );

        presetNameInput.value = ( typeof presetName === "string" ) ? presetName : "";
    }
};

/* event handlers */


function handleOscillatorTabClick( aEvent ) {
    const element = aEvent.target;
    if ( element.nodeName === "LI" ) {

        const value = parseFloat( element.getAttribute( "data-oscillator" ));
        if ( !isNaN( value ))
            listener( self.EVENTS.SET_OSC, value - 1 );
    }
}

function handleModulesTabClick( aEvent ) {
    const element = aEvent.target, activeClass = "active";
    let tabIndex = 0;
    if ( element.nodeName === "LI" ) {
        switch( element.getAttribute( "data-type" )) {
            default:
            case "page1":
                moduleEditorPage1.classList.add( activeClass );
                moduleEditorPage2.classList.remove( activeClass );
                break;
            case "page2":
                moduleEditorPage1.classList.remove( activeClass );
                moduleEditorPage2.classList.add( activeClass );
                tabIndex = 1;
                break;
        }
        setActiveTab( document.querySelectorAll( "#modulesTabs li" ), tabIndex );
    }
}

function handleFilterChange( aEvent ) {
    const filter = model.instrumentRef.filter;

    filter.frequency = parseFloat( frequencyControl.value );
    filter.q         = parseFloat( qControl.value );
    filter.speed     = parseFloat( speedControl.value );
    filter.depth     = parseFloat( depthControl.value );
    filter.lfoType   = Form.getSelectedOption( lfoSelect );
    filter.type      = Form.getSelectedOption( filterSelect );
    filter.enabled   = ( Form.getSelectedOption( filterEnabledSelect ) === "true" );

    Pubsub.publishSync( Messages.UPDATE_FILTER_SETTINGS, [ model.instrumentId, filter ]);
    invalidatePresetName();
}

function handleDelayChange( aEvent ) {

    const delay = model.instrumentRef.delay;

    delay.enabled  = ( Form.getSelectedOption( delayEnabledSelect ) === "true" );
    delay.type     = parseFloat( Form.getSelectedOption( delayTypeSelect ));
    delay.time     = parseFloat( delayTimeControl.value );
    delay.feedback = parseFloat( delayFeedbackControl.value );
    delay.cutoff   = parseFloat( delayCutoffControl.value );
    delay.offset   = parseFloat( delayOffsetControl.value ) - 0.5;

    Pubsub.publishSync( Messages.UPDATE_DELAY_SETTINGS, [ model.instrumentId, delay ]);
    invalidatePresetName();
}

function handleEqChange( aEvent ) {

    const eq = model.instrumentRef.eq;

    eq.enabled  = ( Form.getSelectedOption( eqEnabledSelect ) === "true" );
    eq.lowGain  = parseFloat( eqLowControl.value );
    eq.midGain  = parseFloat( eqMidControl.value );
    eq.highGain = parseFloat( eqHighControl.value );

    Pubsub.publishSync( Messages.UPDATE_EQ_SETTINGS, [ model.instrumentId, eq ]);
    invalidatePresetName();
}

function handleOverdriveChange( aEvent ) {

    const overdrive = model.instrumentRef.overdrive;

    overdrive.enabled  = ( Form.getSelectedOption( odEnabledSelect ) === "true" );
    overdrive.drive    = parseFloat( odDriveControl.value );
    overdrive.color    = parseFloat( odColorControl.value );
    overdrive.preBand  = parseFloat( odPreBandControl.value );
    overdrive.postCut  = parseFloat( odPostCutControl.value );

    Pubsub.publishSync( Messages.UPDATE_OVERDRIVE_SETTINGS, [ model.instrumentId, overdrive ]);
    invalidatePresetName();
}

function handleInstrumentSelect( aEvent ) {
    const instrumentId = parseFloat( Form.getSelectedOption( instrumentSelect ));
    listener( self.EVENTS.SELECT_INSTRUMENT, instrumentId );
}

function handlePresetSelect( aEvent ) {
    const selectedPresetName = Form.getSelectedOption( presetSelect );
    listener( self.EVENTS.SELECT_PRESET, selectedPresetName );
}

function handlePresetSave( aEvent ) {
    const newPresetName = presetNameInput.value.replace( "*", "" );
    listener( self.EVENTS.SAVE_PRESET, newPresetName );
}

function handlePresetFocus( aEvent ) {
    keyboardController.setSuspended( true );
}

function handlePresetBlur( aEvent ) {
    keyboardController.setSuspended( false );
}

function handleInstrumentVolumeChange( aEvent ) {
    model.instrumentRef.volume = parseFloat( instrumentVolumeControl.value );
    Pubsub.publishSync(
        Messages.ADJUST_INSTRUMENT_VOLUME, [ model.instrumentId, model.instrumentRef.volume ]
    );
    invalidatePresetName();
}
