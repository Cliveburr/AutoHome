using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.Discovery
{
    public class DiscoveryContext
    {
        public int SendPort { get; set; }
        public int ReceivePort { get; set; }
        public ObservableCollection<DiscoveryModuleModel> ModuleList { get; set; }
    }

    public class DiscoveryModuleModel
    {
        public int UID { get; set; }
        public string Alias { get; set; }
        public string ModuleType { get; set; }
        public string Ip { get; set; }
    }
}