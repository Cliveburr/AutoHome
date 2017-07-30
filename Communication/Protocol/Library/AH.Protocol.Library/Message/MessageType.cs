namespace AH.Protocol.Library.Message
{
    public enum MessageType : byte
    {
        Nop = 0,
        InfoRequest = 1,
        InfoResponse = 2,
        ApiPing = 3,
        ApiPong = 4,
        WifiConfiguration = 5,
        ModuleMessage = 50
    }
}