using AH.Protocol.Library;

namespace AH.Interfaces.Api.Controllers.Module
{
    public class ModuleListRequest
    {
        public DateTime FromTime { get; set; }
    }

    public class ModuleModel
    {
        public byte UID { get; set; }
        public string Alias { get; set; }
        public string ModuleType { get; set; }
        public string Ip { get; set; }
    }

    public class BolleanRequest
    {
        public ModuleModel Model { get; set; }
        public bool Value { get; set; }
    }

    public class UintRequest
    {
        public ModuleModel Model { get; set; }
        public uint Value { get; set; }
    }

    public class UidRequest
    {
        public byte UID { get; set; }
    }
}
