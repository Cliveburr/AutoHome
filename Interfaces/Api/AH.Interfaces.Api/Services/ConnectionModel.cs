using AH.Protocol.Library;
using System.Net;

namespace AH.Interfaces.Api.Services
{
    public class DiscoveryModuleModel
    {
        public byte UID { get; set; }
        public string Alias { get; set; }
        public ModuleType ModuleType { get; set; }
        public IPAddress Ip { get; set; }
        public string IpString { get; set; }
        public DateTime OnTime { get; set; }
    }
}
