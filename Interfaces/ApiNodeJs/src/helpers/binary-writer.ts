import { Buffer } from 'node:buffer';
import { BitFieldsWriter } from './bitfields-writer';

export class BinaryWriter {
 
    public buffer: Buffer;
    public index: number;
    
    public constructor(
    ) {
        this.buffer = Buffer.alloc(100);
        this.index = 0;
    }

    public writeByte(value: number): void {
        this.buffer.writeUInt8(value, this.index);
        this.index++;
    }

    public writeDirectString(value: string): void {
        this.buffer.write(value, this.index, value.length);
        this.index += value.length;
    }

    public writeString(value: string): void {
        this.buffer.writeUInt8(value.length, this.index);
        this.index++;
        this.buffer.write(value, this.index, value.length);
        this.index += value.length;
    }

    public writeFields(fields: BitFieldsWriter): void {
        this.writeByte(fields.value);
    }
}