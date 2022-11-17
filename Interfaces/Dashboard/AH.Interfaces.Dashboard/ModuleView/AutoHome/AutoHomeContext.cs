using AH.Protocol.Library.Messages.AutoHome;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.ModuleView.AutoHome
{
    public class AutoHomeContext : BaseContext
    {
        public ObservableCollection<ConfigurationWifi> Wifis { get; set; }
        public string Alias { get; set; }
        public int UID { get; set; }
        public bool HasSelected { get; set; }
        public int FirmwareVersion { get; set; }
    }
}