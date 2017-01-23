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
        public string Alias { get; set; }
    }
}
