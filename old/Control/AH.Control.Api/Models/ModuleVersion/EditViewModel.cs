using AH.Protocol.Library.Module;

namespace AH.Control.Api.Models.ModuleVersion
{
    public class EditViewModel
    {
        public string ModuleVersionId { get; set; }
        public string Name { get; set; }
        public string Version { get; set; }
        public ModuleType Type { get; set; }
        public string User1Blob { get; set; }
        public string User1File { get; set; }
        public string User2Blob { get; set; }
        public string User2File { get; set; }
    }
}