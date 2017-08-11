using Android.Graphics;

namespace AH.Interface.Android.Helpers
{
    public class ColorTransform
    {
        public Color Color { get; private set; }
        public long RedLen { get; private set; }
        public long GreenLen { get; private set; }
        public long BlueLen { get; private set; }

        public uint RedHigh { get; private set; }
        public uint RedLow { get; private set; }
        public uint GreenHigh { get; private set; }
        public uint GreenLow { get; private set; }
        public uint BlueHigh { get; private set; }
        public uint BlueLow { get; private set; }


        private ColorTransform()
        {
        }

        public static ColorTransform FromColor(Color color, long redLen, long greenLen, long blueLen)
        {
            var redHigh = (redLen * color.R) / 255;
            var redLow = redLen - redHigh;

            var greenHigh = (greenLen * color.G) / 255;
            var greenLow = greenLen - greenHigh;

            var blueHigh = (blueLen * color.B) / 255;
            var blueLow = blueLen - blueHigh;

            return new ColorTransform
            {
                Color = color,
                RedLen = redLen,
                GreenLen = greenLen,
                BlueLen = blueLen,
                RedHigh = (uint)redHigh,
                RedLow = (uint)redLow,
                GreenHigh = (uint)greenHigh,
                GreenLow = (uint)greenLow,
                BlueHigh = (uint)blueHigh,
                BlueLow = (uint)blueLow
            };
        }

        public static ColorTransform FromValues(uint redHigh, uint redLow, uint greenHigh, uint greenLow, uint blueHigh, uint blueLow)
        {
            var redLen = (long)(redHigh + redLow);
            var greenLen = (long)(greenHigh + greenLow);
            var blueLen = (long)(blueHigh + blueLow);

            var red = redLen > 0 ? (redHigh * 255) / redLen : 0;
            var green = greenLen > 0 ? (greenHigh * 255) / greenLen : 0;
            var blue = blueLen > 0 ? (blueHigh * 255) / blueLen : 0;

            return new ColorTransform
            {
                Color = new Color((byte)red, (byte)green, (byte)blue),
                RedLen = redLen,
                GreenLen = greenLen,
                BlueLen = blueLen,
                RedHigh = redHigh,
                RedLow = redLow,
                GreenHigh = greenHigh,
                GreenLow = greenLow,
                BlueHigh = blueHigh,
                BlueLow = blueLow
            };
        }
    }
}