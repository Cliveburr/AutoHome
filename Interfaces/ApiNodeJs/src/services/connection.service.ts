import * as dgram from 'dgram';
import { Injectable } from "providerjs";
import { AppSettings } from '../settings/app-settings';
import { Buffer } from 'node:buffer';

@Injectable()
export class ConnectionService {

    private udpServer!: dgram.Socket;

    public constructor(
        private appSettings: AppSettings
    ) {
        this.openUdpServer();
    }

    private openUdpServer(): void {
        this.udpServer = dgram.createSocket('udp4');
        this.udpServer.on('listening', this.udpListening.bind(this));
        this.udpServer.on('error', this.udpError.bind(this));
        this.udpServer.on('message', this.udpMessage.bind(this));
        this.udpServer.on('close', this.udpClose.bind(this));
        this.udpServer.bind(this.appSettings.receivePort);
    }

    private udpListening(): void {
        console.log('listening');
    }

    private udpError(err: Error): void {
        console.log('error', err);
    }

    private udpMessage(msg: Buffer, rinfo: dgram.RemoteInfo): void {
        console.log('msg', msg.toString());
    }

    private udpClose(): void {
        console.log('close');
    }

    public sendPing(): void {
        const data = Buffer.alloc(8);

        data.writeUInt8(this.appSettings.myUID, 0); // From_UID
        data.writeUInt8(0, 1); // To_UID
        data.writeUInt8(1, 2); // Port
        data.writeUInt8(1, 3); // Msg

        data.write('PING', 4, 4);

        this.udpServer.setBroadcast(true);
        this.udpServer.send(data, this.appSettings.sendPort, '255.255.255.255', (error) => {
              console.log('Data sent !!!');
          });
    }
}