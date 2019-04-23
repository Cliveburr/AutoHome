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
            var cicloRed = (uint)10000;
            var cicloGreen = (uint)10000;
            var cicloBlue = (uint)10000;

            var redHigh = (cicloRed * State.Red) / 255;
            var redLow = cicloRed - redHigh;

            var greenHigh = (cicloGreen * State.Green) / 255;
            var greenLow = cicloGreen - greenHigh;

            var blueHigh = (cicloBlue * State.Blue) / 255;
            var blueLow = cicloBlue - blueHigh;


            stream.Write(redLow);
            stream.Write(redHigh);
            stream.Write(greenLow);
            stream.Write(greenHigh);
            stream.Write(blueLow);
            stream.Write(blueHigh);
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