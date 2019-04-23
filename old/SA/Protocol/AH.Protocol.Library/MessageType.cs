namespace AH.Protocol.Library
{
    public enum MessageType : byte
    {
        Nop = 0,
        Ping = 1,
        Pong = 2,
        ConfigurationReadRequest = 3,
        ConfigurationReadResponse = 4,
        ConfigurationSaveRequest = 5,
        FotaStateReadRequest = 6,
        FotaStateReadResponse = 7,
        FotaStartRequest = 8,
        FotaWriteRequest = 9,
        FotaWriteResponse = 10,
        RGBLedRibbonReadStateRequest = 11,
        RGBLedRibbonReadStateResponse = 12,
        RGBLedRibbonChangeRequest = 13
    }
}
