namespace AH.Protocol.Library.Messages.AutoHome
{
    public enum AutoHomeMessageType : byte
    {
        Unkown = 0,
        PingRequest = 1,
        PongResponse = 2,
        ConfigurationReadRequest = 3,
        ConfigurationReadResponse = 4,
        ConfigurationSaveRequest = 5,
        ConfigurationSaveResponse = 6,
        UIDSaveRequest = 7,
        UIDSaveResponse = 8
    }
}