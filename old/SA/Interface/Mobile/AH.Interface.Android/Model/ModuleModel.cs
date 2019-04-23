using System.Net;
using AH.Protocol.Library;

namespace AH.Interface.Android.Model
{
    public class ModuleModel
    {
        public byte UID { get; set; }
        public string Alias { get; set; }
        public IPAddress Address { get; set; }
        public ModuleType Type { get; set; }
    }

    public class RgbLightValue
    {
        public byte Red { get; set; }
        public byte Green { get; set; }
        public byte Blue { get; set; }
    }

    public class RgbLightStandardList
    {
        public string Name { get; set; }
        public RgbLightValue RgbLightValue { get; set; }
    }
}