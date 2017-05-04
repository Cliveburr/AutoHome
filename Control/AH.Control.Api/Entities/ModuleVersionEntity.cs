using AH.Protocol.Library.Module;
using Newtonsoft.Json;

namespace AH.Control.Api.Entities
{
    public class ModuleVersionEntity
    {
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)]
        public string ModuleVersionId { get; set; }
        public string Name { get; set; }
        public string Version { get; set; }
        public ModuleType Type { get; set; }
        public string User1File { get; set; }
        public byte[] User1Blob { get; set; }
        public string User2File { get; set; }
        public byte[] User2Blob { get; set; }
    }
}