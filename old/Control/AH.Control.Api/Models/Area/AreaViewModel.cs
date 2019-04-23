using AH.Protocol.Library.Module;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.Area
{
    public class AreaViewModel
    {
        public AreaItem[] List { get; set; }
    }

    public class AreaItem
    {
        public string Name { get; set; }
        public ModuleItem[] Modules { get; set; }
    }

    public class ModuleItem
    {
        public string ModuleId { get; set; }
        public string Alias { get; set; }
        public ModuleType Type { get; set; }
    }
}