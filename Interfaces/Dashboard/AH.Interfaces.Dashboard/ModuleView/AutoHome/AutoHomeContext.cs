using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.ModuleView.AutoHome
{
    public class AutoHomeContext : BaseContext
    {
        public string WifiName { get; set; }
        public string WifiPassword { get; set; }
        public string Alias { get; set; }
        public int UID { get; set; }
    }
}