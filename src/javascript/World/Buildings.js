import * as THREE from 'three'

// Procedural buildings (design ported from tools/buildBuildings.mjs in tekion-campus.patch, generated at runtime
// instead of shipping GLBs). Z is up, ground at z = 0, the glass front faces -y (towards the camera).
// Each factory returns { base, collision, width, depth } ready for objects.add(); call it once per placement
// because static objects merge (and mutate) their geometry.

class Building
{
    constructor(_scale = 1.2)
    {
        this.scale = _scale
        this.base = []
        this.collision = []
        this.count = 0
        this.width = 0
        this.depth = 0
        this.height = 0
    }

    // Box centred on (x, y), sitting on z0
    box(_material, _w, _d, _h, _x, _y, _z0 = 0)
    {
        [_w, _d, _h, _x, _y, _z0] = [_w, _d, _h, _x, _y, _z0].map((_value) => _value * this.scale)
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(_w, _d, _h))
        mesh.position.set(_x, _y, _z0 + _h / 2)
        return this.add(_material, mesh)
    }

    // Prism: profile points [x, z] extruded along y for depth d, centred on (x, y)
    prism(_material, _points, _d, _x, _y, _z0 = 0)
    {
        _points = _points.map(([_a, _b]) => new THREE.Vector2(_a * this.scale, _b * this.scale))
        ;[_d, _x, _y, _z0] = [_d, _x, _y, _z0].map((_value) => _value * this.scale)
        const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(_points), { depth: _d, bevelEnabled: false })
        geometry.rotateX(Math.PI / 2)
        geometry.translate(_x, _y + _d / 2, _z0)
        return this.add(_material, new THREE.Mesh(geometry))
    }

    add(_material, _mesh)
    {
        _mesh.name = `shade${_material}_${++this.count}`
        this.base.push(_mesh)
        return this
    }

    hit(_w, _d, _h, _x, _y, _z0 = 0)
    {
        [_w, _d, _h, _x, _y, _z0] = [_w, _d, _h, _x, _y, _z0].map((_value) => _value * this.scale)
        const mesh = new THREE.Mesh(new THREE.BufferGeometry())
        mesh.name = `cube_${this.collision.length + 1}`
        mesh.scale.set(_w, _d, _h)
        mesh.position.set(_x, _y, _z0 + _h / 2)
        this.collision.push(mesh)
        this.width = Math.max(this.width, _w)
        this.depth = Math.max(this.depth, _d)
        this.height = Math.max(this.height, _z0 + _h)
        return this
    }

    result()
    {
        return { base: { children: this.base }, collision: { children: this.collision }, width: this.width, depth: this.depth, height: this.height }
    }
}

// ---- Detail helpers (all dimensions before scale; front is -y) ----

// Grid of window panes separated by white mullions (the wall shows through the gaps)
Building.prototype.windows = function(_x, _y, _z0, _w, _h, _cols, _rows, _gap = 0.12)
{
    const w = (_w - _gap * (_cols + 1)) / _cols
    const h = (_h - _gap * (_rows + 1)) / _rows
    for(let c = 0; c < _cols; c++)
    {
        for(let r = 0; r < _rows; r++)
        {
            this.box('Blue', w, 0.08, h, _x - _w / 2 + _gap + w / 2 + c * (w + _gap), _y, _z0 + _gap + r * (h + _gap))
        }
    }
    return this
}

// Low wall around a flat roof
Building.prototype.parapet = function(_w, _d, _zTop, _h = 0.22)
{
    this.box('White', _w, 0.14, _h, 0, - _d / 2, _zTop)
    this.box('White', _w, 0.14, _h, 0, _d / 2, _zTop)
    this.box('White', 0.14, _d, _h, - _w / 2, 0, _zTop)
    this.box('White', 0.14, _d, _h, _w / 2, 0, _zTop)
    return this
}

// Rooftop air-conditioning unit
Building.prototype.hvac = function(_x, _y, _zTop)
{
    this.box('Gray', 1, 0.8, 0.45, _x, _y, _zTop)
    this.box('Metal', 0.5, 0.5, 0.08, _x - 0.1, _y, _zTop + 0.45)
    return this
}

