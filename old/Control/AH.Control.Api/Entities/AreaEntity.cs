using AH.Control.Api.Database;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Entities
{
    public class AreaEntity
    {
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)]
        public string AreaId { get; set; }
        public string Name { get; set; }
        public List<string> ModuleContent { get; set; } = new List<string>();
    }
}