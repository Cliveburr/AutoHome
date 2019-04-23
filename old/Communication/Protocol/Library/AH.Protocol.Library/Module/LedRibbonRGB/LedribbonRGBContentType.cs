namespace AH.Protocol.Library.Module.LedRibbonRGB
{
    public enum LedribbonRGBContentType : byte
    {
        Nop = 0,
        StateRequest = 1,
        StateResponse = 2,
        StateChange = 3
    }
}