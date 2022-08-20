using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Helpers
{
    public static class BitFields
    {
        public static bool ReadBool(byte value, int pos)
        {
            return (value & (1 << pos)) != 0;
        }

        public static void SetBool(ref byte value, int pos, bool set)
        {
            if (set)
            {
                value |= (byte)(1 << pos);
            }
            else
            {
                value &= (byte)~(1 << pos);
            }
        }

        public static byte ReadTwoBitsAsByte(byte value, int pos)
        {
            var btlow = (value & (1 << pos)) != 0 ? 1 : 0;
            var bthigh = (value & (1 << (pos + 1))) != 0 ? 1 : 0;
            return (byte)(btlow + (bthigh * 2));
        }

        public static void SetByteIntoTwoBits(ref byte value, int pos, byte bt)
        {
            SetBool(ref value, pos, (bt & 1) != 0);
            SetBool(ref value, pos + 1, (bt & 2) != 0);
        }
    }
}