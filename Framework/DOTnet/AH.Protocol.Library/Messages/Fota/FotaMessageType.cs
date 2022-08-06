namespace AH.Protocol.Library.Messages.Fota
{
    public enum FotaMessageType : byte
    {
        Unkown = 0,
        StateReadRequest = 1,
        StateReadResponse = 2,
        StartRequest = 3,
        StartResponse = 4,
        WriteRequest = 5,
        WriteResponse = 6
    }
}