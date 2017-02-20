using AH.Control.Api.Entities.State;
using AH.Control.Api.Models.Standard;
using AH.Protocol.Library.Module;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.Module
{
    public class MobileEditorViewModel
    {
        public string ModuleId { get; set; }
        public string Alias { get; set; }
        public ModuleType Type { get; set; }
        public string Area { get; set; }
        public LedRibbonRgbState LedRibbonRgbState { get; set; }
        public StandardListViewModel[] StandardList { get; set; }
    }
}