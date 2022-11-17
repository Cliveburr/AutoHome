import { BitFieldsReader } from "./bitfields-reader";

export class BinaryReader {
    
    public index: number;
    
    public constructor(
        public buffer: Buffer
    ) {
        this.index = 0;
    }

    public readByte(): number {
        const value = this.buffer.readUint8(this.index);
        this.index++;
        return value;
    }

    public readDirectString(count: number): string {
        const value = this.buffer.toString('utf8', this.index, this.index + count);
        this.index += count;
        return value;
    }

    public readString(): string {
        const count = this.buffer.readUint8(this.index);
        this.index++;
        const value = this.buffer.toString('utf8', this.index, this.index + count - 1);
        this.index += count;
        return value;
    }

    public readFields(): BitFieldsReader {
        const vl = this.readByte();
        return new BitFieldsReader(vl);
    }
}