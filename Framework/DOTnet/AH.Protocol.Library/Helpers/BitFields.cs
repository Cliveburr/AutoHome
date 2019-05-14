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
    }
}