// Glass door with a canopy
Building.prototype.door = function(_x, _y, _z0 = 0)
{
    this.box('Black', 1.1, 0.12, 1.15, _x, _y, _z0)
    this.box('Blue', 0.9, 0.14, 0.95, _x, _y - 0.02, _z0 + 0.05)
    this.box('Gray', 1.8, 0.9, 0.1, _x, _y - 0.4, _z0 + 1.25)
    return this
}

// Paved forecourt in front of the building
Building.prototype.forecourt = function(_w, _y, _depth = 1.6)
{
    this.box('Gray', _w, _depth, 0.04, 0, _y - _depth / 2, 0)
    return this
}

Building.prototype.lamp = function(_x, _y)
{
    this.box('Metal', 0.07, 0.07, 2, _x, _y)
    this.box('White', 0.4, 0.18, 0.08, _x, _y, 2)
    return this
}

// Small parked car
Building.prototype.car = function(_x, _y, _body = 'White')
{
    this.box(_body, 1.1, 0.5, 0.22, _x, _y, 0.05)
    this.box('Blue', 0.55, 0.42, 0.18, _x - 0.05, _y, 0.27)
    this.box('Black', 0.2, 0.52, 0.1, _x - 0.35, _y, 0)
    this.box('Black', 0.2, 0.52, 0.1, _x + 0.35, _y, 0)
    return this
}

// Delivery truck (trailer + cab)
Building.prototype.truck = function(_x, _y)
{
    this.box('White', 2.4, 0.9, 0.9, _x, _y, 0.2)
    this.box('Gray', 0.8, 0.9, 0.7, _x + 1.6, _y, 0.2)
    this.box('Blue', 0.05, 0.7, 0.3, _x + 2.0, _y, 0.5)
    this.box('Black', 3.2, 0.95, 0.18, _x + 0.4, _y, 0.05)
    return this
}

// ---- Buildings ----

// Warehouse: sawtooth roof, glass office front, dock doors, truck
export function warehouse()
{
    const b = new Building()
    b.box('White', 9, 6, 2.2, 0, 0)
    b.box('Gray', 9.1, 6.1, 0.12, 0, 0, 2.2)
    b.parapet(9.1, 6.1, 2.32, 0.18)
    for(let i = 0; i < 4; i++)
    {
        b.prism('Gray', [[- 4.5 + i * 2.25, 0], [- 2.25 + i * 2.25, 0], [- 2.25 + i * 2.25, 1]], 5.4, 0, 0, 2.5)
        b.box('Blue', 1.7, 0.05, 0.4, - 3.4 + i * 2.25, 0, 3.0) // skylight
    }
    b.windows(- 1.6, - 3.04, 0.5, 4.8, 1.3, 5, 2)
    for(let i = 0; i < 4; i++)
    {
        b.box('Gray', 0.7, 0.14, 1.3, 2.2 + i * 0.85, - 3.05, 0.1) // dock doors
        b.box('Black', 0.7, 0.16, 0.06, 2.2 + i * 0.85, - 3.06, 0.9)
        b.box('Black', 0.7, 0.16, 0.06, 2.2 + i * 0.85, - 3.06, 0.65)
    }
    b.box('Gray', 3.6, 0.9, 0.3, 3.5, - 3.5)             // loading dock
    b.box('Orange', 3.2, 0.14, 0.12, - 1.6, - 3.06, 1.95) // sign band
    b.forecourt(9.4, - 3.05, 1.2)
    b.truck(6.2, - 4.2)
    b.lamp(- 4.6, - 3.7)
    b.lamp(4.8, 2.9)
    b.hvac(- 3.4, 2, 2.32)
    b.hit(9, 6, 2.5, 0, 0)
    return b.result()
}

