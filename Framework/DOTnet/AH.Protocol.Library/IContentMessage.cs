using AH.Protocol.Library.Messages;
using System.IO;

namespace AH.Protocol.Library
{
    public interface IContentMessage
    {
        PortType Port { get; }
        byte Msg { get; }
        void Write(BinaryWriter stream);
        void Read(BinaryReader stream);
    }
}