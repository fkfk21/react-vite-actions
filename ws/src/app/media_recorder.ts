
import html2canvas from 'html2canvas';

// recorder 設定
export function processMediaWhenStop(stream: MediaStream, onStop: (blob: Blob) => void) {
  const mime = MediaRecorder.isTypeSupported("video/webm; codecs=vp9") ? "video/webm; codecs=vp9" : "video/webm";
  const mediaRecorder = new MediaRecorder(stream, { mimeType: mime })
  // start record
  const chunks: BlobPart[] = []
  mediaRecorder.addEventListener('dataavailable', e => chunks.push(e.data))

  // call on stop callback
  mediaRecorder.addEventListener('stop', async () => {
    const blob = new Blob(chunks, { type: (chunks[0] as Blob).type })
    await onStop(blob)
  })

  return mediaRecorder
}

export function downloadWebm(blob: Blob, filename: string = 'video'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename+'.webm';
  a.click();
}


export function snapshot(element: HTMLElement = document.body, postfix: string = '') {
  html2canvas(element).then(canvas => {
    const now = new Date().toLocaleString().replace(/,/g, '-');
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'snapshot-'+now+"-"+postfix+'.png';
    a.click();
  })
}
