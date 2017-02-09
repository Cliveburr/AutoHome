using AH.Protocol.Library.Module;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.Module
{
    public class IndexViewModel
    {
        public IndexModule[] List { get; set; }
    }

    public class IndexModule
    {
        public string ModuleId { get; set; }
        public ushort UID { get; set; }
        public string Alias { get; set; }
        public ModuleType Type { get; set; }
        public string AreaBelong { get; set; }
    }
}