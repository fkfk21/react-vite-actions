import { InformationText, VideoRecordingUI } from '@/component/ui';
import {
  Canvas,
  CanvasProps,
  GridHelperProps,
  RootState,
  useFrame,
  useThree,
} from '@react-three/fiber';
import { Button } from 'flowbite-react';
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { snapshot } from './media_recorder';
import { MdOutlineImage } from 'react-icons/md';
import { Line, OrbitControls } from '@react-three/drei';
import { BoxSize, DisplayWorldManager } from './display_world_manager';
import html2canvas from 'html2canvas';

// const width = 1600;
// const height = 900;
const width = 1200;
const height = 675;
const bin_size = 10;
const ITEMBUFFER_COLOR: THREE.ColorRepresentation = 'skyblue';
const TEMPORARYSAVE_COLOR: THREE.ColorRepresentation = 'greenyellow';

const Box = ({ size, position, color }: { size: BoxSize; position: BoxSize; color: string }) => {
  return (
    <>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[...size, 1, 1, 1]} />
        <meshPhongMaterial
          color={color}
          opacity={0.9}
          transparent
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments position={position}>
        <edgesGeometry args={[new THREE.BoxGeometry(...size, 1, 1, 1)]} />
        <lineBasicMaterial color={0x000000} linewidth={2} />
      </lineSegments>
    </>
  );
};

const BinSurfaceGrid = () => {
  const color = 0xbbbbbb;
  const setMaterialTransparent = (self: THREE.GridHelper) => {
    self.material.transparent = true;
    self.material.opacity = 0.8;
  };
  const common_props: GridHelperProps = {
    args: [bin_size, bin_size, color, color],
    onUpdate: setMaterialTransparent,
  };
  const bs = bin_size;
  const mpi = Math.PI;

  return (
    <group>
      {/* XY Grid (Bottom) */}
      <gridHelper {...common_props} position={[bs / 2, bs / 2, 0]} rotation={[mpi / 2, 0, 0]} />

      {/* XZ Grid (Back) */}
      <gridHelper {...common_props} position={[bs / 2, bs, bs / 2]} rotation={[0, 0, 0]} />

      {/* YZ Grid (Left) */}
      <gridHelper {...common_props} position={[0, bs / 2, bs / 2]} rotation={[0, 0, mpi / 2]} />

      {/* YZ Grid (Right) */}
      <gridHelper {...common_props} position={[bs, bs / 2, bs / 2]} rotation={[0, 0, mpi / 2]} />
    </group>
  );
};

const Bin = React.memo(({ show_grid }: { show_grid: boolean }) => {
  const edge = useRef(new THREE.EdgesGeometry(new THREE.BoxGeometry(bin_size, bin_size, bin_size)));
  const material = useRef(
    new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1, opacity: 0.5, transparent: true }),
  );
  return (
    <>
      {/* 底面 */}
      <mesh position={[bin_size / 2, bin_size / 2, -bin_size / 100 / 2]}>
        <boxGeometry args={[bin_size, bin_size, bin_size / 100, 1, 1, 1]} />
        <meshPhongMaterial color={0x555555} transparent opacity={0.8} />
      </mesh>

      {/* 枠線 */}
      <lineSegments
        position={[bin_size / 2, bin_size / 2, bin_size / 2]}
        geometry={edge.current!}
        material={material.current!}
      />

      {/* グリッド */}
      {show_grid && <BinSurfaceGrid />}
    </>
  );
});

const ItemBuffer = ({ boxes }: { boxes: (BoxSize | null)[] }) => {
  const ref = useRef<THREE.Group>(new THREE.Group());
  const size = boxes.length;
  return (
    <group ref={ref} position={[-bin_size * 0.8, bin_size / 2, 0]}>
      <mesh position={[0, 0, -bin_size / 100 / 2]} scale={[1, size, 1]} name="area">
        <boxGeometry args={[bin_size / 2, bin_size / 2, bin_size / 100, 1, 1, 1]} />
        <meshPhongMaterial color={ITEMBUFFER_COLOR} transparent opacity={0.6} />
      </mesh>
      {/* Boxes */}
      {boxes.map((box_size, i) => {
        if (box_size) {
          const area_size = bin_size / 2;
          const start = (-(size - 1) / 2) * area_size;
          const y = start + i * area_size;
          return (
            <Box
              key={i}
              size={box_size}
              position={[0, y, box_size[2] / 2]}
              color={ITEMBUFFER_COLOR}
            />
          );
        }
      })}
      {/* 点線 */}
      {size > 0 &&
        [...Array(size - 1)].map((_, i) => {
          const area_size = bin_size / 2;
          const start = (-size / 2) * area_size + area_size;
          const y = start + i * area_size;
          return (
            <Line
              key={i}
              points={[
                [-area_size / 2, y, 0],
                [area_size / 2, y, 0],
              ]}
              color="#777777"
              dashed
              dashSize={area_size / 9}
              gapSize={area_size / 9}
            />
          );
        })}
    </group>
  );
};

