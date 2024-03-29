import * as dgram from 'dgram';
import net from 'net';
import { Injectable } from "providerjs";
import { AppSettings } from '../settings/app-settings';
import { Buffer } from 'node:buffer';
import { BinaryReader, BinaryWriter, MessageController, MessagePackage } from '../helpers';
import { MessageHeader, ModuleModel, PortType } from '../model';

@Injectable()
export class ConnectionService {

    private udpServer!: dgram.Socket;
    private udpWaitingReady?: { e: () => void, r: (err: any) => void }[];
    public messages: MessageController;

    public constructor(
        private appSettings: AppSettings
    ) {
        this.udpWaitingReady = [];
        this.messages = new MessageController();
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
        if (this.udpWaitingReady) {
            for (const udpWaiting of this.udpWaitingReady) {
                udpWaiting.e();
            }
            delete this.udpWaitingReady;
        }
    }

    private udpError(err: Error): void {
        console.log('error', err);
        if (this.udpWaitingReady) {
            for (const udpWaiting of this.udpWaitingReady) {
                udpWaiting.r(err);
            }
            delete this.udpWaitingReady;
        }
    }

    private udpMessage(buffer: Buffer, rinfo: dgram.RemoteInfo): void {

        const reader = new BinaryReader(buffer);

        const fromUID = reader.readByte();
        const toUID = reader.readByte();
        const port = reader.readByte();
        const msg = reader.readByte();
        const header = <MessageHeader>{
            fromUID,
            toUID,
            port,
            msg
        };

        if (header.toUID == 0 || header.toUID == this.appSettings.myUID) {

            const pck = <MessagePackage>{
                header,
                reader,
                address: rinfo.address
            };
            this.messages.fire(pck);
        }
    }

    private udpClose(): void {
        console.log('close');
        if (this.udpWaitingReady) {
            for (const udpWaiting of this.udpWaitingReady) {
                udpWaiting.r('closed');
            }
            delete this.udpWaitingReady;
        }
    }

    private waitUdpReady(): Promise<void> {
        return new Promise<void>((e, r) => {
            if (this.udpWaitingReady) {
                this.udpWaitingReady.push({ e, r });
            }
            else {
                e();
            }
        });
    }

    public sendBroadcast(writer: BinaryWriter): Promise<void> {
        return new Promise<void>(async (e, r) => {
            await this.waitUdpReady();

            const sendBuffer = Buffer.alloc(writer.index);
            writer.buffer.copy(sendBuffer, 0, 0, writer.index);

            this.udpServer.setBroadcast(true);
            this.udpServer.send(sendBuffer, this.appSettings.sendPort, '255.255.255.255', (error) => {
                if (error) {
                    r(error);
                }
                else {
                    e();
                }
            });
        });
    }

    public initWriter(toUID: number, port: PortType, msg: number): BinaryWriter {

        const header = <MessageHeader>{
            fromUID: this.appSettings.myUID,
            toUID,
            port,
            msg
        }

        const writer = new BinaryWriter();
        writer.writeByte(header.fromUID);
        writer.writeByte(header.toUID);
        writer.writeByte(header.port);
        writer.writeByte(header.msg);

        return writer;
    }

    public connectTCP<T>(moduleModel: ModuleModel, usign: (client: TCPClient) => Promise<T>): Promise<T> {
        const client = new TCPClient(this, moduleModel, usign);
        return client.execute<T>(this.appSettings.sendPort);
    }
}

export class TCPClient {

    private socket: net.Socket;
    private promiseExecute?: (value: any) => void;
    private promiseReject?: (reason?: any) => void;

    public constructor(
        private connectionService: ConnectionService,
        private moduleModel: ModuleModel,
        private usign: (client: TCPClient) => Promise<any>
    ) {
        this.socket = new net.Socket();
    }

    public execute<T>(port: number): Promise<T> {
        return new Promise<T>((e, r) => {
            this.socket.on('data', this.onData.bind(this));
            this.socket.on('close', this.onClose.bind(this));
            this.socket.on('error', this.onError.bind(this))
            this.socket.connect(port, this.moduleModel.ip, this.connected.bind(this));
            this.promiseExecute = e;
            this.promiseReject = r;
        });
    }

    private connected(): void {
        this.usign(this)
            .then(value => {
                if (this.promiseExecute) {
                    this.promiseExecute(value);
                    delete this.promiseReject;
                    delete this.promiseExecute;
                }
            })
            .catch(err => {
                if (this.promiseReject) {
                    this.promiseReject(err);
                    delete this.promiseReject;
                    delete this.promiseExecute;
                }
            })
            .finally(() => {
                this.socket.destroy();
            });
    }

    private onData(buffer: Buffer): void {

        const reader = new BinaryReader(buffer);

        const fromUID = reader.readByte();
        const toUID = reader.readByte();
        const port = reader.readByte();
        const msg = reader.readByte();
        const header = <MessageHeader>{
            fromUID,
            toUID,
            port,
            msg
        };

        if (header.toUID == 0 || header.toUID == this.moduleModel.UID) {

            const pck = <MessagePackage>{
                header,
                reader,
                address: this.moduleModel.ip
            };
            this.connectionService.messages.fire(pck);
        }
    }

    private onClose(): void {
        if (this.promiseExecute) {
            this.promiseExecute(undefined);
            delete this.promiseReject;
            delete this.promiseExecute;
        }
    }

    private onError(err: Error): void {
        if (this.promiseReject) {
            this.promiseReject(err);
            delete this.promiseReject;
            delete this.promiseExecute;
        }
    }

    public send(writer: BinaryWriter): Promise<void> {
        return new Promise<void>((e, r) => {
            const data = new Uint8Array(writer.buffer.buffer.slice(0, writer.index));
            this.socket.write(data, (err) => {
                if (err) {
                    r(err);
                }
                else {
                    e();
                }
            });
        });
    }

    public sendAndWaiting(writer: BinaryWriter, portResponse: PortType, msgResponse: number): Promise<MessagePackage> {
        return new Promise<MessagePackage>((e, r) => {
            const data = new Uint8Array(writer.buffer.buffer.slice(0, writer.index));
            this.connectionService.messages.subscribe({
                fromUID: this.moduleModel.UID,
                port: portResponse,
                msg: msgResponse,
                callBack: (pck) => {
                    if (pck) {
                        e(pck);
                    }
                    else {
                        r('Timeout!');
                    }
                },
                onetime: true
            })
            this.socket.write(data, (err) => {
                if (err) {
                    r(err);
                }
            });
        });
    }
}