import { RapierRigidBody } from '@react-three/rapier'
import { World } from 'arancini'
import { createReactAPI } from 'arancini/react'
import * as THREE from 'three'

export type EntityType = {
    isPlayer?: true
    three?: THREE.Object3D
    rigidBody?: RapierRigidBody
}

export const world = new World<EntityType>()

export const playerQuery = world.query((e) => e.has('isPlayer', 'rigidBody'))

const { Entity, Component } = createReactAPI(world)

export { Component, Entity }