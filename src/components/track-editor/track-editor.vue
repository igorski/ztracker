/**
* The MIT License (MIT)
*
* Igor Zinken 2019-2021 - https://www.igorski.nl
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
<template>
    <section id="trackEditor"
             ref="container"
             :class="{ fixed: isFixed }"
    >
        <ul class="controls">
            <li
                class="undo"
                :class="{ disabled: !canUndo }"
                @click="navigateHistory('undo')"
            ></li>
            <li
                class="redo"
                :class="{ disabled: !canRedo }"
                @click="navigateHistory('redo')"
            ></li>
            <li
                class="add-on"
                :class="{ active: showNoteEntry }"
                @click="addNoteOn"
            ></li>
            <li
                class="add-off"
                @click="addNoteOnOff"
            ></li>
            <li
                class="remove-note"
                @click="deleteNote"
            ></li>
            <li
                class="module-params"
                @click="editModuleParams"
            ></li>
            <li
                class="module-glide"
                @click="glideParams"
            ></li>
        </ul>
    </section>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from "vuex";
import Actions       from "@/definitions/actions";
import ModalWindows        from "@/definitions/modal-windows";
import EventFactory        from "@/model/factories/event-factory";
import createAction        from "@/model/factories/action-factory";
import { ACTION_NOTE_OFF } from "@/model/types/audio-event-def";
import EventUtil           from "@/utils/event-util";

import { DOM } from "zjslib";

export default {
    data: () => ({
        controlOffsetY: 0,
        lastWindowScrollY: 0,
        isFixed: false
    }),
    computed: {
        ...mapState({
            activeSong: state => state.song.activeSong,
            eventList: state => state.editor.eventList,
            showNoteEntry: state => state.editor.showNoteEntry,
        }),
        ...mapState([
            "windowSize",
            "windowScrollOffset",
        ]),
        ...mapGetters([
            "canUndo",
            "canRedo"
        ]),
        ...mapState({
            activeSong: state => state.song.activeSong,
            selectedStep: state => state.editor.selectedStep,
            activePattern: state => state.sequencer.activePattern,
            selectedInstrument: state => state.editor.selectedInstrument,
            eventList: state => state.editor.eventList,
        })
    },
    watch: {
        windowSize() {
            this.controlOffsetY = 0; // flush cache
        },
        windowScrollOffset( scrollY ) {
            // ensure the controlContainer is always visible regardless of scroll offset (for phones)
            // threshold defines when to offset the containers top, the last number defines the fixed header height
            if ( scrollY !== this.lastWindowScrollY ) {
                const threshold = ( this.controlOffsetY = this.controlOffsetY || DOM.getElementCoordinates( this.$refs.container, true ).y - 46 );

                this.isFixed = scrollY > threshold;
                this.lastWindowScrollY = scrollY;
            }
        }
    },
    methods: {
        ...mapMutations([
            "addEventAtPosition",
            "openModal",
            "saveState",
            "setShowNoteEntry",
        ]),
        ...mapActions([
            "undo",
            "redo"
        ]),
        addNoteOn() {
            this.setShowNoteEntry( !this.showNoteEntry );
        },
        addNoteOnOff(){
            const offEvent = EventFactory.createAudioEvent();
            offEvent.action = ACTION_NOTE_OFF;
            this.addEventAtPosition({ event: offEvent, store: this.$store });
        },
        deleteNote() {
            this.saveState(createAction(Actions.DELETE_EVENT, { store: this.$store }));
        },
        editModuleParams() {
            this.openModal(ModalWindows.MODULE_PARAM_EDITOR);
        },
        glideParams() {
            EventUtil.glideParameterAutomations(
                this.activeSong, this.selectedStep, this.activePattern,
                this.selectedInstrument, this.eventList, this.$store,
            );
        },
        async navigateHistory( action = "undo" ) {
            await this.$store.dispatch( action );
            // TODO this is wasteful, can we do this more elegantly?
            EventUtil.linkEvents( this.activeSong.patterns, this.eventList );
        }
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_mixins";

#trackEditor {
    @include inlineFlex();
    background-color: #000;
    vertical-align: top;
    position: relative;
    min-width: 40px;

    @include mobile() {
        position: fixed; /* keep pattern editor in static position */
        left: 0;
        height: 100%;
        z-index: 10;
    }

    .controls {
        @include list();

        li {
            width: 40px;
            height: 40px;
            margin: 0 0 1px;
            background-color: #b6b6b6;
            background-repeat: no-repeat;
            background-position: 50%;
            background-size: 50%;
            cursor: pointer;

            &.add-on {
                background-image: url('../../assets/images/icon-note-add.png');
            }
            &.add-off {
                background-image: url('../../assets/images/icon-note-mute.png');
            }
            &.remove-note {
                background-image: url('../../assets/images/icon-note-delete.png');
            }
            &.module-params {
                background-image: url('../../assets/images/icon-module-params.png');
            }
            &.module-glide {
                background-image: url('../../assets/images/icon-module-glide.png');
            }
            &.undo {
                background-image: url('../../assets/images/icon-undo.png');
            }
            &.redo {
                background-image: url('../../assets/images/icon-redo.png');
            }

            &.active {
                background-color: $color-1;
            }

            &:hover {
                background-color: $color-5;
            }

            &.disabled {
                opacity: .25;
                @include noEvents();
            }
        }
    }

    &.fixed {
        .controls {
            position: fixed;
            top: $menu-height;
        }
    }
}
</style>
