import * as THREE from 'three';

export class Arrow extends THREE.Group {
  constructor(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    length: number,
    color: number,
    head_radius: number,
  ) {
    super();

    // 矢印の長さを設定
    const shaft_radius = head_radius / 2;
    const head_length = length / 4;
    const shaft_length = length - head_length;

    // 矢印の軸（shaft）を作成
    const shaftGeometry = new THREE.CylinderGeometry(
      shaft_radius,
      shaft_radius,
      shaft_length,
      32,
    );
    const shaftMaterial = new THREE.MeshBasicMaterial({ color });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = shaft_length / 2;

    // 矢印の頭（head）を作成
    const headGeometry = new THREE.ConeGeometry(head_radius, head_length, 32);
    const headMaterial = new THREE.MeshBasicMaterial({ color });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.rotation.x = Math.PI / 2;
    head.position.z = shaft_length + head_length / 2;

    // 矢印の軸と頭をグループに追加
    this.add(shaft);
    this.add(head);

    // 矢印の向きを設定
    this.lookAt(dir.clone());
    this.position.copy(origin);
  }
}
