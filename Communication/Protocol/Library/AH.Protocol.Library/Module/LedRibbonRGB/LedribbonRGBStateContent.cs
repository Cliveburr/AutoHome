using AH.Protocol.Library.Message;
using AH.Protocol.Library.Value;
using System.IO;

namespace AH.Protocol.Library.Module.LedRibbonRGB
{
    public class LedribbonRGBStateContent : IContentMessage
    {
        public RgbLightValue State { get; private set; }

        public LedribbonRGBStateContent()
        {
        }

        public LedribbonRGBStateContent(RgbLightValue state)
        {
            State = state;
        }

        public void GetStream(BinaryWriter stream)
        {
            stream.Write(State.Red);
            stream.Write(State.Green);
            stream.Write(State.Blue);
        }

        public void Parse(BinaryReader stream)
        {
            State = new RgbLightValue
            {
                Red = stream.ReadByte(),
                Green = stream.ReadByte(),
                Blue = stream.ReadByte()
            };
        }
    }
}