const TemporarySave = ({ boxes }: { boxes: (BoxSize | null)[] }) => {
  const ref = useRef<THREE.Group>(new THREE.Group());
  const size = boxes.length;
  return (
    <group ref={ref} position={[bin_size + bin_size * 0.8, bin_size / 2, 0]}>
      <mesh position={[0, 0, -bin_size / 100 / 2]} scale={[1, size, 1]} name="area">
        <boxGeometry args={[bin_size / 2, bin_size / 2, bin_size / 100, 1, 1, 1]} />
        <meshPhongMaterial color={TEMPORARYSAVE_COLOR} transparent opacity={0.6} />
      </mesh>
      {/* Boxes */}
      {boxes.map((box_size, i) => {
        if (box_size) {
          const area_size = bin_size / 2;
          const start = (-(size - 1) / 2) * area_size;
          const y = start + i * area_size;
          return (
            <Box
              key={i}
              size={box_size}
              position={[0, y, box_size[2] / 2]}
              color={TEMPORARYSAVE_COLOR}
            />
          );
        }
      })}

      {/* 点線 */}
      {size > 0 &&
        [...Array(size - 1)].map((_, i) => {
          const area_size = bin_size / 2;
          const start = (-size / 2) * area_size + area_size;
          const y = start + i * area_size;
          return (
            <Line
              key={i}
              points={[
                [-area_size / 2, y, 0],
                [area_size / 2, y, 0],
              ]}
              color="#777777"
              dashed
              dashSize={area_size / 9}
              gapSize={area_size / 9}
            />
          );
        })}
    </group>
  );
};

const Environment = React.memo(() => {
  return (
    <>
      <ambientLight intensity={1.0} />
      <pointLight position={[10, 10, 10]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
      <axesHelper />
    </>
  );
});

export type DisplayWorldProps = {
  show_outer: boolean;
  show_information: boolean;
  show_grid: boolean;
};

export type OuterBoxes = {
  item_buffer: (BoxSize | null)[];
  temporary_save: (BoxSize | null)[];
};

export type WorldInnerProps = DisplayWorldProps & {
  onFrameUpdated?: () => void;
  boxes: OuterBoxes;
};

const WorldInner = (props: WorldInnerProps) => {
  const { gl, camera } = useThree((state) => state);

  useFrame(() => {
    if (props.onFrameUpdated) props.onFrameUpdated();
  });

  return (
    <>
      <Bin show_grid={props.show_grid} />
      {props.show_outer && (
        <>
          <ItemBuffer boxes={props.boxes.item_buffer} />
          <TemporarySave boxes={props.boxes.temporary_save} />
        </>
      )}
      <Environment />
    </>
  );
};

const InitRootState = (state: RootState, manager: DisplayWorldManager) => {
  const { scene, camera, gl, controls } = state;
  // scene settings
  // scene.background = new THREE.Color(0xdddddd);
  scene.background = new THREE.Color(0xffffff);
  console.log('world scene ID: ', scene.id);

  scene.add(manager.scene_group);

  // renderer settings
  gl.setSize(width, height);
  gl.setPixelRatio(window.devicePixelRatio);
};

export type Info = {
  text: string;
  reward_sum: number;
};

type WorldProps = WorldInnerProps & {
  onCreated?: (state: RootState) => void;
  manager: React.MutableRefObject<DisplayWorldManager>;
  socket: React.MutableRefObject<WebSocket | null>;
  info: Info;
};

const BoxDisplayCanvas = ({
  manager,
  onCreated,
  ...inner_props
}: Omit<WorldProps, 'info' | 'socket'>) => {
  console.log('== Box Display World Created ==');

  return (
    <Canvas
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{
        position: [bin_size * 0.5, -bin_size * 1.2, bin_size * 1.5],
        fov: 60,
        up: [0, 0, 1],
      }}
      onCreated={onCreated}
      className={'border-solid border border-black'}
    >
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        target={[bin_size / 2, bin_size / 2, bin_size / 2]}
      />
      <WorldInner {...inner_props} />
    </Canvas>
  );
};

