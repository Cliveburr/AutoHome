using AH.Control.Api.Entities.State;
using AH.Protocol.Library.Module;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Entities
{
    public class ModuleEntity
    {
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)]
        public string ModuleId { get; set; }
        public ushort UID { get; set; }
        public string Alias { get; set; }
        public byte[] Address { get; set; }
        public ModuleType Type { get; set; }
        public LedRibbonRgbState LedRibbonRgbState { get; set; }
        public string AreaBelong { get; set; }
    }
}
