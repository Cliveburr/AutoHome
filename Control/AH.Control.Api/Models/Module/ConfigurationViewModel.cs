using AH.Protocol.Library.Module;

namespace AH.Control.Api.Models.Module
{
    public class ConfigurationViewModel
    {
        public ushort UID { get; set; }
        public string Alias { get; set; }
        public ModuleType Type { get; set; }
        public string version { get; set; }
        public string Wifiname { get; set; }
        public string Wifipass { get; set; }
    }
}