// Two-storey office: glazed floors, entrance, roof plant, terrace
export function office()
{
    const b = new Building()
    b.box('White', 6, 4, 1.4, 0, 0)
    b.box('White', 5, 3.4, 1.2, - 0.4, 0, 1.4)
    b.box('Gray', 6.4, 4.4, 0.1, 0, 0, 1.4)
    b.box('Gray', 5.2, 3.6, 0.1, - 0.4, 0, 2.6)
    b.parapet(5.2, 3.6, 2.7)
    b.windows(0.6, - 2.04, 0.2, 4.3, 0.95, 5, 1)
    b.windows(- 0.4, - 1.74, 1.55, 4.6, 0.9, 6, 1, 0.1)
    b.windows(2.55, 0.5, 1.55, 0.1, 0.9, 1, 1)
    b.door(- 2.2, - 2.06)
    b.box('Beige', 1.4, 1.2, 0.4, 2.1, - 1, 1.5) // terrace furniture
    b.box('Green', 0.5, 0.5, 0.35, 2.9, - 1.7, 1.5)
    b.box('Green', 0.5, 0.5, 0.35, 1.3, - 1.7, 1.5)
    b.hvac(0.8, 0.4, 2.7)
    b.hvac(- 1.4, 0.8, 2.7)
    b.box('Metal', 0.06, 0.06, 1.4, - 2.4, 1.2, 2.7) // mast
    b.forecourt(6.4, - 2.0, 1.4)
    b.car(3.8, - 3.1, 'Gray')
    b.car(2.4, - 3.1)
    b.lamp(- 3.4, - 2.8)
    b.hit(6.4, 4.4, 2.7, 0, 0)
    return b.result()
}

// Showroom: floor-to-ceiling glass, canopy on columns, cars on display
export function showroom()
{
    const b = new Building()
    b.box('White', 8, 4.5, 1.6, 0, 0)
    b.box('Gray', 8.2, 4.7, 0.1, 0, 0, 1.6)
    b.parapet(8.2, 4.7, 1.7)
    b.windows(0, - 2.3, 0.15, 6.6, 1.3, 4, 1, 0.18)
    b.prism('Gray', [[- 4.2, 0], [4.2, 0], [4.2, 0.35], [- 4.2, 0.15]], 5.6, 0, - 0.5, 1.7)
    b.box('Metal', 0.15, 0.15, 1.7, - 3.8, - 3.2)
    b.box('Metal', 0.15, 0.15, 1.7, 3.8, - 3.2)
    b.box('Metal', 0.15, 0.15, 1.7, 0, - 3.2)
    b.box('Orange', 2.4, 0.1, 0.22, 0, - 2.35, 1.35) // sign band
    b.forecourt(8.4, - 2.3, 2.2)
    b.car(- 1.9, - 3.3)
    b.car(0.2, - 3.3, 'Gray')
    b.car(2.2, - 3.3, 'Black')
    b.hvac(2.5, 0.5, 1.7)
    b.hvac(- 2.2, 0.8, 1.7)
    b.lamp(- 4.6, - 3.8)
    b.lamp(4.6, - 3.8)
    b.hit(8.4, 6, 2, 0, - 0.5)
    return b.result()
}

// Depot: roller doors, office strip, roof plant room
export function depot()
{
    const b = new Building()
    b.box('White', 6, 4.5, 1.6, 0, 0)
    b.box('Gray', 6.2, 4.7, 0.1, 0, 0, 1.6)
    b.parapet(6.2, 4.7, 1.7)
    b.windows(- 1.5, - 2.28, 0.4, 2.6, 0.9, 3, 1)
    for(let i = 0; i < 2; i++)
    {
        b.box('Gray', 1.2, 0.14, 1.25, 1.2 + i * 1.5, - 2.3, 0)
        for(let k = 0; k < 4; k++)
        {
            b.box('Metal', 1.2, 0.16, 0.04, 1.2 + i * 1.5, - 2.31, 0.25 + k * 0.28)
        }
    }
    b.box('White', 2.2, 1.6, 0.8, 1.8, 1, 1.7)
    b.windows(1.8, - 0.1, 1.85, 1.8, 0.4, 3, 1, 0.1)
    b.hvac(- 1.8, 1, 1.7)
    b.box('Orange', 1.8, 0.1, 0.18, - 1.5, - 2.31, 1.3)
    b.forecourt(6.4, - 2.25, 1.6)
    b.truck(- 3.4, - 3.9)
    b.lamp(3.5, - 3.2)
    b.hit(6.2, 4.7, 1.8, 0, 0)
    return b.result()
}

