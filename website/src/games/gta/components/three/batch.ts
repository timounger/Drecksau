/**
 * A crowd of one model: one instanced mesh, refilled every frame with
 * whatever of that sort is near the camera.
 *
 * @module
 * @remarks
 * The city has six hundred people and three hundred cars in it, of which a
 * hundred or so are anywhere near the camera. Each sort of thing is one draw
 * call, filled from the front every frame and cut off at however many there
 * were; it grows (once, by doubling) if a frame ever brings more than it has
 * room for. Nothing here allocates while a frame is drawn.
 */
import * as THREE from "three";
import type { Bin } from "./kit";

/** The size of an attribute with four numbers per instance. */
const FOUR = 4;

/** The per-person colours and motion of a crowd of figures. */
type Extras = Readonly<Record<string, number>>;

/** One crowd of one model. */
export class Batch {
  /** The mesh in the scene. */
  mesh: THREE.InstancedMesh;
  /** How many have been put in this frame. */
  private count = 0;
  /** How many there is room for. */
  private room: number;
  /** Whether a frame brought more than there was room for. */
  private overflow = false;
  /** The extra per-instance numbers, by name and size. */
  private readonly extras: Extras;
  /** A scratch matrix. */
  private readonly matrix = new THREE.Matrix4();
  /** A scratch scale. */
  private readonly size = new THREE.Vector3();
  /** A scratch place. */
  private readonly place = new THREE.Vector3();

  /**
   * Makes a crowd.
   *
   * @param parent - what it hangs in
   * @param geometry - the model
   * @param material - what it is made of
   * @param room - how many to make room for to begin with
   * @param shadows - whether it throws shadows
   * @param bin - where the model and the material are kept for freeing
   * @param extras - names and sizes of extra per-instance attributes
   */
  constructor(
    private readonly parent: THREE.Object3D,
    private readonly geometry: THREE.BufferGeometry,
    private readonly material: THREE.Material,
    room: number,
    private readonly shadows: boolean,
    bin: Bin,
    extras: Extras = {},
  ) {
    bin.keep(geometry);
    this.room = Math.max(1, room);
    this.extras = extras;
    this.mesh = this.make();
  }

  /** Starts a new frame. */
  begin(): void {
    this.count = 0;
  }

  /**
   * Puts one in.
   *
   * @param x - where, x
   * @param y - where, height
   * @param z - where, z
   * @param turn - which way it points
   * @param sx - how much bigger along x
   * @param sy - along y
   * @param sz - along z
   * @param colour - its colour, if it takes one
   * @returns its slot, or -1 when there was no room this frame
   */
  push(
    x: number,
    y: number,
    z: number,
    turn: THREE.Quaternion,
    sx: number,
    sy: number,
    sz: number,
    colour: THREE.Color | null,
  ): number {
    let slot = -1;
    if (this.count < this.room) {
      slot = this.count;
      this.matrix.compose(
        this.place.set(x, y, z),
        turn,
        this.size.set(sx, sy, sz),
      );
      this.mesh.setMatrixAt(slot, this.matrix);
      if (colour !== null) {
        this.mesh.setColorAt(slot, colour);
      }
      this.count += 1;
    } else {
      this.overflow = true;
    }
    return slot;
  }

  /**
   * Sets one of the extra numbers of a slot.
   *
   * @param name - which attribute
   * @param slot - which instance
   * @param a - first number
   * @param b - second
   * @param c - third
   * @param d - fourth
   */
  extra(name: string, slot: number, a: number, b = 0, c = 0, d = 0): void {
    const attribute = this.geometry.getAttribute(name);
    if (slot >= 0 && attribute instanceof THREE.InstancedBufferAttribute) {
      if (attribute.itemSize === FOUR) {
        attribute.setXYZW(slot, a, b, c, d);
      } else {
        attribute.setXYZ(slot, a, b, c);
      }
    }
  }

  /** Ends the frame: hands the GPU what changed, and grows if it must. */
  end(): void {
    this.mesh.count = this.count;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor !== null) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    for (const name of Object.keys(this.extras)) {
      const attribute = this.geometry.getAttribute(name);
      attribute.needsUpdate = true;
    }
    if (this.overflow) {
      this.overflow = false;
      this.room *= 2;
      this.parent.remove(this.mesh);
      this.mesh.dispose();
      this.mesh = this.make();
    }
  }

  /** Frees what only this crowd holds. */
  dispose(): void {
    this.parent.remove(this.mesh);
    this.mesh.dispose();
  }

  /** Makes the mesh, with room for {@link room}. */
  private make(): THREE.InstancedMesh {
    for (const [name, size] of Object.entries(this.extras)) {
      this.geometry.setAttribute(
        name,
        new THREE.InstancedBufferAttribute(
          new Float32Array(this.room * size),
          size,
        ),
      );
    }
    const mesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.room,
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Every instance gets a colour slot from the start, so the material is
    // compiled with instance colours once and never again.
    mesh.setColorAt(0, new THREE.Color(1, 1, 1));
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.castShadow = this.shadows;
    mesh.receiveShadow = true;
    this.parent.add(mesh);
    return mesh;
  }
}
