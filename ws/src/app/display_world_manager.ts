import { Arrow } from '@/component/three/arrow';
import { Display } from 'html2canvas/dist/types/css/property-descriptors/display';
import * as THREE from 'three';

const BIN_SIZE = 10;

export type DataInfoType = {
  reward_sum: number;
  packing_count: number;
  removal_count: number;
  done: boolean;
};

export type BoxSize = [width: number, height: number, depth: number];
export type BoxPosition = [x: number, y: number, z: number];

export type JsonBoxData = {
  position: BoxPosition;
  size: BoxSize;
  mass: number;
};

export type DataBoxGraphType = {
  id_relation: Record<number, JsonBoxData>;
  graph: Record<number, number[]>;
  removable_ids: number[];
  out_of_candidate_ids: number[];
  last_packed_id: number;
};

export type DataOuterBoxesType = {
  buffer_boxes: (BoxSize | null)[];
  temporary_save_boxes: (BoxSize | null)[];
};

export type DataType = DataBoxGraphType & DataOuterBoxesType & DataInfoType;

export class BoxData {
  id: number;
  center: THREE.Vector3;
  size: THREE.Vector3;
  mass: number;
  color: number;

  constructor(id: number, center: THREE.Vector3, size: THREE.Vector3, mass: number, color: number) {
    this.id = id;
    this.center = center;
    this.size = size;
    this.mass = mass;
    this.color = color;
  }
}

export type InteractiveConfig = {
  show_center: boolean;
  show_graph: boolean;
  show_outer: boolean;
};

export type DisplayWorldConfig = InteractiveConfig & {
  random_color: boolean;
  box_transparent: boolean;
  box_edge_line_width: number;
};

export class DisplayWorldManager {
  item_buffer_group: THREE.Group = new THREE.Group();
  temporary_save_group: THREE.Group = new THREE.Group();
  box_objects: [THREE.Mesh, THREE.LineSegments][] = [];
  sphere_objects: THREE.Mesh[] = [];
  arrow_objects: Arrow[] = [];
  surface_grids: THREE.GridHelper[] = [];
  surface_grid_group: THREE.Group = new THREE.Group();

  scene_group: THREE.Group = new THREE.Group();

  config: DisplayWorldConfig = {
    show_center: true,
    show_graph: true,
    show_outer: true,
    random_color: false,
    box_transparent: false,
    box_edge_line_width: 2,
  };

  constructor() {}

  updateBoxGraph = (json_data: DataType) => {
    ////////////// update boxes in scene /////////////
    // box削除
    this.box_objects.forEach((tuple) => {
      tuple.forEach((obj) => {
        if (obj) {
          this.scene_group.remove(obj);
          obj.geometry.dispose();
          if (obj.material instanceof THREE.Material) obj.material.dispose();
        }
      });
    });
    this.box_objects.length = 0; // clear

    // box追加
    const box_list: BoxData[] = Object.entries(json_data.id_relation).map(([key, value]) => {
      const box_id = parseInt(key);
      const box = value as JsonBoxData;
      const position = new THREE.Vector3(box.position[0], box.position[1], box.position[2]);
      const size = new THREE.Vector3(box.size[0], box.size[1], box.size[2]);
      const mass = box.mass;
      var color: number;
      if (this.config.random_color) {
        color = Math.floor(Math.random() * 0xffffff);
      } else {
        if (json_data.removable_ids.includes(box_id)) color = 0xff0000; // red
        else if (json_data.out_of_candidate_ids.includes(box_id)) color = 0xffa5; // orange
        else if (box_id == json_data.last_packed_id) color = color = 0xff00ff; // magenta
        else color = 0x0000ff; // blue
      }

      return new BoxData(box_id, position, size, mass, color);
    });
    box_list.forEach((box) => {
      const added_tuple = this.addBox(box.size, box.center, box.color, this.scene_group);
      this.box_objects.push(added_tuple);
    });

    ////////////// update center of boxes /////////////
    if (this.config.show_center) {
      this._updateBoxCenters(json_data, box_list);
    }

    ////////////// update directed graph in scene /////////////
    if (this.config.show_graph) {
      this._updateGraphArrows(json_data, box_list);
    }

    ///////////// update information about inside bin /////////////
    // this.reward_sum = json_data.reward_sum;
    // this.num_of_boxes = box_list.length;
    // this.packing_count = json_data.packing_count;
    // this.removal_count = json_data.removal_count;
  };