// Annex: long low block with a continuous glass band
export function annex()
{
    const b = new Building()
    b.box('White', 8, 3, 1.3, 0, 0)
    b.box('Gray', 8.2, 3.2, 0.1, 0, 0, 1.3)
    b.parapet(8.2, 3.2, 1.4)
    b.windows(- 0.8, - 1.54, 0.3, 6.2, 0.75, 8, 1, 0.1)
    b.door(3.3, - 1.56)
    b.box('White', 2.5, 1.6, 0.6, 2, 0, 1.4)
    b.hvac(- 2.5, 0.5, 1.4)
    b.hvac(- 0.6, 0.6, 1.4)
    b.box('Blue', 1.6, 1.2, 0.05, - 2.5, - 0.6, 1.4) // roof lights
    b.forecourt(8.4, - 1.5, 1.4)
    b.car(- 2.4, - 2.6, 'Gray')
    b.car(- 0.9, - 2.6)
    b.lamp(4.4, - 2.4)
    b.hit(8.2, 3.2, 1.5, 0, 0)
    return b.result()
}

// Modern house: offset volumes, large glazing, terrace, planting
export function house()
{
    const b = new Building()
    b.box('White', 4, 3, 1.3, 0, 0)
    b.box('White', 2.6, 2.4, 1.1, 0.6, 0, 1.3)
    b.box('Gray', 4.2, 3.2, 0.1, 0, 0, 1.3)
    b.box('Gray', 2.8, 2.6, 0.1, 0.6, 0, 2.4)
    b.windows(- 0.4, - 1.54, 0.25, 2.8, 0.85, 3, 1, 0.14)
    b.windows(0.6, - 1.24, 1.5, 2.2, 0.7, 3, 1, 0.12)
    b.door(1.4, - 1.56)
    b.box('Beige', 1.2, 1.2, 0.3, - 1.6, - 2.2) // terrace
    b.box('Green', 0.6, 0.6, 0.5, - 2.1, - 2.8)
    b.box('Green', 0.6, 0.6, 0.4, - 1.2, - 2.9)
    b.box('Gray', 1.4, 0.5, 0.2, 2.5, - 2.6, 0)   // drive
    b.car(2.5, - 2.8, 'Gray')
    b.lamp(- 2.6, - 1.8)
    b.hit(4.2, 3.2, 2.4, 0, 0)
    return b.result()
}

export const buildingTypes = [warehouse, office, showroom, depot, annex, house]

// Server farm: white racks on a slab. The translucent glass base and floating cards are added by CampusSection.
export function serverFarm(_scale = 1.8)
{
    const b = new Building(_scale)
    for(let r = 0; r < 2; r++)
    {
        for(let i = 0; i < 6; i++)
        {
            const x = - 3.6 + i * 1.45
            const y = - 1 + r * 2
            const h = 0.7 + ((i * 7 + r * 3) % 4) * 0.15
            b.box('White', 0.9, 0.9, h, x, y, 0.35)
            b.box('Blue', 0.78, 0.78, 0.05, x, y, 0.35 + h) // pale blue lit top, like the reference
            for(let k = 0; k < 3; k++)
            {
                b.box('Gray', 0.7, 0.04, 0.05, x, y - 0.46, 0.35 + h * (0.25 + k * 0.22)) // drive bays
                b.box('EmeraldGreen', 0.06, 0.05, 0.05, x + 0.28, y - 0.47, 0.35 + h * (0.25 + k * 0.22))
            }
        }
    }
    b.hit(11, 6, 0.4, 0, 0)
    b.hit(9, 3.4, 1.2, 0, - 0.4, 0.4)
    return b.result()
}
