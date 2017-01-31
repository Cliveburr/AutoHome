using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Entities
{
    public class StandardEntity
    {
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)]
        public string StandardId { get; set; }
        public string Name { get; set; }
        public StandardType Type { get; set; }
    }
}