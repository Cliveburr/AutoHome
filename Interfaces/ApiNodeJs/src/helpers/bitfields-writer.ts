

export class BitFieldsWriter {

    public constructor(
        public value: number = 0
    ) {
    }
    
    public setBool(pos: number, set: boolean): void {
        if (set) {
            this.value |= (1 << pos);
        }
        else {
            this.value &= ~(1 << pos);
        }
    }

    public setByteIntoTwoBits(pos: number, bt: number): void {
        this.setBool(pos, (bt & 1) != 0);
        this.setBool(pos + 1, (bt & 2) != 0);
    }
}