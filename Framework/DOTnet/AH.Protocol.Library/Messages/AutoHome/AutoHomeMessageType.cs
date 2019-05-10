using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.AutoHome
{
    public enum AutoHomeMessageType : byte
    {
        Unkown = 0,
        Ping = 1,
        Pong = 2,
        ConfigurationReadRequest = 3,
        ConfigurationReadResponse = 4,
        ConfigurationSaveRequest = 5,
        UIDSaveRequest = 6
    }
}