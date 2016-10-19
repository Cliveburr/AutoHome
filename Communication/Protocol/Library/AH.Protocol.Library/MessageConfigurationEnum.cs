using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    [Flags]
    public enum MessageConfigurationEnum : byte
    {
        IsConfimation = 1,
        NeedConfimation = 2
    }
}