using AH.Protocol.Library.Module;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.Module
{
    public class ByAreaViewModel
    {
        public string ModuleId { get; set; }
        public string Alias { get; set; }
        public ModuleType Type { get; set; }
    }
}