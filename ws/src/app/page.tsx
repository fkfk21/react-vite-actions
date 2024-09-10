import React, { useReducer, useRef, useState, createContext, useEffect } from 'react';
import BoxDisplayWorld, { DisplayWorldProps, Info, OuterBoxes } from './three';
import { RootState } from '@react-three/fiber';
import { LabelWithCheckbox } from '@/component/ui';
import { Button, Checkbox, Label } from 'flowbite-react';
import { DataType, DisplayWorldManager } from './display_world_manager';

export const DataContext = createContext<string>('');

// const BoxDisplayWorld = React.lazy(() => import('./three'));

const ColorDescriptionContaioner = ({ color, name }: { color: string; name: string }) => {
  return (
    <div className="flex items-center gap-2 p-2 rounded border-2 w-min ">
      <div
        className="w-8 h-8 mr-3 rounded whitespace-nowrap"
        style={{ backgroundColor: color }}
      ></div>
      <Label className="select-none flex-none w-full h-full text-base">{name}</Label>
    </div>
  );
};

type DisplayWorldState = DisplayWorldProps & {
  save_at_end: boolean;
};
type DisplayWorldAction = {
  type: keyof DisplayWorldState;
  payload: boolean;
};

const reducer = (state: DisplayWorldState, action: DisplayWorldAction): DisplayWorldState => {
  return { ...state, [action.type]: action.payload };
};

const information_format = (
  reward_sum: number,
  num_of_boxes: number,
  packing_count: number,
  removal_count: number,
) => {
  const reward = reward_sum.toFixed(1).padStart(4, ' ');
  return (
    `Filling Rate: ${reward}%, ` +
    `Num of Boxes: ${num_of_boxes},  ` +
    `Action: ${
      packing_count + removal_count
    } (Packing: ${packing_count}, Removal: ${removal_count})`
  );
};

export function Page() {
  const ws = useRef<WebSocket | null>(null);
  const display_world_manager = useRef<DisplayWorldManager>(new DisplayWorldManager());
  const [display_state, dispatch] = useReducer(reducer, {
    show_outer: true,
    show_information: true,
    show_grid: true,
    save_at_end: false,
  });
  const [outer_boxes, setOuterBoxes] = useState<OuterBoxes>({
    item_buffer: [null, null],
    temporary_save: [null],
  });
  const [info, setInfo] = useState<Info>({
    text: information_format(0, 0, 0, 0),
    reward_sum: 0,
  });

  display_world_manager.current.config.show_outer = display_state.show_outer;

  useEffect(() => {
    if (!ws.current) {
      const socket = new WebSocket('ws://localhost:5000');
      ws.current = socket;
      socket.addEventListener('open', () => {
        console.log('WebSocket connected');
      });
      socket.addEventListener('message', (event) => {
        console.log('Message Received: ' + event.data);

        const data = JSON.parse(event.data) as DataType;
        const world_manager = display_world_manager.current;
        world_manager.update(data);

        // show information
        const rate = data.reward_sum;
        const num_of_boxes = world_manager.box_objects.length;
        const packing_count = data.packing_count;
        const removal_count = data.removal_count;
        setInfo({
          text: information_format(rate, num_of_boxes, packing_count, removal_count),
          reward_sum: rate,
        });
        setOuterBoxes({
          item_buffer: data.buffer_boxes,
          temporary_save: data.temporary_save_boxes,
        });

        // html2canvas(information.html_element, { backgroundColor: null }).then((canvas) => {
        //   information_context?.reset();
        //   information_context?.drawImage(canvas, 0, 0);
        // });

        // download snapshot
        if (data.done && display_state.save_at_end) {
          const snapshot_button = document.getElementById('snapshot_button') as HTMLButtonElement;
          snapshot_button.click();
        }
      });
      socket.addEventListener('close', () => {
        console.log('disconnected');
      });
      socket.addEventListener('error', (event) => {
        console.error('WebSocket error observed:', event);
      });
    }
  }, []);

  return (
    <>
      <h1 className="my-3 text-4xl font-bold font-serif">3D BPP Remote Viewer</h1>
      {/* <div className="flex-none">
        <ColorDescriptionContaioner color={ITEMBUFFER_COLOR as string} name="Item Buffer" />{' '}
        <ColorDescriptionContaioner
          color={TEMPORARYSAVE_COLOR as string}
          name="Temporary Backup Space"
        />
      </div> */}
      {/* <div className="flex flex-col m-3 gap-2 max-w-max"> */}
      <div className="flex flex-wrap m-3 gap-2">
        <LabelWithCheckbox
          id="show_outer"
          value={display_state.show_outer}
          onClick={(v) => dispatch({ type: 'show_outer', payload: v })}
          text="Show Outer Area"
        />
        <LabelWithCheckbox
          id="show_information"
          value={display_state.show_information}
          onClick={(v) => dispatch({ type: 'show_information', payload: v })}
          text="Show Information Text"
        />
        <LabelWithCheckbox
          id="show_grid"
          value={display_state.show_grid}
          onClick={(v) => dispatch({ type: 'show_grid', payload: v })}
          text="Show Grid of Bin"
        />
        <LabelWithCheckbox
          id="save_at_end"
          value={display_state.save_at_end}
          onClick={(v) => dispatch({ type: 'save_at_end', payload: v })}
          text="Save Snapshot at Episode End"
        />
      </div>
      <hr className="my-5" />
      <BoxDisplayWorld
        info={info}
        manager={display_world_manager}
        socket={ws}
        onCreated={(s) => s}
        boxes={outer_boxes}
        {...display_state}
      />
    </>
  );
}

export default Page;
