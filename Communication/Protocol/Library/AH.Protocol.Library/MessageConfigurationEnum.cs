using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    [Flags]
    public enum MessageConfigurationEnum : byte
    {
        None = 0,
        IsConfirmation = 1,
        NeedConfirmation = 2
    }
}