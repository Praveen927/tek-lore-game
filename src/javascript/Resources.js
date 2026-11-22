import * as THREE from 'three'

import Loader from './Utils/Loader.js'
import EventEmitter from './Utils/EventEmitter.js'

export default class Resources extends EventEmitter
{
    constructor()
    {
        super()

        this.loader = new Loader()
        this.items = {}

        this.loader.load([
            // Matcaps
            { name: 'matcapBeige', source: './models/matcaps/beige.png', type: 'texture' },
            { name: 'matcapBlack', source: './models/matcaps/black.png', type: 'texture' },
            { name: 'matcapOrange', source: './models/matcaps/orange.png', type: 'texture' },
            { name: 'matcapRed', source: './models/matcaps/red.png', type: 'texture' },
            { name: 'matcapWhite', source: './models/matcaps/white.png', type: 'texture' },
            { name: 'matcapGreen', source: './models/matcaps/green.png', type: 'texture' },
            { name: 'matcapBrown', source: './models/matcaps/brown.png', type: 'texture' },
            { name: 'matcapGray', source: './models/matcaps/gray.png', type: 'texture' },
            { name: 'matcapEmeraldGreen', source: './models/matcaps/emeraldGreen.png', type: 'texture' },
            { name: 'matcapPurple', source: './models/matcaps/purple.png', type: 'texture' },
            { name: 'matcapBlue', source: './models/matcaps/blue.png', type: 'texture' },
            { name: 'matcapYellow', source: './models/matcaps/yellow.png', type: 'texture' },
            { name: 'matcapMetal', source: './models/matcaps/metal.png', type: 'texture' },
            // { name: 'matcapGold', source: './models/matcaps/gold.png', type: 'texture' },

            // Intro

            { name: 'introInstructionsLabels', source: './models/intro/instructions/labels.glb' },
            { name: 'introInstructionsArrows', source: './models/intro/instructions/arrows.png', type: 'texture' },
            { name: 'introInstructionsControls', source: './models/intro/instructions/controls.png', type: 'texture' },
            { name: 'introInstructionsOther', source: './models/intro/instructions/other.png', type: 'texture' },

            { name: 'introArrowKeyBase', source: './models/intro/arrowKey/base.glb' },
            { name: 'introArrowKeyCollision', source: './models/intro/arrowKey/collision.glb' },











            // Intro

            // Car default
            { name: 'carDefaultChassis', source: './models/car/default/chassis.glb' },
            { name: 'carDefaultWheel', source: './models/car/default/wheel.glb' },
            { name: 'carDefaultBackLightsBrake', source: './models/car/default/backLightsBrake.glb' },
            { name: 'carDefaultBackLightsReverse', source: './models/car/default/backLightsReverse.glb' },
            // { name: 'carDefaultBunnyEarLeft', source: './models/car/default/bunnyEarLeft.glb' },
            // { name: 'carDefaultBunnyEarRight', source: './models/car/default/bunnyEarRight.glb' },

            // Car default
            { name: 'carCyberTruckChassis', source: './models/car/cyberTruck/chassis.glb' },
            { name: 'carCyberTruckWheel', source: './models/car/cyberTruck/wheel.glb' },
            { name: 'carCyberTruckBackLightsBrake', source: './models/car/cyberTruck/backLightsBrake.glb' },
            { name: 'carCyberTruckBackLightsReverse', source: './models/car/cyberTruck/backLightsReverse.glb' },

            // Project
            { name: 'projectsBoardStructure', source: './models/projects/board/structure.glb' },
            { name: 'projectsBoardCollision', source: './models/projects/board/collision.glb' },
            { name: 'projectsBoardStructureFloorShadow', source: './models/projects/board/floorShadow.png', type: 'texture' },
            { name: 'projectsBoardPlane', source: './models/projects/board/plane.glb' },



            // Information




            // Playground

            // Brick

            // Horn
            { name: 'hornBase', source: './models/horn/base.glb' },
            { name: 'hornCollision', source: './models/horn/collision.glb' },

            // // Distinction A

            // // Distinction B

            // // Distinction C

            // // Cone

            // // Awwwards trophy

            // Webby trophy

            // Lemon
            { name: 'lemonBase', source: './models/lemon/base.glb' },
            { name: 'lemonCollision', source: './models/lemon/collision.glb' },

            // Bownling ball
            { name: 'bowlingBallBase', source: './models/bowlingBall/base.glb' },
            { name: 'bowlingBallCollision', source: './models/bowlingBall/collision.glb' },

            // Bownling ball
            { name: 'bowlingPinBase', source: './models/bowlingPin/base.glb' },
            { name: 'bowlingPinCollision', source: './models/bowlingPin/collision.glb' },

            // Areas
            { name: 'areaKeyEnter', source: './models/area/keyEnter.png', type: 'texture' },
            { name: 'areaEnter', source: './models/area/enter.png', type: 'texture' },
            { name: 'areaOpen', source: './models/area/open.png', type: 'texture' },
            { name: 'areaReset', source: './models/area/reset.png', type: 'texture' },
            { name: 'areaQuestionMark', source: './models/area/questionMark.png', type: 'texture' },

            // Tiles





            // Konami
            { name: 'konamiLabel', source: './models/konami/label.png', type: 'texture' },
            { name: 'konamiLabelTouch', source: './models/konami/label-touch.png', type: 'texture' },

            // Wigs

            // // Egg
            // { name: 'eggBase', source: './models/egg/base.glb' },
            // { name: 'eggCollision', source: './models/egg/collision.glb' },
        ])

        this.loader.on('fileEnd', (_resource, _data) =>
        {
            this.items[_resource.name] = _data

            // Texture
            if(_resource.type === 'texture')
            {
                const texture = new THREE.Texture(_data)
                texture.needsUpdate = true

                this.items[`${_resource.name}Texture`] = texture
            }

            // Trigger progress
            this.trigger('progress', [this.loader.loaded / this.loader.toLoad])
        })

        this.loader.on('end', () =>
        {
            // Trigger ready
            this.trigger('ready')
        })
    }
}
