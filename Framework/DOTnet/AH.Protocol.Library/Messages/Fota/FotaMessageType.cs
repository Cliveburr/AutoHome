using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.Fota
{
    public enum FotaMessageType : byte
    {
        Unkown = 0,
        StateReadRequest = 1,
        StateReadResponse = 2,
        StartRequest = 3,
        WriteRequest = 4,
        WriteResponse = 5
    }
}