  addBox = (
    size: THREE.Vector3,
    position: THREE.Vector3,
    color: THREE.ColorRepresentation = 0x0000ff,
    group: THREE.Group = this.scene_group,
  ): [THREE.Mesh, THREE.LineSegments] => {
    const geometry = new THREE.BoxGeometry(...size.toArray(), 1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: color,
      transparent: this.config.box_transparent,
      opacity: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const box: THREE.Mesh = new THREE.Mesh(geometry, material);
    box.position.set(...position.toArray());
    this.scene_group.add(box);

    const edge_geometry = new THREE.EdgesGeometry(geometry);
    const edge_material = new THREE.LineBasicMaterial({
      linewidth: this.config.box_edge_line_width,
    });
    edge_material.color.setHex(0x000000);
    const edge_segments = new THREE.LineSegments(edge_geometry, edge_material);
    edge_segments.position.set(...position.toArray());

    this.scene_group.add(edge_segments);
    return [box, edge_segments];
  };

  _updateBoxCenters(json_data: DataType, box_list: BoxData[]): void {
    // sphere削除
    this.sphere_objects.forEach((sphere) => {
      if (sphere) {
        this.scene_group.remove(sphere);
        sphere.geometry.dispose();
        if (sphere.material instanceof THREE.Material) sphere.material.dispose();
      }
    });
    this.sphere_objects.length = 0; // clear

    // sphere追加
    box_list.forEach((box) => {
      const geometry = new THREE.SphereGeometry(0.2, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: box.color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(box.center);
      this.scene_group.add(sphere);
      this.sphere_objects.push(sphere);
    });
  }

  _updateGraphArrows(json_data: DataType, box_list: BoxData[]): void {
    // arrow削除
    this.arrow_objects.forEach((arrow) => {
      if (arrow) this.scene_group.remove(arrow);
    });
    this.arrow_objects.length = 0; // clear

    // arrow追加
    Object.entries(json_data.graph).forEach(([key, value]) => {
      const from_id = parseInt(key);
      const to_id_list = value as number[];
      const from_box = box_list.find((box) => box.id === from_id);
      to_id_list.forEach((to_id) => {
        const to_box = box_list.find((box) => box.id === to_id);
        if (from_box && to_box) {
          const dir = new THREE.Vector3().subVectors(to_box.center, from_box.center).normalize();
          const length = from_box.center.distanceTo(to_box.center);
          const arrow = new Arrow(from_box.center, dir, length, 0x000000, 0.2);
          this.scene_group.add(arrow);
          this.arrow_objects.push(arrow);
        }
      });
    });
  }

  _updateItemBuffer(json_data: DataType) {
    const size = json_data.buffer_boxes.length;
    const group = this.item_buffer_group;
    const area = group.getObjectByName('area');
    if (area) area.scale.set(1, size, 1);

    const area_size = BIN_SIZE / 2;
    const color = 0x222222;

    // box削除
    group.clear();
    if (area) group.add(area);

    // box追加
    const start = (-(size - 1) / 2) * area_size;
    json_data.buffer_boxes.forEach((size, index) => {
      const y = start + index * area_size;
      if (size) {
        this.addBox(new THREE.Vector3(...size), new THREE.Vector3(0, y, size[2] / 2), color, group);
      }
    });
  }

  private _updateTemporarySave(json_data: DataType) {
    const size = json_data.temporary_save_boxes.length;
    if (size === 0) {
      this.temporary_save_group.clear();
      return;
    }
    const group = this.temporary_save_group;
    const area = group.getObjectByName('area');
    if (area) area.scale.set(1, size, 1);

    const area_size = BIN_SIZE / 2;
    const color = 0x222222;

    // box削除
    group.clear();
    if (area) group.add(area);

    // box追加
    const start = (-(size - 1) / 2) * area_size;
    json_data.temporary_save_boxes.forEach((size, index) => {
      const y = start + index * area_size;
      if (size) {
        this.addBox(new THREE.Vector3(...size), new THREE.Vector3(0, y, size[2] / 2), color, group);
      }
    });
  }

  updateOuterBoxes(json_data: DataType) {
    if (this.config.show_outer) {
      this._updateItemBuffer(json_data);
      this._updateTemporarySave(json_data);
    } else {
      this.item_buffer_group.clear();
      this.temporary_save_group.clear();
    }
  }

  update(json_data: DataType) {
    this.updateBoxGraph(json_data);
    // this.updateOuterBoxes(json_data);
  }
}
