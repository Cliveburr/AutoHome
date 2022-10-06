using AH.Protocol.Library.Messages.CellingFan;

namespace AH.Interfaces.Api.Controllers.Module
{
    public class CellingFanState
    {
        public bool Light { get; set; }
        public bool Fan { get; set; }
        public bool FanUp { get; set; }
        public FanSpeedEnum FanSpeed { get; set; }
    }
}
