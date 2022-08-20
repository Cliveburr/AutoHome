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
        UIDSaveRequest = 6
    }
}