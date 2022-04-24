import {desktopCapturer} from 'electron';
import fs from 'fs';

class recorder {
    private static _instance: recorder;
    mediaRecorder : MediaRecorder;
    recordedChunks : Blob[] = [];
    started : boolean = false;
    initialized : boolean = false;
    rotatingStream : any;

    private constructor() {
        this.selectSource().then().catch(error => console.log("something happened with the promise\n" + error));
        let folder = 'C:/Screenshots';
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
            console.log('Folder Created Successfully.');
        }

    }

    public init (maxLogs: number, size: string) : void {
        if(!this.initialized){
            this.rotatingStream = require('file-stream-rotator').getStream(
                {
                    filename:"C:/Screenshots/video-%DATE%.mp4",
                    frequency:"custom",
                    verbose: false,
                    date_format: "YYYY-MM-DD-HH-mm-ss",
                    size: size,
                    max_logs: maxLogs
                }
            );
            this.initialized = true;
        }
    }

    public startRecord() : void {
      if(this.initialized && !this.started) {
        this.started = true
        this.mediaRecorder.start();
      }
    }
    public stopRecord() : void {
      if(this.initialized && this.started){
        this.started = false
        this.mediaRecorder.stop();
      }
    }

    private async selectSource() {
      const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
      });
      let source = inputSources[0]
      const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        }
      };
        navigator.mediaDevices.enumerateDevices().then(devices=> console.log(devices[0]))

      const stream = await ( <any> navigator.mediaDevices)
          .getUserMedia(constraints);

      const options = { mimeType: 'video/webm; codecs=vp9' };
      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = this.handleDataAvailable;
      this.mediaRecorder.onstop = this.handleStop;
    }

    private handleDataAvailable(e : any) : void {
      console.log('video data available');
      this.recordedChunks.push(e.data);
    }

    private async handleStop(e : any) {
      const blob = new Blob(this.recordedChunks, {
        type: 'video/webm; codecs=vp9'
      });

      const buffer = Buffer.from(await blob.arrayBuffer());
        this.rotatingStream.write(buffer);
        this.recordedChunks.length =0;
    }

    public static get Instance() {
        return this._instance || (this._instance = new this())
    }


}
export const recorderInstance = recorder.Instance;



