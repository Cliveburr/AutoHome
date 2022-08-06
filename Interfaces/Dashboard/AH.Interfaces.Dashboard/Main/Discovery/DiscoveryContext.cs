using AH.Protocol.Library;
using System.Collections.ObjectModel;
using System.Net;

namespace AH.Interfaces.Dashboard.Main.Discovery
{
    public class DiscoveryContext
    {
        public ObservableCollection<DiscoveryModuleModel> ModuleList { get; set; }
    }

    public class DiscoveryModuleModel
    {
        public byte UID { get; set; }
        public string Alias { get; set; }
        public ModuleType ModuleType { get; set; }
        public IPAddress Ip { get; set; }
        public string IpString { get; set; }
    }
}