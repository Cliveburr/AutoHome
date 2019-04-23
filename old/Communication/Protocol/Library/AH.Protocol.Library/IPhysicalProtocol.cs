using AH.Protocol.Library.Message;

namespace AH.Protocol.Library
{
    public delegate void ReceiverDelegate(MessageBase message);

    public interface IPhysicalProtocol
    {
        void Send(MessageBase message);
        event ReceiverDelegate Receiver;
    }
}