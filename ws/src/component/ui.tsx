import { downloadWebm, processMediaWhenStop } from '@/app/media_recorder';
import { on } from 'events';
import { Button, Checkbox, Label, TextInput } from 'flowbite-react';
import React, { forwardRef, useCallback, useRef, useState } from 'react';

type InformationTextProps = {
  text: string;
  show: boolean;
};

export const InformationText = forwardRef<HTMLDivElement, InformationTextProps>(
  ({ text, show }: InformationTextProps, ref) => {
    return (
      <div
        ref={ref}
        className={
          'absolute top-[5px] text-center w-full ' + // position setting
          'text-black font-normal ' + // color & font setting
          'text-[30px] select-none whitespace-pre ' + // other settings
          `${show ? 'block' : 'hidden'}`
        }
        id="information-text"
      >
        {text}
      </div>
    );
  },
);

export const LabelWithCheckbox = ({
  id,
  value,
  onClick,
  text,
}: {
  id: string;
  value: boolean;
  onClick: (v: boolean) => void;
  text: string;
}) => {
  return (
    <div className="flex items-center gap-2 p-2 rounded border-2 w-auto hover:bg-gray-200">
      <Checkbox id={id} checked={value} onChange={(e) => onClick(e.target.checked)} />
      <Label htmlFor={id} className="select-none flex-none w-full h-full whitespace-nowrap">
        {text}
      </Label>
    </div>
  );
};

export const TextInputWithApplyButton = ({
  label,
  initial_text,
  onApply,
}: {
  label: string;
  initial_text: string;
  onApply: (text: string) => void;
}) => {
  const [text, setText] = useState(initial_text);
  const button = useRef(null);

  return (
    <div className="flex flex-wrap">
      <Label className="select-none flex-none text-xs">{label}</Label>
      <div className="flex space-x-1">
        <TextInput
          className="w-full min-w-[200px]"
          placeholder="video filename"
          value={text}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (button.current as unknown as HTMLButtonElement).focus();
            }
          }}
          onChange={(e) => setText(e.target.value)}
        />
        <Button className="" onClick={() => onApply(text)} ref={button}>
          Apply
        </Button>
      </div>
    </div>
  );
};

export type VideoRecordingUIProps = {
  is_recording: boolean;
  onChangeIsRecording: (v: boolean) => void;
  target_stream?: React.MutableRefObject<MediaStream | null>;
};

export const VideoRecordingUI = React.memo(
  ({ is_recording, onChangeIsRecording, target_stream }: VideoRecordingUIProps) => {
    const [filename, setFilename] = useState('video');
    const recorder = useRef<MediaRecorder | null>(null);

    const onClick = useCallback(() => {
      if (is_recording) {
        // stop recording
        recorder.current?.stop();
        console.log('stop recording.');
      } else {
        // start recording
        if (!target_stream || !target_stream.current) {
          console.error('target stream is not available');
          return;
        }
        recorder.current = processMediaWhenStop(target_stream.current, (blob: Blob) =>
          downloadWebm(blob, filename),
        );
        recorder.current.start();
        console.log('start recording...');
      }
      onChangeIsRecording(!is_recording);
    }, [is_recording, filename, target_stream, onChangeIsRecording]);

    return (
      <div className="relative flex">
        {/* Video Filename Input */}
        <TextInputWithApplyButton
          label="Video Filename"
          initial_text={filename}
          onApply={(text) => setFilename(text)}
        />
        <div className="relative top-0 left-0">
          <Button
            className="w-min whitespace-pre h-min mx-4 absolute bottom-0 left-0"
            outline
            gradientDuoTone="purpleToBlue"
            onClick={onClick}
            isProcessing={is_recording}
          >
            {is_recording ? 'Stop' : 'Start'} Recording
          </Button>
        </div>
      </div>
    );
  },
);