const useCanvas = () => {
  const canvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const context = useRef(
    canvas.current.getContext('2d', {
      willReadFrequently: true,
      desynchronized: true,
    }),
  );
  canvas.current.width = 1200;

  return {
    canvas,
    context,
  };
};

const BoxDisplayWorld = ({
  manager,
  onCreated,
  onFrameUpdated,
  socket,
  info,
  ...props
}: WorldProps) => {
  const [state, setState] = useState<RootState | null>(null);
  const record_target_stream = useRef<MediaStream | null>(null);
  const record_target_canvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const record_target_context = useRef(
    record_target_canvas.current.getContext('2d', {
      willReadFrequently: true,
      desynchronized: true,
    }),
  );
  const information_canvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const information_context = useRef(
    information_canvas.current.getContext('2d', {
      willReadFrequently: true,
      desynchronized: true,
    }),
  );
  const canvas_container = useRef<HTMLDivElement>(document.createElement('div'));
  const information_element = useRef<HTMLDivElement>(document.createElement('div'));
  const [is_recording, setIsRecording] = useState(false);

  useEffect(() => {
    const [iw, ih] = [information_canvas.current.width, information_canvas.current.height];
    information_canvas.current.width = 1200;
    record_target_stream.current = record_target_canvas.current.captureStream(30);
    socket.current?.addEventListener('message', (event) => {
      html2canvas(information_element.current, {
        height: ih + 10,
        windowHeight: ih + 10,
        backgroundColor: null,
      }).then((cv) => {
        information_context.current?.reset();
        information_context.current?.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, iw, ih);
      });
    });
    return () => {};
  }, []);

  const updateCanvas = () => {
    const [rw, rh] = [record_target_canvas.current.width, record_target_canvas.current.height];
    const [iw, ih] = [information_canvas.current.width, information_canvas.current.height];
    if (state) record_target_context.current?.drawImage(state.gl.domElement, 0, 0, rw, rh);
    record_target_context.current?.drawImage(information_canvas.current, 0, 0, iw, ih);
  };

  const updateCanvasWrapper = useCallback(() => {
    if (is_recording) updateCanvas();
  }, [is_recording, updateCanvas]);

  const onFrameUpdatedWrapper = useCallback(() => {
    if (onFrameUpdated) onFrameUpdated();
    updateCanvasWrapper();
  }, [onFrameUpdated, updateCanvasWrapper]);

  const onCreatedWrapper = useCallback(
    (state: RootState) => {
      InitRootState(state, manager.current);
      setState(state);
      // media_stream.current = state.gl.domElement.captureStream(60);
      record_target_canvas.current.width = state.gl.domElement.clientWidth;
      record_target_canvas.current.height = state.gl.domElement.clientHeight;
      if (onCreated) onCreated(state);
    },
    [onCreated, manager],
  );

  const setIsRecordingWrapper = useCallback(
    (v: boolean) => {
      const [iw, ih] = [information_canvas.current.width, information_canvas.current.height];
      html2canvas(information_element.current, {
        height: ih + 10,
        windowHeight: ih + 10,
        backgroundColor: null,
      }).then((cv) => {
        information_context.current?.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, iw, ih);
      });
      setIsRecording(v);
    },
    [setIsRecording, information_context],
  );

  return (
    <>
      {/* <div className={`relative w-[${width}px] h-[${height}px]`}> */}
      {/* </div> */}
      <div className="w-full flex justify-center">
        <div ref={canvas_container} className="relative w-[1200px] h-[675px]">
          <BoxDisplayCanvas
            manager={manager}
            onCreated={onCreatedWrapper}
            onFrameUpdated={onFrameUpdatedWrapper}
            {...props}
          />
          <InformationText
            ref={information_element}
            text={info.text}
            show={props.show_information}
          />
        </div>
      </div>
      <hr className="my-5" />
      <div className="">
        <div className="m-3 w-min">
          <VideoRecordingUI
            is_recording={is_recording}
            onChangeIsRecording={setIsRecordingWrapper}
            target_stream={record_target_stream}
          />
        </div>
        {/* Download Snapshot Button */}
        <Button
          id="snapshot_button"
          className="w-min whitespace-pre m-3"
          outline
          gradientDuoTone="purpleToPink"
          onClick={() => {
            updateCanvas();
            const postfix = info.reward_sum.toString();
            snapshot(canvas_container.current, postfix);
          }}
        >
          <MdOutlineImage className="w-6 h-6 mr-1" />
          Download Snapshot
        </Button>
      </div>
    </>
  );
};

export default BoxDisplayWorld;
