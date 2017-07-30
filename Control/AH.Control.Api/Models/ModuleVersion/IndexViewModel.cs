using AH.Protocol.Library.Module;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.ModuleVersion
{
    public class IndexViewModel
    {
        public IndexModuleVersion[] List { get; set; }
    }

    public class IndexModuleVersion
    {
        public string ModuleVersionId { get; set; }
        public string Name { get; set; }
        public string Version { get; set; }
        public ModuleType Type { get; set; }
    }
}