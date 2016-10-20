namespace AH.Protocol.Library
{
    public enum MessageArriveCode
    {
        Ok,
        Timeout,
        ConfirmationWithoutWaiting
    }

    public delegate void MessageArriveDelegate(MessageArriveCode code, MessagePackage package);
}