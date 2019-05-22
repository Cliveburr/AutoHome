using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor
{
    public enum TempHumiSensorMessageType : byte
    {
        Unkown = 0,
        ConfigurationReadRequest = 1,
        ConfigurationReadResponse = 2,
        ConfigurationSaveRequest = 3,
        OneShotReadRequest = 4,
        OneShotReadResponse = 5,
        DataReadRequest = 6,
        DataReadResponse = 7
    }
}