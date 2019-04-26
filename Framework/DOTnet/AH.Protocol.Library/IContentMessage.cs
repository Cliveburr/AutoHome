using System.IO;

namespace AH.Protocol.Library
{
    public interface IContentMessage
    {
        byte Port { get; }
        byte Msg { get; }
        void Write(BinaryWriter stream);
        void Read(BinaryReader stream);
    }
}