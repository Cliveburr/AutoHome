
export class BitFieldsReader {

    public constructor(
        public value: number = 0
    ) {
    }

    public readBool(pos: number): boolean {
        return (this.value & (1 << pos)) != 0;
    }

    public readTwoBitsAsByte(pos: number): number {
        var btlow = (this.value & (1 << pos)) != 0 ? 1 : 0;
        var bthigh = (this.value & (1 << (pos + 1))) != 0 ? 1 : 0;
        return (btlow + (bthigh * 2));
    }
}